import pytest
import pandas as pd
from app.models.schemas import ColumnMapping
from app.services.validator import validate_and_clean_dataset

def test_valid_dataset_cleaning():
    data = {
        "Order_ID": ["ORD-1", "ORD-1", "ORD-2"],
        "Date": ["2025-01-10", "2025-01-10", "2025-01-15"],
        "Product": ["Laptop", "Mouse", "Keyboard"],
        "Quantity": [1, 2, 1],
        "Unit_Price": [50000, 1000, 2500],
        "Discount": [10, 0, 5],
        "Cost": [35000, 600, 1500]
    }
    df = pd.DataFrame(data)
    mapping = ColumnMapping(
        date="Date", product="Product", quantity="Quantity", unit_price="Unit_Price",
        order_id="Order_ID", discount="Discount", discount_type="percent", cost="Cost"
    )

    clean_df, summary, rejected = validate_and_clean_dataset(df, mapping)

    assert summary.total_rows == 3
    assert summary.accepted_rows == 3
    assert summary.rejected_rows == 0
    assert len(clean_df) == 3
    
    # Check Net Sales calculations
    # Row 0: 1 * 50000 = 50000, 10% disc = 5000, net = 45000, profit = 45000 - 35000 = 10000
    assert clean_df.iloc[0]["gross_sales"] == 50000.0
    assert clean_df.iloc[0]["discount_amount"] == 5000.0
    assert clean_df.iloc[0]["net_sales"] == 45000.0
    assert clean_df.iloc[0]["profit"] == 10000.0

def test_rejected_records_with_invalid_values():
    data = {
        "Date": ["2025-02-01", "not-a-date", "2025-02-03", "2025-02-04", "2025-02-05"],
        "Product": ["Phone", "Tablet", "", "Watch", "Charger"],
        "Quantity": [-1, 2, 1, "five", 0],  # -1 is negative, 'five' is non-numeric, 0 is non-positive
        "Unit_Price": [15000, 20000, 3000, -100, 500], # -100 is negative
    }
    df = pd.DataFrame(data)
    mapping = ColumnMapping(
        date="Date", product="Product", quantity="Quantity", unit_price="Unit_Price"
    )

    clean_df, summary, rejected = validate_and_clean_dataset(df, mapping)

    # Row 0: Negative quantity -> rejected
    # Row 1: Invalid date -> rejected
    # Row 2: Empty product -> rejected
    # Row 3: Non-numeric quantity -> rejected
    # Row 4: Zero quantity -> rejected
    assert summary.accepted_rows == 0
    assert summary.rejected_rows == 5
    assert len(rejected) == 5

def test_duplicate_records_detection():
    data = {
        "Date": ["2025-03-01", "2025-03-01"],
        "Product": ["Headphones", "Headphones"],
        "Quantity": [1, 1],
        "Unit_Price": [3000, 3000]
    }
    df = pd.DataFrame(data)
    mapping = ColumnMapping(
        date="Date", product="Product", quantity="Quantity", unit_price="Unit_Price"
    )

    clean_df, summary, rejected = validate_and_clean_dataset(df, mapping)
    assert summary.accepted_rows == 2
    assert summary.warning_count >= 1
    assert any("duplicate" in w.lower() for w in summary.warnings)

def test_missing_required_column_raises_error():
    data = {"Product": ["A"], "Quantity": [1], "Unit_Price": [10]}
    df = pd.DataFrame(data)
    mapping = ColumnMapping(
        date="MissingDateCol", product="Product", quantity="Quantity", unit_price="Unit_Price"
    )
    with pytest.raises(ValueError) as exc:
        validate_and_clean_dataset(df, mapping)
    assert "MissingDateCol" in str(exc.value)
