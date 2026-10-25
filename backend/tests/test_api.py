import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_full_e2e_workflow():
    # 1. Prepare CSV test data
    csv_content = (
        "Order_ID,Date,Product,Quantity,Unit_Price,Discount_Pct,Cost\n"
        "ORD-101,2025-01-15,Wireless Headphones,2,5000,10,3000\n"
        "ORD-101,2025-01-15,Carry Case,1,1000,0,500\n"
        "ORD-102,2025-02-10,Mechanical Keyboard,1,4500,0,2500\n"
        "ORD-BAD,2025-02-11,Bad Product,-2,500,0,200\n"  # rejected negative qty
    )

    # 2. Upload Preview
    files = {"file": ("test_sales.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    preview_res = client.post("/api/upload/preview", files=files)
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert preview_data["total_raw_rows"] == 4
    session_id = preview_data["session_id"]
    assert session_id is not None

    # 3. Confirm Mapping
    confirm_payload = {
        "session_id": session_id,
        "currency": "INR",
        "mapping": {
            "date": "Date",
            "product": "Product",
            "quantity": "Quantity",
            "unit_price": "Unit_Price",
            "order_id": "Order_ID",
            "discount": "Discount_Pct",
            "discount_type": "percent",
            "cost": "Cost"
        }
    }
    confirm_res = client.post("/api/upload/confirm", json=confirm_payload)
    assert confirm_res.status_code == 200
    confirm_data = confirm_res.json()
    val = confirm_data["validation"]
    assert val["total_rows"] == 4
    assert val["accepted_rows"] == 3
    assert val["rejected_rows"] == 1

    # 4. Fetch Dashboard
    dash_res = client.get(f"/api/dashboard?session_id={session_id}")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["has_data"] is True
    kpis = dash_data["kpis"]
    assert kpis["total_transactions"] == 3
    assert kpis["total_orders"] == 2
    assert kpis["order_count_label"] == "Unique Orders"
    # Gross: (2*5000=10000) + 1000 + 4500 = 15500
    # Net: (10000-1000=9000) + 1000 + 4500 = 14500
    assert kpis["total_gross_revenue"] == 15500.0
    assert kpis["total_net_revenue"] == 14500.0
    assert kpis["total_discount_amount"] == 1000.0

    # 5. Fetch Analytics with filter
    ana_res = client.get(f"/api/analytics?session_id={session_id}&product=Mechanical Keyboard")
    assert ana_res.status_code == 200
    ana_data = ana_res.json()
    assert ana_data["kpis"]["total_net_revenue"] == 4500.0

    # 6. Fetch Products
    prod_res = client.get(f"/api/products?session_id={session_id}&sort_by=net_revenue&sort_order=desc")
    assert prod_res.status_code == 200
    prod_data = prod_res.json()
    assert prod_data["total_products"] == 3
    assert prod_data["products"][0]["product_name"] == "Wireless Headphones"
    assert prod_data["products"][0]["revenue_rank"] == 1

    # 7. Download Excel Report
    excel_res = client.get(f"/api/reports/excel?session_id={session_id}")
    assert excel_res.status_code == 200
    assert "spreadsheetml" in excel_res.headers["content-type"]
    assert len(excel_res.content) > 0

    # 8. Download PDF Report
    pdf_res = client.get(f"/api/reports/pdf?session_id={session_id}")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-")

    # 9. Download CSV Report
    csv_res = client.get(f"/api/reports/csv?session_id={session_id}")
    assert csv_res.status_code == 200
    assert "Wireless Headphones" in csv_res.text

    # 10. Download Validation Errors CSV
    err_res = client.get(f"/api/reports/validation-errors?session_id={session_id}")
    assert err_res.status_code == 200
    assert "Bad Product" in err_res.text

def test_load_demo_dataset():
    res = client.post("/api/demo/load?currency=INR")
    assert res.status_code == 200
    data = res.json()
    assert data["is_demo"] is True
    session_id = data["session_id"]
    
    # Check dashboard loads with demo
    dash_res = client.get(f"/api/dashboard?session_id={session_id}")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["has_data"] is True
    assert dash_data["kpis"]["total_transactions"] > 1000
