export interface ColumnMapping {
  date: string;
  product: string;
  quantity: string;
  unit_price: string;
  order_id?: string;
  discount?: string;
  discount_type?: 'percent' | 'amount';
  cost?: string;
  category?: string;
}

export interface PreviewData {
  session_id: string;
  filename: string;
  total_raw_rows: number;
  columns: string[];
  sample_rows: Record<string, any>[];
  suggested_mapping: Record<string, string>;
  file_size_bytes: number;
}

export interface ValidationIssue {
  row_index: number;
  row_identifier?: string;
  field: string;
  issue_type: string;
  reason: string;
  raw_data?: Record<string, any>;
}

export interface ValidationSummary {
  total_rows: number;
  accepted_rows: number;
  rejected_rows: number;
  warning_count: number;
  rejection_reasons: Record<string, number>;
  warnings: string[];
  sample_rejected: ValidationIssue[];
}

export interface KPIStats {
  total_gross_revenue: number;
  total_discount_amount: number;
  total_net_revenue: number;
  total_orders: number;
  order_count_label: string;
  has_order_ids: boolean;
  total_transactions: number;
  total_units_sold: number;
  average_order_value: number;
  total_cost?: number | null;
  total_profit?: number | null;
  profit_margin_pct?: number | null;
  has_cost_data: boolean;
  currency: string;
  date_range_start?: string | null;
  date_range_end?: string | null;
  total_products_count: number;
}

export interface MonthlyTrend {
  period: string;
  label: string;
  gross_revenue: number;
  net_revenue: number;
  units_sold: number;
  transaction_count: number;
  order_count: number;
  average_order_value: number;
  profit?: number | null;
}

export interface ProductStat {
  product_name: string;
  category?: string;
  units_sold: number;
  net_revenue: number;
  gross_revenue: number;
  revenue_share_pct: number;
  revenue_rank: number;
  quantity_rank: number;
  avg_unit_price: number;
  total_cost?: number | null;
  total_profit?: number | null;
  profit_margin_pct?: number | null;
}

export interface CategoryStat {
  category_name: string;
  net_revenue: number;
  units_sold: number;
  share_pct: number;
}

export interface DatasetInfo {
  filename: string;
  total_records: number;
  is_demo: boolean;
  currency: string;
}

export interface DashboardData {
  has_data: boolean;
  session_id?: string;
  dataset_info?: DatasetInfo;
  kpis?: KPIStats;
  monthly_trends: MonthlyTrend[];
  top_products: ProductStat[];
  category_breakdown: CategoryStat[];
  validation_summary?: ValidationSummary;
  recent_transactions: Record<string, any>[];
}

export interface AnalyticsData {
  kpis: KPIStats;
  trends: MonthlyTrend[];
  category_breakdown: CategoryStat[];
  available_products: string[];
  available_categories: string[];
  date_min?: string;
  date_max?: string;
}

export interface ProductListData {
  total_products: number;
  page: number;
  page_size: number;
  products: ProductStat[];
  all_categories: string[];
}
