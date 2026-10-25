import pandas as pd
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from app.models.schemas import KPIStats, MonthlyTrend, ProductStat, CategoryStat

def filter_dataframe(
    df: pd.DataFrame,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product: Optional[str] = None,
    category: Optional[str] = None
) -> pd.DataFrame:
    """Apply interactive filters to the cleaned sales DataFrame."""
    if df.empty:
        return df

    filtered = df.copy()

    if start_date:
        filtered = filtered[filtered["date"] >= start_date]

    if end_date:
        filtered = filtered[filtered["date"] <= end_date]

    if product and product.strip():
        filtered = filtered[filtered["product"].str.lower() == product.strip().lower()]

    if category and category.strip():
        filtered = filtered[filtered["category"].str.lower() == category.strip().lower()]

    return filtered

def compute_kpi_stats(df: pd.DataFrame, currency: str = "INR") -> KPIStats:
    """Compute high-level KPI metrics from cleaned sales data."""
    if df.empty:
        return KPIStats(
            total_gross_revenue=0.0,
            total_discount_amount=0.0,
            total_net_revenue=0.0,
            total_orders=0,
            order_count_label="Total Transactions",
            has_order_ids=False,
            total_transactions=0,
            total_units_sold=0,
            average_order_value=0.0,
            total_cost=None,
            total_profit=None,
            profit_margin_pct=None,
            has_cost_data=False,
            currency=currency,
            date_range_start=None,
            date_range_end=None,
            total_products_count=0
        )

    gross_rev = float(df["gross_sales"].sum())
    discount_amt = float(df["discount_amount"].sum())
    net_rev = float(df["net_sales"].sum())
    tx_count = len(df)
    units_sold = int(df["quantity"].sum())

    # Distinguish unique orders vs transactions
    has_orders = "order_id" in df.columns and df["order_id"].notna().any()
    if has_orders:
        valid_orders = df[df["order_id"].notna()]["order_id"]
        order_count = int(valid_orders.nunique())
        order_label = "Unique Orders"
    else:
        order_count = tx_count
        order_label = "Total Transactions"

    aov = (net_rev / order_count) if order_count > 0 else 0.0

    # Cost and profit
    has_cost = "total_cost" in df.columns and df["total_cost"].notna().any()
    total_cost = None
    total_profit = None
    margin_pct = None
    if has_cost:
        valid_cost_df = df[df["total_cost"].notna()]
        total_cost = float(valid_cost_df["total_cost"].sum())
        total_profit = float(valid_cost_df["profit"].sum())
        margin_pct = (total_profit / net_rev * 100.0) if net_rev > 0 else 0.0

    date_min = str(df["date"].min())
    date_max = str(df["date"].max())
    prod_count = int(df["product"].nunique())

    return KPIStats(
        total_gross_revenue=round(gross_rev, 2),
        total_discount_amount=round(discount_amt, 2),
        total_net_revenue=round(net_rev, 2),
        total_orders=order_count,
        order_count_label=order_label,
        has_order_ids=has_orders,
        total_transactions=tx_count,
        total_units_sold=units_sold,
        average_order_value=round(aov, 2),
        total_cost=round(total_cost, 2) if total_cost is not None else None,
        total_profit=round(total_profit, 2) if total_profit is not None else None,
        profit_margin_pct=round(margin_pct, 1) if margin_pct is not None else None,
        has_cost_data=has_cost,
        currency=currency,
        date_range_start=date_min,
        date_range_end=date_max,
        total_products_count=prod_count
    )

def compute_trends(df: pd.DataFrame, grouping: str = "monthly") -> List[MonthlyTrend]:
    """
    Compute time-series trends grouped by month, week, or day.
    """
    if df.empty:
        return []

    df_copy = df.copy()
    
    if grouping == "weekly":
        df_copy["period"] = pd.to_datetime(df_copy["date"]).dt.to_period("W").astype(str)
        df_copy["label"] = "Wk " + df_copy["period"]
    elif grouping == "daily":
        df_copy["period"] = df_copy["date"]
        df_copy["label"] = df_copy["date"]
    else:
        # Default monthly
        df_copy["period"] = df_copy["month"]
        # Format label e.g., "Jan 2025"
        try:
            df_copy["label"] = pd.to_datetime(df_copy["period"] + "-01").dt.strftime("%b %Y")
        except Exception:
            df_copy["label"] = df_copy["period"]

    has_orders = "order_id" in df.columns and df["order_id"].notna().any()

    grouped = df_copy.groupby(["period", "label"], sort=True)
    trends: List[MonthlyTrend] = []

    for (period, label), group in grouped:
        net_rev = float(group["net_sales"].sum())
        gross_rev = float(group["gross_sales"].sum())
        units = int(group["quantity"].sum())
        txs = len(group)
        orders = int(group["order_id"].nunique()) if has_orders else txs
        aov = (net_rev / orders) if orders > 0 else 0.0
        profit = float(group["profit"].sum()) if "profit" in group.columns and group["profit"].notna().any() else None

        trends.append(MonthlyTrend(
            period=period,
            label=label,
            gross_revenue=round(gross_rev, 2),
            net_revenue=round(net_rev, 2),
            units_sold=units,
            transaction_count=txs,
            order_count=orders,
            average_order_value=round(aov, 2),
            profit=round(profit, 2) if profit is not None else None
        ))

    # Sort chronologically by period
    trends.sort(key=lambda t: t.period)
    return trends

def compute_product_performance(df: pd.DataFrame) -> List[ProductStat]:
    """
    Compute product metrics: revenue, units, rankings, revenue share, and profit margin.
    """
    if df.empty:
        return []

    total_net_rev = float(df["net_sales"].sum())
    has_cost = "total_cost" in df.columns and df["total_cost"].notna().any()

    product_stats: List[Dict[str, Any]] = []

    for prod_name, group in df.groupby("product"):
        net_rev = float(group["net_sales"].sum())
        gross_rev = float(group["gross_sales"].sum())
        units = int(group["quantity"].sum())
        avg_price = float(group["unit_price"].mean())
        category = group["category"].iloc[0] if "category" in group.columns else "General"

        total_cost = float(group["total_cost"].sum()) if has_cost and group["total_cost"].notna().any() else None
        total_profit = float(group["profit"].sum()) if has_cost and group["profit"].notna().any() else None
        margin_pct = (total_profit / net_rev * 100.0) if (total_profit is not None and net_rev > 0) else None
        rev_share = (net_rev / total_net_rev * 100.0) if total_net_rev > 0 else 0.0

        product_stats.append({
            "product_name": prod_name,
            "category": category,
            "units_sold": units,
            "net_revenue": round(net_rev, 2),
            "gross_revenue": round(gross_rev, 2),
            "revenue_share_pct": round(rev_share, 2),
            "avg_unit_price": round(avg_price, 2),
            "total_cost": round(total_cost, 2) if total_cost is not None else None,
            "total_profit": round(total_profit, 2) if total_profit is not None else None,
            "profit_margin_pct": round(margin_pct, 1) if margin_pct is not None else None,
        })

    # Sort by revenue to assign revenue rankings
    product_stats.sort(key=lambda x: x["net_revenue"], reverse=True)
    for rank, p in enumerate(product_stats, start=1):
        p["revenue_rank"] = rank

    # Sort by quantity to assign quantity rankings
    by_qty = sorted(product_stats, key=lambda x: x["units_sold"], reverse=True)
    qty_ranks = {p["product_name"]: rank for rank, p in enumerate(by_qty, start=1)}
    for p in product_stats:
        p["quantity_rank"] = qty_ranks[p["product_name"]]

    return [ProductStat(**p) for p in product_stats]

def compute_category_distribution(df: pd.DataFrame) -> List[CategoryStat]:
    """Compute revenue and volume breakdown across categories."""
    if df.empty or "category" not in df.columns:
        return []

    total_net_rev = float(df["net_sales"].sum())
    categories: List[CategoryStat] = []

    for cat_name, group in df.groupby("category"):
        net_rev = float(group["net_sales"].sum())
        units = int(group["quantity"].sum())
        share = (net_rev / total_net_rev * 100.0) if total_net_rev > 0 else 0.0

        categories.append(CategoryStat(
            category_name=cat_name,
            net_revenue=round(net_rev, 2),
            units_sold=units,
            share_pct=round(share, 1)
        ))

    categories.sort(key=lambda c: c.net_revenue, reverse=True)
    return categories
