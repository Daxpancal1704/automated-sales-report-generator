import io
import csv
import pandas as pd
from typing import List, Dict, Any
from app.utils.security import sanitize_for_spreadsheet

def generate_cleaned_csv(df: pd.DataFrame) -> str:
    """Export cleaned accepted sales data as CSV with formula injection protection."""
    if df.empty:
        return ""

    output = io.StringIO()
    # Define columns to export
    cols = [
        "order_id", "date", "product", "category", "quantity", "unit_price",
        "discount_amount", "gross_sales", "net_sales"
    ]
    if "unit_cost" in df.columns and df["unit_cost"].notna().any():
        cols.extend(["unit_cost", "total_cost", "profit"])

    present_cols = [c for c in cols if c in df.columns]
    writer = csv.writer(output, lineterminator="\n")
    
    # Write header
    writer.writerow([c.upper() for c in present_cols])
    
    for _, row in df.iterrows():
        row_values = []
        for c in present_cols:
            val = row.get(c)
            if pd.isna(val) or val is None:
                row_values.append("")
            else:
                row_values.append(sanitize_for_spreadsheet(val))
        writer.writerow(row_values)
        
    return output.getvalue()

def generate_validation_issues_csv(rejected_records: List[Dict[str, Any]]) -> str:
    """Export detailed rejection and validation errors as CSV."""
    if not rejected_records:
        return "row_number,order_id,rejection_reason\n"

    output = io.StringIO()
    # Find all unique keys across rejected records
    fieldnames = ["row_number", "order_id", "reason"]
    for r in rejected_records:
        for k in r.keys():
            if k not in fieldnames:
                fieldnames.append(k)

    writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator="\n", extrasaction="ignore")
    writer.writeheader()
    for r in rejected_records:
        sanitized_r = {k: sanitize_for_spreadsheet(v) for k, v in r.items()}
        writer.writerow(sanitized_r)

    return output.getvalue()
