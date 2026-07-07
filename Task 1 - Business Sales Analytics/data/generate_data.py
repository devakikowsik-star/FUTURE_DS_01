import csv
import random
from datetime import datetime, timedelta

def generate_messy_data(filename, num_records=2000):
    products = [
        # (Product Name, Category, Avg Unit Price, Cost Ratio)
        ("Pro Laptop 15", "Technology", 1200.0, 0.70),
        ("Wireless Mouse M2", "Technology", 25.0, 0.40),
        ("Ergonomic Chair", "Furniture", 250.0, 0.65),
        ("Executive Wooden Desk", "Furniture", 450.0, 0.60),
        ("Gel Pens (Pack of 12)", "Office Supplies", 15.0, 0.30),
        ("Sticky Notes Pastel", "Office Supplies", 8.0, 0.25),
        ("UltraWide Monitor 34", "Technology", 400.0, 0.72),
        ("Filing Cabinet 3-Drawer", "Furniture", 150.0, 0.55),
        ("Premium Notebook A5", "Office Supplies", 12.0, 0.35),
        ("Smart Bluetooth Speaker", "Technology", 80.0, 0.50),
        ("Standing Desk Frame", "Furniture", 300.0, 0.60),
        ("High-Speed USB-C Cable", "Technology", 18.0, 0.30),
    ]

    regions = ["North", "South", "East", "West"]
    segments = ["Consumer", "Corporate", "Home Office"]
    
    # Variations for categories to simulate real-world spelling issues
    category_variations = {
        "Technology": ["Technology", "Tech", "TECHNOLOGY", "  Technology "],
        "Furniture": ["Furniture", "furniture", "FURNITURE", "Furniture  "],
        "Office Supplies": ["Office Supplies", "off_supplies", "Office supplies", "OFFICE SUPPLIES"]
    }
    
    # Variations for regions
    region_variations = {
        "North": ["North", "north", "NORTH"],
        "South": ["South", "south", "SOUTH"],
        "East": ["East", "east", "EAST", " East "],
        "West": ["West", "west", "WEST"]
    }

    start_date = datetime(2025, 1, 1)
    
    headers = [
        "Transaction_ID", "Date", "Customer_ID", "Segment", 
        "Product_Name", "Category", "Quantity", "Unit_Price", 
        "Cost_Percentage", "Region"
    ]

    records = []
    
    # We will generate a base set of records, and then inject anomalies
    for i in range(1, num_records + 1):
        txn_id = f"TXN-{10000 + i}"
        
        # Date generation with some variations
        days_offset = random.randint(0, 364)  # Spread across 2025
        order_date = start_date + timedelta(days=days_offset)
        
        # Mix in different date formats
        date_rand = random.random()
        if date_rand < 0.70:
            date_str = order_date.strftime("%Y-%m-%d") # Standard
        elif date_rand < 0.85:
            date_str = order_date.strftime("%d/%m/%Y") # DD/MM/YYYY
        elif date_rand < 0.95:
            date_str = order_date.strftime("%Y/%m/%d") # YYYY/MM/DD
        else:
            # Missing or malformed
            date_str = "" if random.random() < 0.5 else "INVALID_DATE"
            
        cust_id = f"CUST-{1000 + random.randint(1, 150)}"
        segment = random.choice(segments)
        
        prod_name, orig_category, base_price, cost_ratio = random.choice(products)
        
        # Category with variation
        category = random.choice(category_variations[orig_category])
        
        # Quantity anomalies
        qty_rand = random.random()
        if qty_rand < 0.02:
            quantity = -1 * random.randint(1, 5) # Negative quantity
        elif qty_rand < 0.04:
            quantity = "" # Missing quantity
        else:
            quantity = random.randint(1, 10)
            
        # Unit Price anomalies
        price_rand = random.random()
        if price_rand < 0.02:
            unit_price = "" # Missing price
        elif price_rand < 0.03:
            unit_price = 0.0 # Zero price
        else:
            # Add small random price fluctuation
            unit_price = round(base_price * random.uniform(0.95, 1.05), 2)
            
        # Cost ratio
        cost_percentage = round(cost_ratio * random.uniform(0.98, 1.02), 4)
        
        # Region variations
        orig_region = random.choice(regions)
        region = random.choice(region_variations[orig_region])
        
        # Normal record structure
        record = [
            txn_id, date_str, cust_id, segment,
            prod_name, category, quantity, unit_price,
            cost_percentage, region
        ]
        
        records.append(record)
        
    # Inject Duplicate rows (about 3% duplicates)
    num_duplicates = int(num_records * 0.03)
    for _ in range(num_duplicates):
        dup_record = random.choice(records).copy()
        # Insert at random index
        records.insert(random.randint(0, len(records)), dup_record)
        
    # Write to CSV
    with open(filename, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(records)
        
    print(f"Generated raw data file with {len(records)} records (including duplicates and anomalies) at: {filename}")

if __name__ == "__main__":
    generate_messy_data("raw_sales_data.csv", 2000)
