# Sales Data Dictionary & Business Logic Reference

This document outlines the standard schema, column mapping expectations, and exact mathematical formulas used across the **Automated Sales Report Generator**.

---

## 1. Schema & Standard Column Roles

| Role | Required? | Accepted Field Variations | Type | Description & Validation Rules |
|---|---|---|---|---|
| **Date** | **Yes** | `Date`, `Order_Date`, `Sale_Date`, `Timestamp`, `Invoice_Date`, `Day` | ISO Date String (`YYYY-MM-DD`) | Date on which the sale took place. Parsed as date-only representation without timezone conversion. |
| **Product** | **Yes** | `Product`, `Product_Name`, `Item`, `Item_Name`, `SKU`, `Title`, `Description` | String | Product name or SKU. Non-empty string; empty strings are rejected. |
| **Quantity** | **Yes** | `Quantity`, `Qty`, `Units`, `Units_Sold`, `Count`, `Volume` | Float / Integer | Number of units purchased. Must be strictly positive (`> 0`). Non-numeric, zero, or negative numbers are rejected. |
| **Unit Price** | **Yes** | `Unit_Price`, `Price`, `Rate`, `Selling_Price`, `UnitPrice` | Float | Unit selling price. Must be non-negative (`>= 0`). Non-numeric or negative numbers are rejected. |
| **Order ID** | Optional | `Order_ID`, `OrderID`, `Invoice_ID`, `Transaction_ID`, `Receipt_No` | String | Unique purchase basket identifier. Used to group multiple item rows into single orders. |
| **Discount** | Optional | `Discount`, `Discount_Percent`, `Discount_Pct`, `Rebate`, `Discount_Amount` | Float | Discount percentage (0-100%) or flat monetary amount. |
| **Unit Cost** | Optional | `Unit_Cost`, `Cost`, `COGS`, `Buy_Price`, `Cost_Price` | Float | Purchase/manufacturing cost per unit. Enables Gross Profit and Margin calculations. |
| **Category** | Optional | `Category`, `Product_Category`, `Department`, `Segment` | String | Product segment grouping (e.g., Electronics, Furniture). Default: `'General'`. |

---

## 2. Business Formulas & Calculations

### 2.1. Gross Sales Revenue
$$\text{Gross Sales} = \text{Quantity} \times \text{Unit Price}$$

### 2.2. Discount Calculation
- If **Discount Type** is **Percentage** ($D_{\%}$):
  $$\text{Discount Amount} = \text{Gross Sales} \times \left(\frac{D_{\%}}{100}\right)$$
- If **Discount Type** is **Monetary Amount** ($D_{\$}$):
  $$\text{Discount Amount} = \min(\text{Gross Sales}, D_{\$})$$

### 2.3. Net Sales Revenue
$$\text{Net Sales Revenue} = \max(0, \text{Gross Sales} - \text{Discount Amount})$$

### 2.4. Orders vs Transactions
- When **Order ID** is provided:
  $$\text{Order Count} = \text{Count of unique, non-null Order IDs}$$
  $$\text{Transaction Count} = \text{Total line item rows in dataset}$$
- When **Order ID** is missing:
  $$\text{Order Count} = \text{Transaction Count} = \text{Total line item rows}$$

### 2.5. Average Order Value (AOV)
$$\text{AOV} = \frac{\text{Total Net Sales Revenue}}{\text{Order Count}}$$

### 2.6. Cost, Gross Profit & Profit Margin
*(Calculated only if Unit Cost is mapped and present)*
$$\text{Total Cost} = \text{Quantity} \times \text{Unit Cost}$$
$$\text{Gross Profit} = \text{Net Sales Revenue} - \text{Total Cost}$$
$$\text{Gross Profit Margin} = \left(\frac{\text{Gross Profit}}{\text{Net Sales Revenue}}\right) \times 100\%$$

---

## 3. Quarantined Error Classifications

Records violating the following rules are quarantined from analysis:
1. `Missing or empty Product Name`
2. `Missing Date value`
3. `Invalid date format or unparseable date`
4. `Quantity must be strictly positive (> 0)`
5. `Non-numeric Quantity value`
6. `Unit Price cannot be negative (< 0)`
7. `Non-numeric Unit Price value`
8. `Discount cannot be negative (< 0)`
9. `Discount percentage exceeds 100%`
10. `Unit Cost cannot be negative (< 0)`
