import pytest
import pandas as pd
from app.services.analyzer import (
    compute_kpi_stats, compute_trends, compute_product_performance,
    compute_category_distribution, filter_dataframe
)

@pytest.fixture
def sample_clean_df():
    return pd.DataFrame([
        {
            "order_id": "ORD-1", "date": "2025-01-10", "month": "2025-01", "year": "2025",
            "product": "Product A", "category": "Tech", "quantity": 2.0, "unit_price": 100.0,
            "discount_amount": 20.0, "gross_sales": 200.0, "net_sales": 180.0,
            "unit_cost": 50.0, "total_cost": 100.0, "profit": 80.0
        },
        {
            "order_id": "ORD-1", "date": "2025-01-10", "month": "2025-01", "year": "2025",
            "product": "Product B", "category": "Tech", "quantity": 1.0, "unit_price": 50.0,
            "discount_amount": 0.0, "gross_sales": 50.0, "net_sales": 50.0,
            "unit_cost": 30.0, "total_cost": 30.0, "profit": 20.0
        },
        {
            "order_id": "ORD-2", "date": "2025-02-15", "month": "2025-02", "year": "2025",
            "product": "Product A", "category": "Tech", "quantity": 3.0, "unit_price": 100.0,
            "discount_amount": 0.0, "gross_sales": 300.0, "net_sales": 300.0,
            "unit_cost": 50.0, "total_cost": 150.0, "profit": 150.0
        }
    ])

def test_kpi_calculations(sample_clean_df):
    kpis = compute_kpi_stats(sample_clean_df, currency="INR")
    
    assert kpis.total_gross_revenue == 550.0
    assert kpis.total_discount_amount == 20.0
    assert kpis.total_net_revenue == 530.0
    assert kpis.total_transactions == 3
    assert kpis.total_orders == 2  # ORD-1 and ORD-2
    assert kpis.order_count_label == "Unique Orders"
    assert kpis.has_order_ids is True
    assert kpis.total_units_sold == 6
    # AOV = Net Revenue / Orders = 530 / 2 = 265
    assert kpis.average_order_value == 265.0
    # Profit = 80 + 20 + 150 = 250
    assert kpis.total_profit == 250.0
    assert kpis.total_cost == 280.0
    # Margin = 250 / 530 * 100 = 47.17%
    assert round(kpis.profit_margin_pct, 1) == 47.2

def test_kpi_without_order_ids():
    df_no_orders = pd.DataFrame([
        {
            "order_id": None, "date": "2025-01-10", "month": "2025-01", "year": "2025",
            "product": "Widget", "category": "General", "quantity": 1.0, "unit_price": 100.0,
            "discount_amount": 0.0, "gross_sales": 100.0, "net_sales": 100.0,
            "unit_cost": None, "total_cost": None, "profit": None
        }
    ])
    kpis = compute_kpi_stats(df_no_orders, currency="USD")
    assert kpis.has_order_ids is False
    assert kpis.order_count_label == "Total Transactions"
    assert kpis.total_orders == 1

def test_monthly_and_weekly_trends(sample_clean_df):
    monthly_trends = compute_trends(sample_clean_df, grouping="monthly")
    assert len(monthly_trends) == 2  # 2025-01 and 2025-02
    
    jan = monthly_trends[0]
    assert jan.period == "2025-01"
    assert jan.net_revenue == 230.0  # 180 + 50
    assert jan.units_sold == 3
    assert jan.order_count == 1  # only ORD-1 in Jan

    feb = monthly_trends[1]
    assert feb.period == "2025-02"
    assert feb.net_revenue == 300.0
    assert feb.order_count == 1

def test_product_performance_rankings(sample_clean_df):
    prods = compute_product_performance(sample_clean_df)
    assert len(prods) == 2
    
    # Product A: 180 + 300 = 480 net rev, 5 units
    # Product B: 50 net rev, 1 unit
    p_a = next(p for p in prods if p.product_name == "Product A")
    p_b = next(p for p in prods if p.product_name == "Product B")
    
    assert p_a.revenue_rank == 1
    assert p_a.quantity_rank == 1
    assert p_b.revenue_rank == 2
    assert p_b.quantity_rank == 2
    assert p_a.net_revenue == 480.0
    assert round(p_a.revenue_share_pct, 1) == 90.6

def test_filtering_logic(sample_clean_df):
    # Filter by date
    f_date = filter_dataframe(sample_clean_df, start_date="2025-02-01")
    assert len(f_date) == 1
    assert f_date.iloc[0]["order_id"] == "ORD-2"

    # Filter by product
    f_prod = filter_dataframe(sample_clean_df, product="Product B")
    assert len(f_prod) == 1
    assert f_prod.iloc[0]["product"] == "Product B"

def test_empty_dataframe_handling():
    empty_df = pd.DataFrame()
    kpis = compute_kpi_stats(empty_df)
    assert kpis.total_net_revenue == 0.0
    assert kpis.total_transactions == 0
    assert compute_trends(empty_df) == []
    assert compute_product_performance(empty_df) == []
