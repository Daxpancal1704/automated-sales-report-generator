import os
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Response, status
from fastapi.responses import Response, FileResponse

from app.models.schemas import (
    PreviewResponse, ConfirmRequest, ConfirmResponse,
    DashboardResponse, AnalyticsResponse, ProductListResponse,
    ColumnMapping, ValidationSummary
)
from app.services.session_store import session_store
from app.services.parser import parse_uploaded_file, detect_column_mapping
from app.services.validator import validate_and_clean_dataset
from app.services.analyzer import (
    compute_kpi_stats, compute_trends, compute_product_performance,
    compute_category_distribution, filter_dataframe
)
from app.services.report_excel import generate_excel_report
from app.services.report_pdf import generate_pdf_report
from app.services.report_csv import generate_cleaned_csv, generate_validation_issues_csv
from app.utils.security import sanitize_filename, MAX_UPLOAD_SIZE_BYTES, generate_session_id

router = APIRouter(prefix="/api")

DEMO_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data", "demo_sales.csv"))

@router.get("/health")
def health_check():
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "healthy",
        "service": "Automated Sales Report Generator API",
        "version": "1.0.0"
    }

@router.post("/upload/preview", response_model=PreviewResponse)
async def upload_preview(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file to get a preview of data and suggested column mapping.
    Validates file extension, size limit, and parser integrity.
    """
    clean_name = sanitize_filename(file.filename or "uploaded_sales_data.csv")
    ext = os.path.splitext(clean_name)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only .csv and .xlsx files are supported."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB."
        )

    try:
        raw_df, metadata = parse_uploaded_file(file_bytes, clean_name)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected parsing error: {e}")

    session_id = generate_session_id()
    sess = session_store.get_or_create(session_id)
    sess.filename = clean_name
    sess.file_size_bytes = len(file_bytes)
    sess.raw_df = raw_df
    sess.suggested_mapping = metadata["suggested_mapping"]

    return PreviewResponse(
        session_id=session_id,
        filename=clean_name,
        total_raw_rows=metadata["total_raw_rows"],
        columns=metadata["columns"],
        sample_rows=metadata["sample_rows"],
        suggested_mapping=metadata["suggested_mapping"],
        file_size_bytes=len(file_bytes)
    )

@router.post("/upload/confirm", response_model=ConfirmResponse)
def upload_confirm(req: ConfirmRequest):
    """
    Confirm column mappings, execute full data cleaning & validation,
    and generate the active dataset for analytics and reporting.
    """
    sess = session_store.get(req.session_id)
    if not sess or sess.raw_df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or uploaded preview has expired. Please re-upload your file."
        )

    try:
        cleaned_df, val_summary, rejected_rows = validate_and_clean_dataset(sess.raw_df, req.mapping)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Validation failed: {e}")

    if cleaned_df.empty:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"All {val_summary.total_rows} records in the dataset were rejected during validation. Please inspect your column mapping or review the rejection report."
        )

    sess.confirmed_df = cleaned_df
    sess.validation_summary = val_summary.model_dump()
    sess.rejected_records = rejected_rows
    sess.column_mapping = req.mapping.model_dump()
    sess.currency = req.currency

    return ConfirmResponse(
        session_id=sess.session_id,
        status="success",
        message=f"Dataset successfully imported: {val_summary.accepted_rows:,} records accepted, {val_summary.rejected_rows:,} records rejected.",
        validation=val_summary
    )

@router.post("/demo/load")
def load_demo_data(currency: str = "INR"):
    """
    Load the pre-packaged synthetic 12-month sales dataset into a new session.
    Provides instant hands-on demonstration without requiring a file upload.
    """
    if not os.path.exists(DEMO_FILE_PATH):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo sales dataset file not found on server.")

    with open(DEMO_FILE_PATH, "rb") as f:
        file_bytes = f.read()

    raw_df, metadata = parse_uploaded_file(file_bytes, "demo_sales.csv")
    mapping = ColumnMapping(
        date="Date",
        product="Product",
        quantity="Quantity",
        unit_price="Unit_Price",
        order_id="Order_ID",
        discount="Discount_Percent",
        discount_type="percent",
        cost="Unit_Cost",
        category="Category"
    )

    cleaned_df, val_summary, rejected_rows = validate_and_clean_dataset(raw_df, mapping)

    session_id = generate_session_id()
    sess = session_store.get_or_create(session_id)
    sess.filename = "demo_sales.csv (Synthetic Dataset)"
    sess.file_size_bytes = len(file_bytes)
    sess.raw_df = raw_df
    sess.confirmed_df = cleaned_df
    sess.validation_summary = val_summary.model_dump()
    sess.rejected_records = rejected_rows
    sess.column_mapping = mapping.model_dump()
    sess.currency = currency
    sess.is_demo = True

    return {
        "session_id": session_id,
        "filename": sess.filename,
        "is_demo": True,
        "total_records": len(cleaned_df),
        "validation_summary": val_summary
    }

@router.get("/demo/download")
def download_demo_csv():
    """Download the synthetic demo CSV dataset."""
    if not os.path.exists(DEMO_FILE_PATH):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo file not found.")
    return FileResponse(
        path=DEMO_FILE_PATH,
        filename="demo_sales.csv",
        media_type="text/csv"
    )

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(session_id: Optional[str] = None, currency: Optional[str] = None):
    """
    Retrieve core dashboard metrics: KPI cards, monthly trends, top 5 products,
    category breakdown, validation warnings, and recent transaction rows.
    """
    if not session_id:
        return DashboardResponse(has_data=False)

    sess = session_store.get(session_id)
    if not sess or sess.confirmed_df is None or sess.confirmed_df.empty:
        return DashboardResponse(has_data=False)

    active_currency = currency or sess.currency
    df = sess.confirmed_df

    kpis = compute_kpi_stats(df, currency=active_currency)
    trends = compute_trends(df, grouping="monthly")
    top_products = compute_product_performance(df)[:5]
    categories = compute_category_distribution(df)

    recent_sample = df.tail(8).to_dict(orient="records")

    val_summary = ValidationSummary(**sess.validation_summary) if sess.validation_summary else None

    return DashboardResponse(
        has_data=True,
        session_id=session_id,
        dataset_info={
            "filename": sess.filename,
            "total_records": len(df),
            "is_demo": sess.is_demo,
            "currency": active_currency,
        },
        kpis=kpis,
        monthly_trends=trends,
        top_products=top_products,
        category_breakdown=categories,
        validation_summary=val_summary,
        recent_transactions=recent_sample
    )

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    session_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product: Optional[str] = None,
    category: Optional[str] = None,
    grouping: str = "monthly",
    currency: Optional[str] = None
):
    """
    Interactive analytics endpoint with date range, product, category, and grouping filters.
    """
    sess = session_store.get(session_id)
    if not sess or sess.confirmed_df is None or sess.confirmed_df.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active dataset session found.")

    active_currency = currency or sess.currency
    raw_clean_df = sess.confirmed_df

    filtered_df = filter_dataframe(raw_clean_df, start_date, end_date, product, category)

    kpis = compute_kpi_stats(filtered_df, currency=active_currency)
    trends = compute_trends(filtered_df, grouping=grouping)
    categories = compute_category_distribution(filtered_df)

    available_products = sorted(list(raw_clean_df["product"].dropna().unique()))
    available_categories = sorted(list(raw_clean_df["category"].dropna().unique()))

    return AnalyticsResponse(
        kpis=kpis,
        trends=trends,
        category_breakdown=categories,
        available_products=available_products,
        available_categories=available_categories,
        date_min=str(raw_clean_df["date"].min()),
        date_max=str(raw_clean_df["date"].max())
    )

@router.get("/products", response_model=ProductListResponse)
def get_products(
    session_id: str,
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = "net_revenue",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 10
):
    """
    Product performance endpoint with search, category filtering, sorting, and pagination.
    """
    sess = session_store.get(session_id)
    if not sess or sess.confirmed_df is None or sess.confirmed_df.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active dataset session found.")

    all_products = compute_product_performance(sess.confirmed_df)
    categories = sorted(list(sess.confirmed_df["category"].dropna().unique()))

    # Apply search filter
    filtered = all_products
    if search and search.strip():
        q = search.strip().lower()
        filtered = [p for p in filtered if q in p.product_name.lower() or (p.category and q in p.category.lower())]

    # Apply category filter
    if category and category.strip():
        c_filter = category.strip().lower()
        filtered = [p for p in filtered if p.category and p.category.lower() == c_filter]

    # Sort
    reverse = (sort_order.lower() == "desc")
    if sort_by == "units_sold":
        filtered.sort(key=lambda p: p.units_sold, reverse=reverse)
    elif sort_by == "product_name":
        filtered.sort(key=lambda p: p.product_name.lower(), reverse=reverse)
    elif sort_by == "avg_unit_price":
        filtered.sort(key=lambda p: p.avg_unit_price, reverse=reverse)
    elif sort_by == "revenue_rank":
        filtered.sort(key=lambda p: p.revenue_rank, reverse=not reverse)
    elif sort_by == "profit" and any(p.total_profit is not None for p in filtered):
        filtered.sort(key=lambda p: p.total_profit or 0.0, reverse=reverse)
    else:
        # Default net_revenue
        filtered.sort(key=lambda p: p.net_revenue, reverse=reverse)

    total_count = len(filtered)
    start_idx = max(0, (page - 1) * page_size)
    paginated = filtered[start_idx : start_idx + page_size]

    return ProductListResponse(
        total_products=total_count,
        page=page,
        page_size=page_size,
        products=paginated,
        all_categories=categories
    )

@router.get("/reports/excel")
def download_excel_report(
    session_id: str,
    currency: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Download executive multi-sheet Excel report formatted with openpyxl."""
    sess = session_store.get(session_id)
    if not sess or sess.confirmed_df is None or sess.confirmed_df.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active dataset session found.")

    active_currency = currency or sess.currency
    df = filter_dataframe(sess.confirmed_df, start_date=start_date, end_date=end_date)
    
    excel_bytes = generate_excel_report(
        df=df,
        currency=active_currency,
        validation_summary=sess.validation_summary,
        dataset_name=sess.filename or "Sales Report"
    )

    filename = f"sales_report_{active_currency.lower()}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/reports/pdf")
def download_pdf_report(
    session_id: str,
    currency: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Download executive PDF report formatted with ReportLab vector charts."""
    sess = session_store.get(session_id)
    if not sess or sess.confirmed_df is None or sess.confirmed_df.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active dataset session found.")

    active_currency = currency or sess.currency
    df = filter_dataframe(sess.confirmed_df, start_date=start_date, end_date=end_date)

    pdf_bytes = generate_pdf_report(
        df=df,
        currency=active_currency,
        validation_summary=sess.validation_summary,
        dataset_name=sess.filename or "Sales Report"
    )

    filename = f"sales_report_{active_currency.lower()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/reports/csv")
def download_cleaned_csv(
    session_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Download cleaned accepted sales records in CSV format."""
    sess = session_store.get(session_id)
    if not sess or sess.confirmed_df is None or sess.confirmed_df.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active dataset session found.")

    df = filter_dataframe(sess.confirmed_df, start_date=start_date, end_date=end_date)
    csv_str = generate_cleaned_csv(df)

    filename = "cleaned_sales_data.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/reports/validation-errors")
def download_validation_errors(session_id: str):
    """Download rejected records and validation rejection reasons in CSV format."""
    sess = session_store.get(session_id)
    if not sess or sess.rejected_records is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active dataset session found.")

    csv_str = generate_validation_issues_csv(sess.rejected_records)
    filename = "validation_rejection_audit.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
