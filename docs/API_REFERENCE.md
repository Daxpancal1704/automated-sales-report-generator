# REST API Reference Documentation

Base URL: `http://localhost:8000/api`

Interactive Swagger OpenAPI UI available at: `http://localhost:8000/docs`

---

## Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & service readiness |
| `POST` | `/api/upload/preview` | Upload file, parse columns, detect suggestions |
| `POST` | `/api/upload/confirm` | Confirm column mapping, validate & clean dataset |
| `POST` | `/api/demo/load` | Load pre-packaged 12-month synthetic demo dataset |
| `GET` | `/api/demo/download` | Download sample synthetic CSV file |
| `GET` | `/api/dashboard` | Fetch executive dashboard KPIs, trends, and top products |
| `GET` | `/api/analytics` | Fetch filtered time-series trends and segment metrics |
| `GET` | `/api/products` | Fetch searchable, sorted, paginated product rankings |
| `GET` | `/api/reports/excel` | Download multi-sheet formatted Excel workbook (.xlsx) |
| `GET` | `/api/reports/pdf` | Download executive briefing report with vector charts (.pdf) |
| `GET` | `/api/reports/csv` | Download cleaned sales dataset (.csv) |
| `GET` | `/api/reports/validation-errors` | Download rejected row audit log (.csv) |

---

## 1. System Health

### `GET /api/health`
Checks backend operational status.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "Automated Sales Report Generator API",
  "version": "1.0.0"
}
```

---

## 2. Ingestion & Validation

### `POST /api/upload/preview`
Uploads a CSV or Excel file (up to 15 MB) to receive raw sample rows and automatic column mapping suggestions.

**Request:** `multipart/form-data`
- `file`: Binary file (.csv or .xlsx)

**Response `200 OK`**:
```json
{
  "session_id": "c5f3b762-b91c-4b53-91c6-2c5e53316972",
  "filename": "sales_q1.csv",
  "total_raw_rows": 1470,
  "columns": ["Order_ID", "Date", "Product", "Quantity", "Unit_Price", "Discount_Percent", "Unit_Cost"],
  "sample_rows": [
    {
      "Order_ID": "ORD-1001",
      "Date": "2025-01-01",
      "Product": "UltraBook Pro 15",
      "Quantity": 1,
      "Unit_Price": 75000,
      "Discount_Percent": 5,
      "Unit_Cost": 52000
    }
  ],
  "suggested_mapping": {
    "date": "Date",
    "product": "Product",
    "quantity": "Quantity",
    "unit_price": "Unit_Price",
    "order_id": "Order_ID",
    "discount": "Discount_Percent",
    "cost": "Unit_Cost"
  },
  "file_size_bytes": 104230
}
```

---

### `POST /api/upload/confirm`
Applies column mapping and validates dataset against business rules.

**Request Body `application/json`**:
```json
{
  "session_id": "c5f3b762-b91c-4b53-91c6-2c5e53316972",
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
```

**Response `200 OK`**:
```json
{
  "session_id": "c5f3b762-b91c-4b53-91c6-2c5e53316972",
  "status": "success",
  "message": "Dataset successfully imported: 1,470 records accepted, 0 records rejected.",
  "validation": {
    "total_rows": 1470,
    "accepted_rows": 1470,
    "rejected_rows": 0,
    "warning_count": 1,
    "rejection_reasons": {},
    "warnings": ["Dataset contains multi-item orders: 1,022 unique orders across 1,470 sales line items."],
    "sample_rejected": []
  }
}
```

---

## 3. Instant Demo Data Loading

### `POST /api/demo/load?currency=INR`
Loads the pre-packaged 1,470-row synthetic sales dataset into a newly initialized session.

**Response `200 OK`**:
```json
{
  "session_id": "8e31b672-0ab8-45b9-9134-2e91262d02c1",
  "filename": "demo_sales.csv (Synthetic Dataset)",
  "is_demo": true,
  "total_records": 1470,
  "validation_summary": { ... }
}
```

---

## 4. Analytics & Dashboards

### `GET /api/dashboard?session_id={id}&currency=INR`
Returns full dashboard statistics for the active session.

**Response `200 OK`**:
```json
{
  "has_data": true,
  "session_id": "8e31b672-0ab8-45b9-9134-2e91262d02c1",
  "dataset_info": {
    "filename": "demo_sales.csv (Synthetic Dataset)",
    "total_records": 1470,
    "is_demo": true,
    "currency": "INR"
  },
  "kpis": {
    "total_gross_revenue": 34500000.0,
    "total_discount_amount": 1250000.0,
    "total_net_revenue": 33250000.0,
    "total_orders": 1022,
    "order_count_label": "Unique Orders",
    "has_order_ids": true,
    "total_transactions": 1470,
    "total_units_sold": 2180,
    "average_order_value": 32534.2,
    "total_cost": 22100000.0,
    "total_profit": 11150000.0,
    "profit_margin_pct": 33.5,
    "has_cost_data": true,
    "currency": "INR",
    "date_range_start": "2025-01-01",
    "date_range_end": "2025-12-31",
    "total_products_count": 10
  },
  "monthly_trends": [ ... ],
  "top_products": [ ... ],
  "category_breakdown": [ ... ],
  "validation_summary": { ... },
  "recent_transactions": [ ... ]
}
```

---

### `GET /api/analytics`
Query Parameters:
- `session_id` (required, string)
- `start_date` (optional, YYYY-MM-DD)
- `end_date` (optional, YYYY-MM-DD)
- `product` (optional, string)
- `category` (optional, string)
- `grouping` (optional: `monthly` | `weekly` | `daily`)
- `currency` (optional, default session currency)

---

### `GET /api/products`
Query Parameters:
- `session_id` (required, string)
- `search` (optional, substring search by product name/category)
- `category` (optional, exact category filter)
- `sort_by` (optional: `net_revenue` | `units_sold` | `product_name` | `avg_unit_price` | `revenue_rank`)
- `sort_order` (optional: `desc` | `asc`)
- `page` (optional integer, default 1)
- `page_size` (optional integer, default 10)

---

## 5. Download Endpoints

- **`GET /api/reports/excel?session_id={id}&currency={curr}`**
  - Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - Filename: `sales_report_{currency}.xlsx`
- **`GET /api/reports/pdf?session_id={id}&currency={curr}`**
  - Content-Type: `application/pdf`
  - Filename: `sales_report_{currency}.pdf`
- **`GET /api/reports/csv?session_id={id}`**
  - Content-Type: `text/csv`
  - Filename: `cleaned_sales_data.csv`
- **`GET /api/reports/validation-errors?session_id={id}`**
  - Content-Type: `text/csv`
  - Filename: `validation_rejection_audit.csv`
- **`GET /api/demo/download`**
  - Content-Type: `text/csv`
  - Filename: `demo_sales.csv`
