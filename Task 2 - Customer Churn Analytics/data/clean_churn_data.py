import csv
import json
import os
from datetime import datetime

def parse_date(date_str):
    if not date_str or date_str.upper() in ["INVALID_DATE", "NULL", "NAN", ""]:
        return None
    
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y"]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            if 2020 <= dt.year <= 2026:
                return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def clean_customer_data(raw_file, cleaned_csv_file, dashboard_js_file):
    if not os.path.exists(raw_file):
        print(f"Error: Raw customer file {raw_file} not found.")
        return

    metrics = {
        "raw_records_count": 0,
        "duplicates_removed": 0,
        "invalid_dates_removed": 0,
        "invalid_tenures_removed": 0,
        "charges_imputed": 0,
        "billing_cycles_imputed": 0,
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

    raw_preview = raw_rows[:50]

    # Step 2: Deduplication
    unique_rows = []
    seen_rows = set()
    for row in raw_rows:
        row_tuple = tuple((k, v) for k, v in sorted(row.items()))
        if row_tuple in seen_rows:
            metrics["duplicates_removed"] += 1
        else:
            seen_rows.add(row_tuple)
            unique_rows.append(row)

    # Average charges per plan type to impute missing charges
    plan_averages = {
        "Basic": 15.00,
        "Standard": 39.00,
        "Premium": 79.00
    }

    # Step 3: Cleaning
    cleaned_rows = []
    for row in unique_rows:
        # 3.1 Validate Signup Date
        clean_date = parse_date(row["Signup_Date"])
        if not clean_date:
            metrics["invalid_dates_removed"] += 1
            metrics["invalid_records_removed"] += 1
            continue

        # 3.2 Standardize Plan Type
        raw_plan = row["Plan_Type"].strip().lower()
        clean_plan = "Standard"
        if "basic" in raw_plan:
            clean_plan = "Basic"
        elif "prem" in raw_plan:
            clean_plan = "Premium"
        elif "stand" in raw_plan:
            clean_plan = "Standard"

        # 3.3 Impute Billing Cycle
        billing = row["Billing_Cycle"].strip()
        if not billing:
            billing = "Monthly"
            metrics["billing_cycles_imputed"] += 1

        # 3.4 Validate Tenure Months
        tenure_str = row["Tenure_Months"].strip()
        try:
            if not tenure_str:
                raise ValueError("Empty tenure")
            tenure_months = int(tenure_str)
            if tenure_months < 0:
                raise ValueError("Negative tenure")
        except ValueError:
            metrics["invalid_tenures_removed"] += 1
            metrics["invalid_records_removed"] += 1
            continue

        # 3.5 Validate Monthly Charges
        charges_str = row["Monthly_Charges"].strip()
        try:
            if not charges_str:
                raise ValueError("Empty charges")
            monthly_charges = float(charges_str)
            if monthly_charges <= 0:
                raise ValueError("Non-positive charges")
        except ValueError:
            monthly_charges = plan_averages.get(clean_plan, 39.00)
            metrics["charges_imputed"] += 1

        # 3.6 Standardize Churn Flag & Reason
        raw_churn = row["Churn_Status"].strip().lower()
        clean_churn = "No"
        if "yes" in raw_churn or "y" == raw_churn:
            clean_churn = "Yes"
        elif "no" in raw_churn or "n" == raw_churn:
            clean_churn = "No"

        clean_reason = row["Churn_Reason"].strip()
        if clean_churn == "No":
            clean_reason = "N/A"
        elif clean_churn == "Yes" and (not clean_reason or clean_reason == "N/A"):
            clean_reason = "No_Reason"

        # 3.7 Feature Engineering: Customer Lifetime Value (LTV)
        ltv = round(tenure_months * monthly_charges, 2)

        cleaned_row = {
            "Customer_ID": row["Customer_ID"],
            "Signup_Date": clean_date,
            "Plan_Type": clean_plan,
            "Billing_Cycle": billing,
            "Tenure_Months": tenure_months,
            "Monthly_Charges": monthly_charges,
            "Churn_Status": clean_churn,
            "Churn_Reason": clean_reason,
            "LTV": ltv,
            "Region": row["Region"].strip().title()
        }
        cleaned_rows.append(cleaned_row)
        metrics["cleaned_records_count"] += 1

    # Step 4: Write Cleaned CSV
    headers = [
        "Customer_ID", "Signup_Date", "Plan_Type", "Billing_Cycle",
        "Tenure_Months", "Monthly_Charges", "Churn_Status",
        "Churn_Reason", "LTV", "Region"
    ]
    with open(cleaned_csv_file, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in cleaned_rows:
            writer.writerow(row)

    # Step 5: Cohort Survival Curve Computation
    # For tenure months 0 to 24, calculate how many customers survived
    # Active customers: Churn_Status == "No" (they have survived at least their current tenure)
    # Churned customers: survived up to their Tenure_Months, and then left
    # Survival Rate at month T = (Number of customers who stayed active >= T months) / (Total customers who could reach T)
    survival_data = []
    
    # Calculate for each month
    for month in range(25):
        # Total who reached or passed this month
        reached = sum(1 for r in cleaned_rows if r["Tenure_Months"] >= month)
        # Active at this month or later
        active = sum(1 for r in cleaned_rows if r["Tenure_Months"] >= month and (r["Churn_Status"] == "No" or r["Tenure_Months"] > month))
        
        # Simple survival rate
        total_cohort = len(cleaned_rows)
        # Of all customers, how many survived at least T months
        retained = sum(1 for r in cleaned_rows if r["Tenure_Months"] >= month)
        rate = round((retained / total_cohort) * 100, 1) if total_cohort > 0 else 0
        
        survival_data.append({
            "Month": month,
            "Retained_Count": retained,
            "Survival_Rate": rate
        })

    # Step 6: Write to JS file
    js_content = f"""// Generated Customer Churn & Retention Analytics Dataset
const RAW_METRICS = {json.dumps(metrics, indent=2)};
const RAW_DATA_PREVIEW = {json.dumps(raw_preview, indent=2)};
const CLEANED_DATA = {json.dumps(cleaned_rows, indent=2)};
const SURVIVAL_DATA = {json.dumps(survival_data, indent=2)};
"""
    with open(dashboard_js_file, mode='w', encoding='utf-8') as f:
        f.write(js_content)

    print("Customer Churn cleaning completed successfully.")
    print(f"Metrics: {json.dumps(metrics, indent=2)}")

if __name__ == "__main__":
    clean_customer_data("raw_customer_data.csv", "cleaned_customer_data.csv", "dashboard_data.js")
