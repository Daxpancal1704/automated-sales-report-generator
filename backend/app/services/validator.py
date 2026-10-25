import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from app.models.schemas import ColumnMapping, ValidationSummary, ValidationIssue

def validate_and_clean_dataset(
    df: pd.DataFrame,
    mapping: ColumnMapping
) -> Tuple[pd.DataFrame, ValidationSummary, List[Dict[str, Any]]]:
    """
    Validate the raw DataFrame against mapped columns and business rules.
    Returns:
      - cleaned_df: DataFrame with standardized columns and valid data types.
      - summary: ValidationSummary with metrics and rejection reasons.
      - rejected_audit: List of rejected row dicts for export / inspection.
    """
    total_rows = len(df)
    rejected_rows: List[Dict[str, Any]] = []
    issues: List[ValidationIssue] = []
    rejection_reasons_counter: Dict[str, int] = {}
    warnings: List[str] = []

    # Verify that required columns exist in df
    required_fields = [
        ("date", mapping.date),
        ("product", mapping.product),
        ("quantity", mapping.quantity),
        ("unit_price", mapping.unit_price)
    ]
    for field_name, col_name in required_fields:
        if not col_name or col_name not in df.columns:
            raise ValueError(f"Required mapping for '{field_name}' mapped to '{col_name}' was not found in dataset columns.")

    # Track indices of valid rows
    valid_indices = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 1
        row_id_val = str(row[mapping.order_id]) if mapping.order_id and mapping.order_id in df.columns and pd.notna(row[mapping.order_id]) else None
        
        # 1. Check Product Name
        prod_val = row[mapping.product]
        if pd.isna(prod_val) or str(prod_val).strip() == "":
            reason = "Missing or empty Product Name"
            rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
            issue = ValidationIssue(
                row_index=row_num,
                row_identifier=row_id_val,
                field="product",
                issue_type="error",
                reason=reason,
                raw_data=row.to_dict()
            )
            issues.append(issue)
            rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
            continue

        # 2. Check Date
        date_raw = row[mapping.date]
        if pd.isna(date_raw) or str(date_raw).strip() == "":
            reason = "Missing Date value"
            rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
            issue = ValidationIssue(
                row_index=row_num,
                row_identifier=row_id_val,
                field="date",
                issue_type="error",
                reason=reason,
                raw_data=row.to_dict()
            )
            issues.append(issue)
            rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
            continue

        try:
            parsed_date = pd.to_datetime(date_raw, errors="raise")
            # Extract date-only representation (YYYY-MM-DD)
            clean_date_str = parsed_date.strftime("%Y-%m-%d")
        except Exception:
            reason = f"Invalid date format or unparseable date '{date_raw}'"
            rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
            issue = ValidationIssue(
                row_index=row_num,
                row_identifier=row_id_val,
                field="date",
                issue_type="error",
                reason=reason,
                raw_data=row.to_dict()
            )
            issues.append(issue)
            rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
            continue

        # 3. Check Quantity
        qty_raw = row[mapping.quantity]
        try:
            qty_num = float(qty_raw)
            if np.isnan(qty_num) or qty_num <= 0:
                reason = f"Quantity must be strictly positive (> 0), got '{qty_raw}'"
                rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
                issue = ValidationIssue(
                    row_index=row_num,
                    row_identifier=row_id_val,
                    field="quantity",
                    issue_type="error",
                    reason=reason,
                    raw_data=row.to_dict()
                )
                issues.append(issue)
                rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
                continue
        except (ValueError, TypeError):
            reason = f"Non-numeric Quantity value '{qty_raw}'"
            rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
            issue = ValidationIssue(
                row_index=row_num,
                row_identifier=row_id_val,
                field="quantity",
                issue_type="error",
                reason=reason,
                raw_data=row.to_dict()
            )
            issues.append(issue)
            rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
            continue

        # 4. Check Unit Price
        price_raw = row[mapping.unit_price]
        try:
            price_num = float(price_raw)
            if np.isnan(price_num) or price_num < 0:
                reason = f"Unit Price cannot be negative, got '{price_raw}'"
                rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
                issue = ValidationIssue(
                    row_index=row_num,
                    row_identifier=row_id_val,
                    field="unit_price",
                    issue_type="error",
                    reason=reason,
                    raw_data=row.to_dict()
                )
                issues.append(issue)
                rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
                continue
        except (ValueError, TypeError):
            reason = f"Non-numeric Unit Price value '{price_raw}'"
            rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
            issue = ValidationIssue(
                row_index=row_num,
                row_identifier=row_id_val,
                field="unit_price",
                issue_type="error",
                reason=reason,
                raw_data=row.to_dict()
            )
            issues.append(issue)
            rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
            continue

        # 5. Optional Discount validation
        discount_val = 0.0
        if mapping.discount and mapping.discount in df.columns:
            disc_raw = row[mapping.discount]
            if pd.notna(disc_raw) and str(disc_raw).strip() != "":
                try:
                    disc_num = float(disc_raw)
                    if disc_num < 0:
                        reason = f"Discount cannot be negative, got '{disc_raw}'"
                        rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
                        issue = ValidationIssue(
                            row_index=row_num,
                            row_identifier=row_id_val,
                            field="discount",
                            issue_type="error",
                            reason=reason,
                            raw_data=row.to_dict()
                        )
                        issues.append(issue)
                        rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
                        continue
                    if mapping.discount_type == "percent" and disc_num > 100.0:
                        reason = f"Discount percentage exceeds 100%, got '{disc_raw}%'"
                        rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
                        issue = ValidationIssue(
                            row_index=row_num,
                            row_identifier=row_id_val,
                            field="discount",
                            issue_type="error",
                            reason=reason,
                            raw_data=row.to_dict()
                        )
                        issues.append(issue)
                        rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
                        continue
                    discount_val = disc_num
                except (ValueError, TypeError):
                    reason = f"Non-numeric Discount value '{disc_raw}'"
                    rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
                    issue = ValidationIssue(
                        row_index=row_num,
                        row_identifier=row_id_val,
                        field="discount",
                        issue_type="error",
                        reason=reason,
                        raw_data=row.to_dict()
                    )
                    issues.append(issue)
                    rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
                    continue

        # 6. Optional Unit Cost validation
        cost_val = None
        if mapping.cost and mapping.cost in df.columns:
            c_raw = row[mapping.cost]
            if pd.notna(c_raw) and str(c_raw).strip() != "":
                try:
                    c_num = float(c_raw)
                    if c_num < 0:
                        reason = f"Unit Cost cannot be negative, got '{c_raw}'"
                        rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
                        issue = ValidationIssue(
                            row_index=row_num,
                            row_identifier=row_id_val,
                            field="cost",
                            issue_type="error",
                            reason=reason,
                            raw_data=row.to_dict()
                        )
                        issues.append(issue)
                        rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
                        continue
                    cost_val = c_num
                except (ValueError, TypeError):
                    reason = f"Non-numeric Unit Cost value '{c_raw}'"
                    rejection_reasons_counter[reason] = rejection_reasons_counter.get(reason, 0) + 1
                    issue = ValidationIssue(
                        row_index=row_num,
                        row_identifier=row_id_val,
                        field="cost",
                        issue_type="error",
                        reason=reason,
                        raw_data=row.to_dict()
                    )
                    issues.append(issue)
                    rejected_rows.append({"row_number": row_num, "order_id": row_id_val, "reason": reason, **row.to_dict()})
                    continue

        valid_indices.append(idx)

    # Filter accepted rows
    accepted_df = df.loc[valid_indices].copy()
    
    # Check for duplicate rows in accepted data
    dup_mask = accepted_df.duplicated(keep="first")
    duplicate_count = int(dup_mask.sum())
    if duplicate_count > 0:
        warnings.append(f"Detected {duplicate_count} exact duplicate record(s) in uploaded dataset.")

    # Build standardized clean dataframe
    clean_records = []
    for idx in valid_indices:
        r = df.loc[idx]
        
        parsed_dt = pd.to_datetime(r[mapping.date])
        date_str = parsed_dt.strftime("%Y-%m-%d")
        month_str = parsed_dt.strftime("%Y-%m")
        year_str = parsed_dt.strftime("%Y")
        
        prod_name = str(r[mapping.product]).strip()
        qty = float(r[mapping.quantity])
        unit_price = float(r[mapping.unit_price])
        gross_sales = qty * unit_price
        
        # Calculate discount
        disc_amt = 0.0
        if mapping.discount and mapping.discount in df.columns:
            raw_d = r[mapping.discount]
            if pd.notna(raw_d):
                d_val = float(raw_d)
                if mapping.discount_type == "percent":
                    disc_amt = gross_sales * (d_val / 100.0)
                else:
                    disc_amt = min(gross_sales, d_val)
                    
        net_sales = max(0.0, gross_sales - disc_amt)
        
        # Optional cost and profit
        unit_cost = None
        total_cost = None
        profit = None
        if mapping.cost and mapping.cost in df.columns and pd.notna(r[mapping.cost]):
            unit_cost = float(r[mapping.cost])
            total_cost = qty * unit_cost
            profit = net_sales - total_cost

        # Order ID
        order_id = None
        if mapping.order_id and mapping.order_id in df.columns and pd.notna(r[mapping.order_id]):
            order_id = str(r[mapping.order_id]).strip()

        # Category
        category = "General"
        if mapping.category and mapping.category in df.columns and pd.notna(r[mapping.category]):
            category = str(r[mapping.category]).strip()

        clean_records.append({
            "order_id": order_id,
            "date": date_str,
            "month": month_str,
            "year": year_str,
            "product": prod_name,
            "category": category,
            "quantity": qty,
            "unit_price": round(unit_price, 2),
            "discount_amount": round(disc_amt, 2),
            "gross_sales": round(gross_sales, 2),
            "net_sales": round(net_sales, 2),
            "unit_cost": round(unit_cost, 2) if unit_cost is not None else None,
            "total_cost": round(total_cost, 2) if total_cost is not None else None,
            "profit": round(profit, 2) if profit is not None else None,
        })

    cleaned_df = pd.DataFrame(clean_records)
    
    if mapping.order_id and not cleaned_df.empty and cleaned_df["order_id"].notna().any():
        unique_orders = cleaned_df["order_id"].nunique()
        total_items = len(cleaned_df)
        if unique_orders < total_items:
            warnings.append(f"Dataset contains multi-item orders: {unique_orders} unique orders across {total_items} sales line items.")

    summary = ValidationSummary(
        total_rows=total_rows,
        accepted_rows=len(cleaned_df),
        rejected_rows=len(rejected_rows),
        warning_count=len(warnings),
        rejection_reasons=rejection_reasons_counter,
        warnings=warnings,
        sample_rejected=issues[:25]
    )

    return cleaned_df, summary, rejected_rows
