import io
import os
import pandas as pd
from typing import Tuple, Dict, Any, List

def detect_column_mapping(columns: List[str]) -> Dict[str, str]:
    """
    Intelligently suggest standard column mapping based on common variations in header names.
    Returns mapping with keys: 'date', 'product', 'quantity', 'unit_price',
    and optional 'order_id', 'discount', 'cost', 'category'.
    """
    mapping: Dict[str, str] = {}
    normalized = {col: col.strip().lower().replace(" ", "_").replace("-", "_") for col in columns}

    date_candidates = ["date", "order_date", "sale_date", "sales_date", "invoice_date", "trans_date", "timestamp", "day"]
    product_candidates = ["product", "product_name", "item", "item_name", "sku", "description", "product_title", "title", "name"]
    qty_candidates = ["quantity", "qty", "units", "units_sold", "volume", "count", "quantity_sold", "pieces"]
    price_candidates = ["unit_price", "price", "rate", "selling_price", "unitprice", "item_price", "amount"]
    order_id_candidates = ["order_id", "orderid", "invoice_id", "transaction_id", "order_no", "trans_id", "order_number", "receipt_no", "id"]
    discount_candidates = ["discount", "discount_percent", "discount_pct", "discount_rate", "discount_amount", "rebate"]
    cost_candidates = ["unit_cost", "cost", "cogs", "purchase_price", "cost_price", "buy_price"]
    category_candidates = ["category", "product_category", "department", "dept", "segment", "group", "product_type"]

    # Match each role by checking highest priority candidate
    def find_match(candidates: List[str]) -> str:
        for cand in candidates:
            for orig_col, norm in normalized.items():
                if norm == cand:
                    return orig_col
        for cand in candidates:
            for orig_col, norm in normalized.items():
                if cand in norm:
                    return orig_col
        return ""

    mapping["date"] = find_match(date_candidates)
    mapping["product"] = find_match(product_candidates)
    mapping["quantity"] = find_match(qty_candidates)
    mapping["unit_price"] = find_match(price_candidates)
    
    order_id_match = find_match(order_id_candidates)
    if order_id_match and order_id_match not in mapping.values():
        mapping["order_id"] = order_id_match
        
    disc_match = find_match(discount_candidates)
    if disc_match and disc_match not in mapping.values():
        mapping["discount"] = disc_match
        
    cost_match = find_match(cost_candidates)
    if cost_match and cost_match not in mapping.values():
        mapping["cost"] = cost_match
        
    cat_match = find_match(category_candidates)
    if cat_match and cat_match not in mapping.values():
        mapping["category"] = cat_match

    return mapping

def parse_uploaded_file(file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Parse uploaded CSV or XLSX bytes into a pandas DataFrame.
    Handles multiple encodings for CSV and openpyxl for Excel.
    """
    ext = os.path.splitext(filename)[1].lower()
    df: pd.DataFrame
    
    if ext == ".csv":
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
        last_error = None
        parsed = False
        for enc in encodings:
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding=enc)
                parsed = True
                break
            except Exception as e:
                last_error = e
                continue
        if not parsed:
            raise ValueError(f"Could not parse CSV file. Supported encodings (utf-8, latin-1, cp1252) failed: {last_error}")
            
    elif ext in [".xlsx", ".xls"]:
        try:
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        except Exception as e:
            raise ValueError(f"Could not read Excel file. Please ensure it is a valid, uncorrupted Excel workbook. Error: {e}")
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Only CSV and Excel (.xlsx) files are supported.")

    if df.empty:
        raise ValueError("The uploaded file is empty (contains no data rows).")

    # Clean header whitespace
    df.columns = [str(c).strip() for c in df.columns]
    
    columns = list(df.columns)
    suggested_mapping = detect_column_mapping(columns)
    
    # Generate clean sample rows for JSON preview
    sample_df = df.head(10).fillna("")
    sample_rows = sample_df.to_dict(orient="records")

    metadata = {
        "filename": filename,
        "total_raw_rows": len(df),
        "columns": columns,
        "sample_rows": sample_rows,
        "suggested_mapping": suggested_mapping,
        "file_size_bytes": len(file_bytes)
    }

    return df, metadata
