import csv
import json
import os
from datetime import datetime

def parse_date(date_str):
    """Try to parse date using multiple formats. Returns ISO date string or None."""
    if not date_str or date_str.upper() in ["INVALID_DATE", "NULL", "NAN", ""]:
        return None
    
    # Try different formats
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y"]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            # Ensure it's in a reasonable range
            if 2020 <= dt.year <= 2026:
                return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def clean_sales_data(raw_file, cleaned_csv_file, dashboard_js_file):
    if not os.path.exists(raw_file):
        print(f"Error: Raw data file {raw_file} not found.")
        return

    # Metrics counter
    metrics = {
        "raw_records_count": 0,
        "duplicates_removed": 0,
        "invalid_dates_removed": 0,
        "invalid_quantities_removed": 0,
        "prices_imputed": 0,
        "invalid_records_removed": 0,
        "cleaned_records_count": 0
    }

    # Step 1: Read raw data
    raw_rows = []
    with open(raw_file, mode='r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_rows.append(row)
            metrics["raw_records_count"] += 1

    # Keep a preview of the first 50 raw rows for the dashboard comparison
    raw_preview = raw_rows[:50]

    # Step 2: Deduplication
    # We will define a unique key for deduplication as the tuple of all fields
    unique_rows = []
    seen_rows = set()
    
    for row in raw_rows:
        # Create a frozen representation of the row
        row_tuple = tuple((k, v) for k, v in sorted(row.items()))
        if row_tuple in seen_rows:
            metrics["duplicates_removed"] += 1
        else:
            seen_rows.add(row_tuple)
            unique_rows.append(row)

    # Step 3: Compute median/average price for each product to impute missing prices
    product_prices = {}
    for row in unique_rows:
        prod_name = row["Product_Name"].strip()
        price_str = row["Unit_Price"]
        try:
            price = float(price_str)
            if price > 0:
                if prod_name not in product_prices:
                    product_prices[prod_name] = []
                product_prices[prod_name].append(price)
        except (ValueError, TypeError):
            continue

    # Calculate average price per product
    product_avg_price = {}
    for prod_name, prices in product_prices.items():
        product_avg_price[prod_name] = round(sum(prices) / len(prices), 2)
    # Global default if product price is completely unknown
    global_avg_price = round(sum(product_avg_price.values()) / len(product_avg_price), 2) if product_avg_price else 50.0

    # Step 4: Cleaning and Preprocessing
    cleaned_rows = []
    
    # Canonical mappings
    category_map = {
        "tech": "Technology",
        "technology": "Technology",
        "furniture": "Furniture",
        "office supplies": "Office Supplies",
        "off_supplies": "Office Supplies",
        "office supplies": "Office Supplies"
    }
    
    region_map = {
        "north": "North",
        "south": "South",
        "east": "East",
        "west": "West"
    }

    for row in unique_rows:
        # 4.1 Parse and validate Date
        clean_date = parse_date(row["Date"])
        if not clean_date:
            metrics["invalid_dates_removed"] += 1
            metrics["invalid_records_removed"] += 1
            continue

        # 4.2 Standardize Category
        raw_cat = row["Category"].strip().lower()
        clean_category = category_map.get(raw_cat, row["Category"].strip())
        # Clean spelling check
        if "tech" in raw_cat:
            clean_category = "Technology"
        elif "furn" in raw_cat:
            clean_category = "Furniture"
        elif "supp" in raw_cat or "off" in raw_cat:
            clean_category = "Office Supplies"

        # 4.3 Standardize Region
        raw_region = row["Region"].strip().lower()
        clean_region = region_map.get(raw_region, row["Region"].strip().title())

        # 4.4 Clean and validate Quantity
        qty_str = row["Quantity"].strip()
        try:
            if not qty_str:
                raise ValueError("Empty quantity")
            quantity = int(qty_str)
            if quantity <= 0:
                raise ValueError("Non-positive quantity")
        except ValueError:
            metrics["invalid_quantities_removed"] += 1
            metrics["invalid_records_removed"] += 1
            continue

        # 4.5 Clean and validate Unit Price (Impute if missing or <= 0)
        price_str = row["Unit_Price"].strip()
        prod_name = row["Product_Name"].strip()
        try:
            if not price_str:
                raise ValueError("Empty price")
            unit_price = float(price_str)
            if unit_price <= 0:
                raise ValueError("Non-positive price")
        except ValueError:
            # Impute the price
            unit_price = product_avg_price.get(prod_name, global_avg_price)
            metrics["prices_imputed"] += 1

        # 4.6 Cost Percentage and Financial Math
        try:
            cost_pct = float(row["Cost_Percentage"])
            if not (0 < cost_pct < 1):
                cost_pct = 0.60 # fallback default cost ratio
        except (ValueError, TypeError):
            cost_pct = 0.60

        # Calculations
        revenue = round(quantity * unit_price, 2)
        cost = round(revenue * cost_pct, 2)
        profit = round(revenue - cost, 2)

        # Assemble clean record
        cleaned_row = {
            "Transaction_ID": row["Transaction_ID"],
            "Date": clean_date,
            "Customer_ID": row["Customer_ID"],
            "Segment": row["Segment"].strip(),
            "Product_Name": prod_name,
            "Category": clean_category,
            "Quantity": quantity,
            "Unit_Price": unit_price,
            "Revenue": revenue,
            "Cost": cost,
            "Profit": profit,
            "Region": clean_region
        }
        cleaned_rows.append(cleaned_row)
        metrics["cleaned_records_count"] += 1

    # Step 5: Save Cleaned CSV
    headers = [
        "Transaction_ID", "Date", "Customer_ID", "Segment",
        "Product_Name", "Category", "Quantity", "Unit_Price",
        "Revenue", "Cost", "Profit", "Region"
    ]
    with open(cleaned_csv_file, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in cleaned_rows:
            writer.writerow(row)

    # Step 6: Save JS file for zero-dependency local loading
    js_content = f"""// Generated Business Sales Performance Analytics Dataset
const RAW_METRICS = {json.dumps(metrics, indent=2)};
const RAW_DATA_PREVIEW = {json.dumps(raw_preview, indent=2)};
const CLEANED_DATA = {json.dumps(cleaned_rows, indent=2)};
"""
    with open(dashboard_js_file, mode='w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Cleaning complete.")
    print(f"Metrics: {json.dumps(metrics, indent=2)}")
    print(f"Cleaned CSV saved to: {cleaned_csv_file}")
    print(f"Dashboard data JS saved to: {dashboard_js_file}")

if __name__ == "__main__":
    clean_sales_data("raw_sales_data.csv", "cleaned_sales_data.csv", "dashboard_data.js")
