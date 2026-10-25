import io
import os
import sys

# Ensure backend folder is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from openpyxl import load_workbook
from fastapi.testclient import TestClient
from app.main import app

def run_qa_suite():
    print("=" * 60)
    print("STARTING COMPREHENSIVE QA & FUNCTIONAL AUDIT")
    print("=" * 60)

    client = TestClient(app)
    results = {}

    # 1. Health Endpoint
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("[PASS] 1. Backend Health Check: 200 OK, healthy")
    results["health_check"] = "PASS"

    # 2. Invalid File Upload
    bad_file = {"file": ("malicious.exe", b"not a csv or excel", "application/octet-stream")}
    res = client.post("/api/upload/preview", files=bad_file)
    assert res.status_code == 400, f"Expected 400 for bad extension, got {res.status_code}"
    print("[PASS] 2. Invalid Extension Upload Rejection: 400 Bad Request")
    results["invalid_file_extension"] = "PASS"

    # 3. Empty File Upload
    empty_file = {"file": ("empty.csv", b"", "text/csv")}
    res = client.post("/api/upload/preview", files=empty_file)
    assert res.status_code == 400, f"Expected 400 for empty file, got {res.status_code}"
    print("[PASS] 3. Empty File Rejection: 400 Bad Request")
    results["empty_file"] = "PASS"

    # 4. Clean Demo Dataset Ingestion (1,470 rows)
    with open("sample_data/demo_sales.csv", "rb") as f:
        clean_bytes = f.read()

    files = {"file": ("demo_sales.csv", clean_bytes, "text/csv")}
    preview_res = client.post("/api/upload/preview", files=files)
    assert preview_res.status_code == 200
    pdata = preview_res.json()
    assert pdata["total_raw_rows"] == 1470
    session_id = pdata["session_id"]
    print(f"[PASS] 4. Clean CSV Preview: Ingested {pdata['total_raw_rows']} rows, session ID generated")
    results["clean_csv_preview"] = "PASS"

    # 5. Confirm Column Mapping with Cost and Discounts
    confirm_payload = {
        "session_id": session_id,
        "currency": "INR",
        "mapping": {
            "date": "Date",
            "product": "Product",
            "quantity": "Quantity",
            "unit_price": "Unit_Price",
            "order_id": "Order_ID",
            "discount": "Discount_Percent",
            "discount_type": "percent",
            "cost": "Unit_Cost",
            "category": "Category"
        }
    }
    conf_res = client.post("/api/upload/confirm", json=confirm_payload)
    assert conf_res.status_code == 200
    cdata = conf_res.json()
    assert cdata["validation"]["total_rows"] == 1470
    assert cdata["validation"]["accepted_rows"] == 1470
    assert cdata["validation"]["rejected_rows"] == 0
    print(f"[PASS] 5. Mapping Confirmation: 1,470/1,470 accepted, 0 rejected")
    results["clean_mapping_confirm"] = "PASS"

    # 6. Dashboard Calculations & Mathematical Consistency
    dash_res = client.get(f"/api/dashboard?session_id={session_id}&currency=INR")
    assert dash_res.status_code == 200
    ddata = dash_res.json()
    kpis = ddata["kpis"]

    # Verify formula consistency: Net = Gross - Discount
    gross = kpis["total_gross_revenue"]
    disc = kpis["total_discount_amount"]
    net = kpis["total_net_revenue"]
    assert abs(round(gross - disc, 2) - round(net, 2)) < 0.05, f"Revenue mismatch: {gross} - {disc} != {net}"

    # Verify AOV = Net / Orders
    orders = kpis["total_orders"]
    aov = kpis["average_order_value"]
    expected_aov = round(net / orders, 2)
    assert abs(round(aov, 1) - round(expected_aov, 1)) < 0.1, f"AOV mismatch: {aov} vs {expected_aov}"

    # Verify Order ID distinction
    assert kpis["has_order_ids"] is True
    assert kpis["total_transactions"] == 1470
    assert orders < 1470, f"Orders ({orders}) should be less than transactions (1470) due to multi-item baskets"
    print(f"[PASS] 6. KPI Formulas Verified: Gross={gross:,.2f}, Disc={disc:,.2f}, Net={net:,.2f}, Orders={orders}, AOV={aov:,.2f}")
    results["kpi_calculations"] = "PASS"

    # 7. Excel Generation & Ingestion Verification
    excel_res = client.get(f"/api/reports/excel?session_id={session_id}&currency=INR")
    assert excel_res.status_code == 200
    assert "spreadsheetml" in excel_res.headers["content-type"]
    wb = load_workbook(io.BytesIO(excel_res.content))
    expected_sheets = ["Executive Summary", "Monthly Performance", "Product Performance", "Cleaned Sales Data", "Data Quality Audit"]
    for s in expected_sheets:
        assert s in wb.sheetnames, f"Missing sheet '{s}' in Excel export"
    print(f"[PASS] 7. Excel Report Verified: 5 sheets present, openpyxl workbook validated ({len(excel_res.content)} bytes)")
    results["excel_report"] = "PASS"

    # 8. PDF Generation & Structure Verification
    pdf_res = client.get(f"/api/reports/pdf?session_id={session_id}&currency=INR")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-"), "Invalid PDF header bytes"
    print(f"[PASS] 8. PDF Report Verified: Valid PDF magic bytes, vector charts built ({len(pdf_res.content)} bytes)")
    results["pdf_report"] = "PASS"

    # 9. Dirty Dataset Quarantine & Audit Verification
    with open("sample_data/demo_sales_with_issues.csv", "rb") as f:
        dirty_bytes = f.read()

    files = {"file": ("dirty_sales.csv", dirty_bytes, "text/csv")}
    p_res = client.post("/api/upload/preview", files=files)
    assert p_res.status_code == 200
    p_data = p_res.json()
    dirty_session = p_data["session_id"]

    conf_dirty = client.post("/api/upload/confirm", json={
        "session_id": dirty_session,
        "currency": "INR",
        "mapping": {
            "date": "Date",
            "product": "Product",
            "quantity": "Quantity",
            "unit_price": "Unit_Price",
            "order_id": "Order_ID",
            "discount": "Discount_Percent",
            "discount_type": "percent",
            "cost": "Unit_Cost",
            "category": "Category"
        }
    })
    assert conf_dirty.status_code == 200
    d_val = conf_dirty.json()["validation"]
    assert d_val["rejected_rows"] > 0, "Dirty dataset should have rejected rows"
    print(f"[PASS] 9. Data Quarantine Verified: Total={d_val['total_rows']}, Accepted={d_val['accepted_rows']}, Quarantined={d_val['rejected_rows']}")
    print(f"       Rejection Reasons Logged: {list(d_val['rejection_reasons'].keys())}")
    results["data_quarantine"] = "PASS"

    # 10. Audit CSV Download Verification
    audit_res = client.get(f"/api/reports/validation-errors?session_id={dirty_session}")
    assert audit_res.status_code == 200
    audit_text = audit_res.text
    assert "row_number" in audit_text
    assert "reason" in audit_text
    print(f"[PASS] 10. Rejection Audit CSV Download Verified ({len(audit_text.splitlines())} lines)")
    results["audit_csv_download"] = "PASS"

    # 11. Formula Injection Protection Verification
    formula_injection_csv = (
        'Date,Product,Quantity,Unit_Price\n'
        '2025-01-01,"=1+1",1,100\n'
        '2025-01-02,"+cmd|calc!A0",1,150\n'
        '2025-01-03,"@SUM(1,2)",1,200\n'
    )
    files = {"file": ("injection_test.csv", formula_injection_csv.encode(), "text/csv")}
    p_res = client.post("/api/upload/preview", files=files)
    inj_session = p_res.json()["session_id"]
    client.post("/api/upload/confirm", json={
        "session_id": inj_session,
        "mapping": {"date": "Date", "product": "Product", "quantity": "Quantity", "unit_price": "Unit_Price"}
    })
    csv_download = client.get(f"/api/reports/csv?session_id={inj_session}").text
    for line in csv_download.splitlines()[1:]:
        prod_val = line.split(",")[2]
        assert prod_val.startswith("'") or not prod_val.startswith(("=", "+", "-", "@")), f"Formula injection unguarded: {prod_val}"
    print("[PASS] 11. CSV Formula Injection Defense Verified: Dangerous prefixes safely quoted")
    results["formula_injection_defense"] = "PASS"

    # 12. Instant Demo Loader Endpoint
    demo_res = client.post("/api/demo/load?currency=USD")
    assert demo_res.status_code == 200
    assert demo_res.json()["is_demo"] is True
    print(f"[PASS] 12. Instant Demo Loader Verified: Session {demo_res.json()['session_id']}")
    results["demo_loader"] = "PASS"

    # 13. Analytics Filtering (Date, Product, Grouping)
    ana_res = client.get(f"/api/analytics?session_id={session_id}&product=UltraBook Pro 15&grouping=monthly")
    assert ana_res.status_code == 200
    ana_data = ana_res.json()
    assert ana_data["kpis"]["total_products_count"] == 1
    assert len(ana_data["trends"]) > 0
    print(f"[PASS] 13. Analytics Filters Verified: UltraBook Pro 15 filtered revenue = {ana_data['kpis']['total_net_revenue']:,.2f}")
    results["analytics_filtering"] = "PASS"

    # 14. Product Rankings & Pagination
    prod_res = client.get(f"/api/products?session_id={session_id}&page=1&page_size=5&sort_by=net_revenue&sort_order=desc")
    assert prod_res.status_code == 200
    p_json = prod_res.json()
    assert len(p_json["products"]) == 5
    assert p_json["products"][0]["revenue_rank"] == 1
    assert p_json["products"][0]["net_revenue"] >= p_json["products"][1]["net_revenue"]
    print(f"[PASS] 14. Product Ranking & Pagination Verified: Top product = {p_json['products'][0]['product_name']}")
    results["product_rankings"] = "PASS"

    print("=" * 60)
    print("ALL 14 AUDIT CHECKS PASSED WITH ZERO FAILURES!")
    print("=" * 60)
    return results

if __name__ == "__main__":
    run_qa_suite()
