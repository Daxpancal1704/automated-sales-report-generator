from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ColumnMapping(BaseModel):
    date: str
    product: str
    quantity: str
    unit_price: str
    order_id: Optional[str] = None
    discount: Optional[str] = None
    discount_type: Optional[str] = "percent"  # "percent" (0-100) or "amount" (monetary)
    cost: Optional[str] = None
    category: Optional[str] = None

class PreviewResponse(BaseModel):
    session_id: str
    filename: str
    total_raw_rows: int
    columns: List[str]
    sample_rows: List[Dict[str, Any]]
    suggested_mapping: Dict[str, str]
    file_size_bytes: int

class ValidationIssue(BaseModel):
    row_index: int
    row_identifier: Optional[str] = None
    field: str
    issue_type: str  # "error" or "warning"
    reason: str
    raw_data: Optional[Dict[str, Any]] = None

class ValidationSummary(BaseModel):
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    warning_count: int
    rejection_reasons: Dict[str, int]
    warnings: List[str]
    sample_rejected: List[ValidationIssue] = []

class ConfirmRequest(BaseModel):
    session_id: str
    mapping: ColumnMapping
    currency: str = "INR"

class ConfirmResponse(BaseModel):
    session_id: str
    status: str
    message: str
    validation: ValidationSummary

class KPIStats(BaseModel):
    total_gross_revenue: float
    total_discount_amount: float
    total_net_revenue: float
    total_orders: int
    order_count_label: str  # "Unique Orders" or "Total Transactions"
    has_order_ids: bool
    total_transactions: int
    total_units_sold: int
    average_order_value: float
    total_cost: Optional[float] = None
    total_profit: Optional[float] = None
    profit_margin_pct: Optional[float] = None
    has_cost_data: bool
    currency: str
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None
    total_products_count: int

class MonthlyTrend(BaseModel):
    period: str  # e.g., "2025-01"
    label: str   # e.g., "Jan 2025"
    gross_revenue: float
    net_revenue: float
    units_sold: int
    transaction_count: int
    order_count: int
    average_order_value: float
    profit: Optional[float] = None

class ProductStat(BaseModel):
    product_name: str
    category: Optional[str] = None
    units_sold: int
    net_revenue: float
    gross_revenue: float
    revenue_share_pct: float
    revenue_rank: int
    quantity_rank: int
    avg_unit_price: float
    total_cost: Optional[float] = None
    total_profit: Optional[float] = None
    profit_margin_pct: Optional[float] = None

class CategoryStat(BaseModel):
    category_name: str
    net_revenue: float
    units_sold: int
    share_pct: float

class DashboardResponse(BaseModel):
    has_data: bool
    session_id: Optional[str] = None
    dataset_info: Optional[Dict[str, Any]] = None
    kpis: Optional[KPIStats] = None
    monthly_trends: List[MonthlyTrend] = []
    top_products: List[ProductStat] = []
    category_breakdown: List[CategoryStat] = []
    validation_summary: Optional[ValidationSummary] = None
    recent_transactions: List[Dict[str, Any]] = []

class AnalyticsResponse(BaseModel):
    kpis: KPIStats
    trends: List[MonthlyTrend]
    category_breakdown: List[CategoryStat]
    available_products: List[str]
    available_categories: List[str]
    date_min: Optional[str]
    date_max: Optional[str]

class ProductListResponse(BaseModel):
    total_products: int
    page: int
    page_size: int
    products: List[ProductStat]
    all_categories: List[str]
