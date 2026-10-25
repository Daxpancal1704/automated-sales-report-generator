# Automated Sales Report Generator (ReportPulse)

> **A modern, production-grade SaaS web application built to analyze sales datasets, evaluate revenue performance, diagnose data quality anomalies, and generate executive Excel and PDF reports.**

Designed for portfolio demonstration on Upwork and GitHub, this repository provides a full-stack solution featuring a high-performance **FastAPI (Python 3.11)** backend and a responsive **React 19 (TypeScript + Tailwind CSS + Recharts)** frontend.

---

## Key Features

- **Multi-Format Ingestion:** Drag-and-drop support for `.csv` and `.xlsx` files up to 15 MB with auto-detection of encodings (UTF-8, Latin-1, CP1252) and column headers.
- **Intelligent Column Mapping:** Auto-matches headers for *Date, Product, Quantity, Unit Price, Order ID, Discount, Cost,* and *Category*, while giving users complete control to adjust mappings.
- **Strict Data Validation & Cleansing Engine:**
  - Enforces positive quantities ($> 0$), non-negative unit prices ($\ge 0$), valid ISO dates, and legitimate discount percentages.
  - Quarantines invalid records without silent data loss.
  - Generates downloadable CSV audit logs detailing the exact failure reasons for quarantined rows.
- **Executive KPI Dashboard:**
  - Total Gross and Net Revenue, Total Units Sold, Average Order Value (AOV).
  - Clear distinction between unique basket **Order Count** vs **Sales Line Item Count**.
  - Cost of Goods Sold (COGS), Gross Profit, and Gross Margin calculation (when cost data is supplied).
- **Interactive Visualizations:**
  - Area charts for monthly net revenue trajectory.
  - Dual bar charts for units sold and order volumes.
  - Donut charts for product category segment distribution.
  - Horizontal bar comparisons of leading product lines.
- **Multi-Sheet Excel Report Generator (`openpyxl`):**
  - Generates a styled `.xlsx` workbook featuring:
    1. *Executive Summary Sheet* with KPI metric blocks and reporting period.
    2. *Monthly Performance Sheet* with calculated totals and a native interactive Excel Bar Chart.
    3. *Product Performance Sheet* with quantity and revenue rankings.
    4. *Cleaned Sales Data Sheet* with Auto-Filters enabled and frozen header rows.
    5. *Data Quality Audit Sheet* summarizing validation rules and quarantined row counts.
- **Executive PDF Briefing Generator (`ReportLab`):**
  - Generates publication-ready `.pdf` reports featuring:
    - 2x4 styled metric dashboard.
    - Native vector bar chart for monthly sales trends.
    - Alternating row tables for monthly sales and top products.
    - Explicit accounting methodology disclosures and currency notes.
- **Multi-Currency Display Switcher:**
  - Switch display formatting instantly between INR (₹), USD ($), EUR (€), GBP (£), JPY (¥), CAD (C$), and AUD (A$).
  - Transparent disclosure explaining that switching updates display symbols and does not apply dynamic FX conversion.
- **Pre-Packaged 12-Month Demo Dataset:**
  - Includes a synthetic 1,470-row sales dataset across 10 products with seasonal spikes and multi-item orders for 1-click evaluation.
- **Formula Injection Defense:**
  - Sanitizes dangerous formula prefixes (`=`, `+`, `-`, `@`) in CSV and Excel exports to protect client spreadsheet software against CSV Injection attacks.

---

## Tech Stack

### Frontend
- **Framework:** React 19 (TypeScript)
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4 (with `@tailwindcss/vite`)
- **Visualizations:** Recharts
- **Icons:** Lucide React
- **Testing:** Vitest & `@testing-library/react` (jsdom environment)

### Backend
- **Framework:** FastAPI
- **Data Engine:** pandas, NumPy
- **Excel Generation:** openpyxl
- **PDF Generation:** ReportLab (vector drawings and styled flowables)
- **Server:** Uvicorn
- **Testing:** pytest & httpx

---

## Architecture Overview

```
Automated Sales Report Generator/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app instance, CORS middleware, routing
│   │   ├── api/
│   │   │   └── routes.py        # REST API endpoints (upload, dashboard, reports, etc.)
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── analyzer.py      # Core sales analytics, KPIs, trends & rankings
│   │   │   ├── parser.py        # CSV/Excel multi-encoding parser & header detection
│   │   │   ├── validator.py     # Data validation, cleaning & quarantine audit
│   │   │   ├── session_store.py # In-memory session store with 2hr sliding TTL
│   │   │   ├── report_excel.py  # openpyxl multi-sheet workbook generator
│   │   │   ├── report_pdf.py    # ReportLab vector PDF generator
│   │   │   └── report_csv.py    # Sanitized CSV dataset & audit log exporter
│   │   └── utils/
│   │       ├── formatting.py    # Currency symbols & numeric formatting
│   │       └── security.py      # Filename sanitization & formula injection defense
│   ├── tests/
│   │   ├── test_analyzer.py     # Unit tests for revenue, AOV & rankings
│   │   ├── test_validator.py    # Unit tests for validation & quarantine rules
│   │   ├── test_reports.py      # Unit tests for Excel and PDF byte generation
│   │   └── test_api.py          # End-to-end integration tests for all API endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, and responsive Layout wrapper
│   │   │   ├── ui/              # Card, Button, Badge, Alert, LoadingSpinner, EmptyState
│   │   │   └── charts/          # RevenueTrendChart, SalesVolumeChart, TopProductsChart, CategoryChart
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── UploadPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── context/
│   │   │   └── SalesContext.tsx # React Context managing active dataset session & currency
│   │   ├── services/
│   │   │   └── api.ts           # Type-safe API client & URL builders
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── tests/
│   │   │   ├── formatting.test.ts # Unit tests for currency & number formatting
│   │   │   └── components.test.tsx# UI component rendering tests
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── sample_data/
│   ├── demo_sales.csv           # 1,470 clean synthetic sales rows across 12 months
│   ├── demo_sales_with_issues.csv # 206 rows containing realistic anomalies for validation testing
│   └── generate_samples.py      # Synthetic dataset generator script
├── docs/
│   ├── ARCHITECTURE.md          # Architectural diagrams & data flows
│   ├── API_REFERENCE.md         # Complete REST API endpoint reference
│   └── DATA_DICTIONARY.md       # Columns, formulas & accounting rules
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env.example
├── .gitignore
└── README.md
```

---

## Quick Start & Local Setup

### Prerequisites
- **Python:** 3.11 or higher
- **Node.js:** v18 or higher (v20+ recommended)
- **npm:** v9 or higher

---

### 1. Backend Setup

```bash
# Navigate to project root
cd "f:\Projects\Nova\Automated Sales Report Generator"

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI backend server
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

The backend API will start at: `http://127.0.0.1:8000`  
Interactive OpenAPI documentation: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

Open a second terminal window:

```bash
# Navigate to frontend folder
cd "f:\Projects\Nova\Automated Sales Report Generator\frontend"

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The web dashboard will be accessible at: `http://localhost:5173`

---

## Running Automated Tests

### Run Backend Tests (16 Tests)
```bash
python -m pytest backend/tests -v
```

Tests cover:
- Gross, discount, and net revenue calculations
- Unique order count vs line item row count
- Monthly and weekly trend aggregations
- Product rankings by revenue vs quantity
- Invalid data handling (negative quantities, negative prices, missing columns)
- Openpyxl Excel workbook parsing and sheet verification
- ReportLab PDF generation with vector charts
- Full end-to-end API upload, validation, confirmation, and download workflow

### Run Frontend Tests (9 Tests)
```bash
cd frontend
npm test
```

Tests cover:
- Currency formatting (INR ₹, USD $, EUR €)
- Locale-safe number thousands separation
- API download URL construction
- Card, Badge, and Button component rendering in jsdom

---

## Docker Deployment

To launch both frontend and backend in isolated production containers:

```bash
# Build and run containers
docker-compose up --build -d

# View logs
docker-compose logs -f
```

- Web Application: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## Accounting & Business Methodology

1. **Net Sales Revenue:** Computed as `(Quantity × Unit Price) − Applied Discounts`.
2. **Order Count:** When an `Order_ID` is present, `Order Count` counts unique order identifiers. If absent, each valid row is treated as an individual sales line item.
3. **Average Order Value (AOV):** `Net Sales Revenue ÷ Order Count`.
4. **Profit & Margin:** Calculated only when a `Unit Cost` column is provided (`Profit = Net Sales − (Quantity × Unit Cost)`). Revenue is never conflated with profit.
5. **Date Treatment:** Evaluated as date-only (`YYYY-MM-DD`) without localized timezone conversion to ensure billing period consistency.
6. **Currency Switching:** A display preference tool that adjusts formatting without applying dynamic foreign exchange conversion.

---

## Data Privacy & Security

- **Session Isolation:** Each dataset is tied to an ephemeral UUID session.
- **Automatic TTL Expiration:** Datasets are maintained in memory with an automatic 2-hour idle timeout.
- **Formula Injection Prevention:** Output CSV and Excel files sanitize `=+ - @` prefixes.
- **Zero Permanent PII Storage:** No personal user data is stored or logged.

---

## License

MIT License. Designed and engineered for professional freelancing portfolios and enterprise sales analytics.
