import csv
import random
from datetime import datetime, timedelta

def generate_messy_churn_data(filename, num_records=2000):
    plans = [
        # (Plan Name, Avg Monthly Charge)
        ("Basic", 15.00),
        ("Standard", 39.00),
        ("Premium", 79.00)
    ]
    
    billing_cycles = ["Monthly", "Annual"]
    regions = ["North", "South", "East", "West"]
    churn_reasons = ["Price", "Competitor", "Product Bug", "Customer Support", "No_Reason"]
    
    # Variations to simulate real-world spelling/formatting issues
    plan_variations = {
        "Basic": ["Basic", "basic", "BASIC", "  Basic "],
        "Standard": ["Standard", "standard", "STANDARD", "Standard  "],
        "Premium": ["Premium", "premium", "PREMIUM"]
    }
    
    churn_variations = {
        "Yes": ["Yes", "yes", "YES", "Yes "],
        "No": ["No", "no", "NO", " No"]
    }

    start_date = datetime(2024, 1, 1)
    
    headers = [
        "Customer_ID", "Signup_Date", "Plan_Type", "Billing_Cycle", 
        "Tenure_Months", "Monthly_Charges", "Churn_Status", 
        "Churn_Reason", "Region"
    ]

    records = []
    
    for i in range(1, num_records + 1):
        cust_id = f"CUST-{20000 + i}"
        
        # Signup date generation
        days_offset = random.randint(0, 500)  # Spread across 2024 and mid 2025
        signup_dt = start_date + timedelta(days=days_offset)
        
        # Mix date formats
        date_rand = random.random()
        if date_rand < 0.75:
            date_str = signup_dt.strftime("%Y-%m-%d")
        elif date_rand < 0.90:
            date_str = signup_dt.strftime("%d/%m/%Y")
        else:
            date_str = "" if random.random() < 0.5 else "INVALID_DATE"
            
        plan_name, avg_charge = random.choice(plans)
        plan_type = random.choice(plan_variations[plan_name])
        
        # Billing cycle with some missing data
        billing_rand = random.random()
        if billing_rand < 0.05:
            billing_cycle = ""
        else:
            billing_cycle = random.choice(billing_cycles)
            
        # Tenure anomalies
        tenure_rand = random.random()
        if tenure_rand < 0.02:
            tenure_months = -1 * random.randint(1, 12) # Negative tenure
        elif tenure_rand < 0.03:
            tenure_months = "" # Missing tenure
        else:
            # Tenure ranges from 0 to 24 months
            tenure_months = random.randint(0, 24)
            
        # Monthly Charges
        charges_rand = random.random()
        if charges_rand < 0.02:
            monthly_charges = "" # Missing charges
        else:
            monthly_charges = round(avg_charge * random.uniform(0.95, 1.05), 2)
            
        # Churn probability based on tenure, plan, and billing cycle
        # Monthly billing, basic plans, and low tenure tend to churn more
        churn_prob = 0.25
        if billing_cycle == "Monthly":
            churn_prob += 0.15
        if plan_name == "Basic":
            churn_prob += 0.10
        if isinstance(tenure_months, int) and tenure_months < 6:
            churn_prob += 0.20
            
        is_churned = random.random() < churn_prob
        
        if is_churned:
            churn_status = random.choice(churn_variations["Yes"])
            churn_reason = random.choice(churn_reasons)
        else:
            churn_status = random.choice(churn_variations["No"])
            churn_reason = "N/A"
            
        region = random.choice(regions)
        
        record = [
            cust_id, date_str, plan_type, billing_cycle,
            tenure_months, monthly_charges, churn_status,
            churn_reason, region
        ]
        records.append(record)
        
    # Inject Duplicate rows (about 4% duplicates)
    num_duplicates = int(num_records * 0.04)
    for _ in range(num_duplicates):
        dup_record = random.choice(records).copy()
        records.insert(random.randint(0, len(records)), dup_record)
        
    # Write to CSV
    with open(filename, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(records)
        
    print(f"Generated raw customer data file with {len(records)} records at: {filename}")

if __name__ == "__main__":
    generate_messy_churn_data("raw_customer_data.csv", 2000)
