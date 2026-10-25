import csv
import random
from datetime import datetime, timedelta

def generate_datasets():
    random.seed(42)
    
    products = [
        {"name": "UltraBook Pro 15", "category": "Electronics", "unit_price": 75000, "cost": 52000},
        {"name": "Ergonomic Office Chair", "category": "Furniture", "unit_price": 12500, "cost": 7500},
        {"name": "Wireless Noise-Cancelling Headphones", "category": "Electronics", "unit_price": 9999, "cost": 5500},
        {"name": "Mechanical Gaming Keyboard", "category": "Electronics", "unit_price": 4500, "cost": 2200},
        {"name": "Standing Desk Converter", "category": "Furniture", "unit_price": 18000, "cost": 11000},
        {"name": "4K Ultra-HD Monitor 27-inch", "category": "Electronics", "unit_price": 28999, "cost": 19500},
        {"name": "Smart Fitness Band", "category": "Wearables", "unit_price": 3299, "cost": 1600},
        {"name": "USB-C Multi-Port Hub", "category": "Accessories", "unit_price": 2499, "cost": 950},
        {"name": "Premium Leather Laptop Bag", "category": "Accessories", "unit_price": 3499, "cost": 1400},
        {"name": "True Wireless Earbuds", "category": "Electronics", "unit_price": 4999, "cost": 2300},
    ]
    
    # 1. Clean Demo Data (covering 12 months, multiple items per order)
    start_date = datetime(2025, 1, 1)
    orders = []
    order_id_counter = 1001
    
    for day in range(365):
        current_date = start_date + timedelta(days=day)
        # Sales volume higher on weekends and festive months (Oct, Nov, Dec)
        month = current_date.month
        month_boost = 1.6 if month in [10, 11, 12] else (1.3 if month in [3, 7] else 1.0)
        daily_order_count = int(random.randint(1, 4) * month_boost)
        
        for _ in range(daily_order_count):
            order_id = f"ORD-{order_id_counter}"
            order_id_counter += 1
            # 1 to 3 items per order
            num_items = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
            selected_products = random.sample(products, num_items)
            
            for prod in selected_products:
                qty = random.choices([1, 2, 3, 5], weights=[0.7, 0.2, 0.07, 0.03])[0]
                # Discount percentage 0, 5, 10, 15
                discount_pct = random.choices([0.0, 5.0, 10.0, 15.0], weights=[0.5, 0.3, 0.15, 0.05])[0]
                orders.append({
                    "Order_ID": order_id,
                    "Date": current_date.strftime("%Y-%m-%d"),
                    "Product": prod["name"],
                    "Category": prod["category"],
                    "Quantity": qty,
                    "Unit_Price": prod["unit_price"],
                    "Discount_Percent": discount_pct,
                    "Unit_Cost": prod["cost"]
                })
                
    # Write clean CSV
    with open("sample_data/demo_sales.csv", "w", newline="", encoding="utf-8") as f:
        fieldnames = ["Order_ID", "Date", "Product", "Category", "Quantity", "Unit_Price", "Discount_Percent", "Unit_Cost"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(orders)
        
    print(f"Generated clean dataset: {len(orders)} rows in sample_data/demo_sales.csv")
    
    # 2. Dataset with realistic quality issues to test validation engine
    dirty_records = orders[:200].copy()
    # Add intentional bad rows:
    dirty_records.append({
        "Order_ID": "ORD-99901", "Date": "2025-05-15", "Product": "Broken Widget",
        "Category": "Accessories", "Quantity": -2, "Unit_Price": 1500, "Discount_Percent": 0, "Unit_Cost": 800
    }) # Negative quantity
    dirty_records.append({
        "Order_ID": "ORD-99902", "Date": "invalid-date-format", "Product": "Wireless Mouse",
        "Category": "Accessories", "Quantity": 1, "Unit_Price": 1200, "Discount_Percent": 0, "Unit_Cost": 600
    }) # Invalid date
    dirty_records.append({
        "Order_ID": "ORD-99903", "Date": "2025-06-10", "Product": "",
        "Category": "Accessories", "Quantity": 3, "Unit_Price": 500, "Discount_Percent": 0, "Unit_Cost": 200
    }) # Missing product name
    dirty_records.append({
        "Order_ID": "ORD-99904", "Date": "2025-07-01", "Product": "USB Cable",
        "Category": "Accessories", "Quantity": 2, "Unit_Price": -100, "Discount_Percent": 0, "Unit_Cost": 50
    }) # Negative unit price
    dirty_records.append({
        "Order_ID": "ORD-99905", "Date": "2025-07-02", "Product": "Webcam HD",
        "Category": "Electronics", "Quantity": "three", "Unit_Price": 2500, "Discount_Percent": 0, "Unit_Cost": 1200
    }) # Non-numeric quantity
    dirty_records.append(dirty_records[10].copy()) # Exact duplicate row
    
    with open("sample_data/demo_sales_with_issues.csv", "w", newline="", encoding="utf-8") as f:
        fieldnames = ["Order_ID", "Date", "Product", "Category", "Quantity", "Unit_Price", "Discount_Percent", "Unit_Cost"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dirty_records)
        
    print(f"Generated test dataset with data quality issues: {len(dirty_records)} rows in sample_data/demo_sales_with_issues.csv")

if __name__ == "__main__":
    generate_datasets()
