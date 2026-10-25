import io
import pandas as pd
from typing import Optional, Dict, Any, List
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart

from app.services.analyzer import compute_kpi_stats, compute_trends, compute_product_performance
from app.utils.formatting import format_currency_amount, get_currency_symbol

def generate_pdf_report(
    df: pd.DataFrame,
    currency: str = "INR",
    validation_summary: Optional[Dict[str, Any]] = None,
    dataset_name: str = "Sales Dataset"
) -> bytes:
    """
    Generate an executive-ready, polished PDF report using ReportLab.
    Contains KPI metric highlights, vector charts, data tables, and auditing sections.
    """
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    kpis = compute_kpi_stats(df, currency=currency)
    trends = compute_trends(df, grouping="monthly")
    products = compute_product_performance(df)
    currency_sym = get_currency_symbol(currency)

    # Styles
    styles = getSampleStyleSheet()
    
    brand_emerald = colors.HexColor("#059669")
    dark_slate = colors.HexColor("#0F172A")
    muted_slate = colors.HexColor("#475569")
    light_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=dark_slate,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=muted_slate,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=brand_emerald,
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=dark_slate,
    )
    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1, # Center
    )
    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=dark_slate,
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=dark_slate,
    )

    story: List[Any] = []

    # 1. Header Banner
    story.append(Paragraph("AUTOMATED SALES PERFORMANCE REPORT", title_style))
    story.append(Paragraph(
        f"<b>Source Dataset:</b> {dataset_name} &nbsp;|&nbsp; "
        f"<b>Reporting Period:</b> {kpis.date_range_start or 'N/A'} to {kpis.date_range_end or 'N/A'} &nbsp;|&nbsp; "
        f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        subtitle_style
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=brand_emerald, spaceBefore=2, spaceAfter=12))

    # 2. Executive KPI Cards Table
    story.append(Paragraph("EXECUTIVE SUMMARY & CORE METRICS", section_heading))
    
    kpi_card_data = [
        [
            Paragraph("<b>TOTAL NET REVENUE</b>", body_style),
            Paragraph("<b>TOTAL TRANSACTIONS</b>", body_style),
            Paragraph(f"<b>{kpis.order_count_label.upper()}</b>", body_style),
            Paragraph("<b>AVERAGE ORDER VALUE</b>", body_style),
        ],
        [
            Paragraph(f"<font size=12 color='#059669'><b>{format_currency_amount(kpis.total_net_revenue, currency, 0)}</b></font>", body_style),
            Paragraph(f"<font size=12 color='#0F172A'><b>{kpis.total_transactions:,}</b></font>", body_style),
            Paragraph(f"<font size=12 color='#0F172A'><b>{kpis.total_orders:,}</b></font>", body_style),
            Paragraph(f"<font size=12 color='#0F172A'><b>{format_currency_amount(kpis.average_order_value, currency, 1)}</b></font>", body_style),
        ],
        [
            Paragraph("<b>TOTAL UNITS SOLD</b>", body_style),
            Paragraph("<b>TOTAL GROSS SALES</b>", body_style),
            Paragraph("<b>TOTAL DISCOUNTS</b>", body_style),
            Paragraph("<b>GROSS PROFIT (MARGIN)</b>", body_style),
        ],
        [
            Paragraph(f"<font size=12 color='#0F172A'><b>{kpis.total_units_sold:,}</b></font>", body_style),
            Paragraph(f"<font size=12 color='#0F172A'><b>{format_currency_amount(kpis.total_gross_revenue, currency, 0)}</b></font>", body_style),
            Paragraph(f"<font size=12 color='#E11D48'><b>{format_currency_amount(kpis.total_discount_amount, currency, 0)}</b></font>", body_style),
            Paragraph(
                f"<font size=12 color='#059669'><b>{format_currency_amount(kpis.total_profit, currency, 0) if kpis.total_profit is not None else 'N/A'} ({kpis.profit_margin_pct or 0.0}%)</b></font>"
                if kpis.has_cost_data else "<font size=10 color='#64748B'>Cost not mapped</font>",
                body_style
            ),
        ]
    ]

    kpi_table = Table(kpi_card_data, colWidths=[130, 130, 130, 132])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 10))

    # 3. Native Vector Chart (Monthly Trend)
    if len(trends) >= 2:
        story.append(Paragraph(f"MONTHLY NET REVENUE TREND ({currency_sym})", section_heading))
        
        # Limit chart to max 12 periods for clarity
        chart_trends = trends[-12:]
        drawing = Drawing(522, 130)
        bc = VerticalBarChart()
        bc.x = 40
        bc.y = 20
        bc.height = 95
        bc.width = 465
        
        # Values in thousands for clean Y-axis
        max_rev = max(t.net_revenue for t in chart_trends) or 1.0
        divisor = 1000.0 if max_rev >= 50000 else 1.0
        div_label = "k" if divisor == 1000.0 else ""
        
        data_series = [[t.net_revenue / divisor for t in chart_trends]]
        bc.data = data_series
        bc.categoryAxis.categoryNames = [t.label.split(" ")[0] for t in chart_trends]
        bc.categoryAxis.labels.fontSize = 7
        bc.categoryAxis.labels.dy = -10
        bc.bars[0].fillColor = brand_emerald
        bc.valueAxis.valueMin = 0
        bc.valueAxis.labels.fontSize = 7
        
        drawing.add(bc)
        drawing.add(String(45, 120, f"Net Revenue ({currency_sym}{div_label})", fontName="Helvetica-Bold", fontSize=8, fillColor=muted_slate))
        story.append(drawing)
        story.append(Spacer(1, 8))

    # 4. Monthly Performance Table
    story.append(Paragraph("MONTHLY SALES SUMMARY", section_heading))
    monthly_table_rows = [
        [
            Paragraph("<b>Period</b>", table_header_style),
            Paragraph("<b>Net Sales</b>", table_header_style),
            Paragraph("<b>Gross Sales</b>", table_header_style),
            Paragraph("<b>Discounts</b>", table_header_style),
            Paragraph("<b>Units</b>", table_header_style),
            Paragraph("<b>Orders</b>", table_header_style),
            Paragraph("<b>AOV</b>", table_header_style),
        ]
    ]

    for t in trends[:12]:
        monthly_table_rows.append([
            Paragraph(t.label, table_cell_bold),
            Paragraph(format_currency_amount(t.net_revenue, currency, 0), table_cell_style),
            Paragraph(format_currency_amount(t.gross_revenue, currency, 0), table_cell_style),
            Paragraph(format_currency_amount(t.gross_revenue - t.net_revenue, currency, 0), table_cell_style),
            Paragraph(f"{t.units_sold:,}", table_cell_style),
            Paragraph(f"{t.order_count:,}", table_cell_style),
            Paragraph(format_currency_amount(t.average_order_value, currency, 0), table_cell_style),
        ])

    m_table = Table(monthly_table_rows, colWidths=[85, 75, 75, 70, 50, 50, 75])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), brand_emerald),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 10))

    # 5. Top 5 Products Table
    story.append(Paragraph("TOP-PERFORMING PRODUCTS", section_heading))
    prod_table_rows = [
        [
            Paragraph("<b>Rank</b>", table_header_style),
            Paragraph("<b>Product Name</b>", table_header_style),
            Paragraph("<b>Category</b>", table_header_style),
            Paragraph("<b>Units Sold</b>", table_header_style),
            Paragraph("<b>Net Revenue</b>", table_header_style),
            Paragraph("<b>Rev Share %</b>", table_header_style),
        ]
    ]

    for p in products[:5]:
        prod_table_rows.append([
            Paragraph(str(p.revenue_rank), table_cell_bold),
            Paragraph(p.product_name, table_cell_bold),
            Paragraph(p.category or "General", table_cell_style),
            Paragraph(f"{p.units_sold:,}", table_cell_style),
            Paragraph(format_currency_amount(p.net_revenue, currency, 0), table_cell_style),
            Paragraph(f"{p.revenue_share_pct:.1f}%", table_cell_style),
        ])

    p_table = Table(prod_table_rows, colWidths=[40, 180, 80, 60, 90, 72])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), brand_emerald),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 10))

    # 6. Data Quality & Auditing
    if validation_summary:
        story.append(Paragraph("DATA INTEGRITY & VALIDATION SUMMARY", section_heading))
        acc = validation_summary.get("accepted_rows", 0)
        rej = validation_summary.get("rejected_rows", 0)
        warns = validation_summary.get("warning_count", 0)
        story.append(Paragraph(
            f"<b>Ingestion Audit:</b> {acc:,} accepted valid records, {rej:,} rejected invalid records, {warns:,} data warnings.<br/>"
            f"Records with missing dates, zero/negative quantities, or negative unit prices were quarantined and excluded from business metrics.",
            body_style
        ))
        story.append(Spacer(1, 6))

    # 7. Methodology & Accounting Rules
    story.append(Paragraph("METHODOLOGY & ACCOUNTING ASSUMPTIONS", section_heading))
    methodology_text = (
        "• <b>Net Sales Revenue:</b> Computed as (Quantity × Unit Price) minus any recorded discounts.<br/>"
        "• <b>Order Counting:</b> When unique Order IDs are present, order count represents distinct transactions. "
        "Multiple items bearing the same Order ID are evaluated as line-items of a single order. If missing, line items are treated as individual sales rows.<br/>"
        "• <b>Currency Notice:</b> Displayed in configured currency symbol. Currency switching is a formatting tool and does not apply dynamic FX exchange rates.<br/>"
        "• <b>Date Handling:</b> Sales dates are recorded in date-only format without localized timezone offsets."
    )
    story.append(Paragraph(methodology_text, body_style))

    # Build PDF
    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()
