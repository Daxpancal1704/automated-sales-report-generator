import React from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { RevenueTrendChart } from '../components/charts/RevenueTrendChart';
import { TopProductsChart } from '../components/charts/TopProductsChart';
import { CategoryDistributionChart } from '../components/charts/CategoryDistributionChart';
import { formatCurrency, formatNumber } from '../services/api';

export const DashboardPage: React.FC = () => {
  const { dashboardData, loading, currency, setActiveTab } = useSales();

  if (loading && !dashboardData) {
    return <LoadingSpinner label="Loading dashboard analytics..." />;
  }

  if (!dashboardData || !dashboardData.has_data || !dashboardData.kpis) {
    return <EmptyState />;
  }

  const kpis = dashboardData.kpis;
  const valSummary = dashboardData.validation_summary;

  return (
    <div className="space-y-6">
      {/* Dataset Overview Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                {dashboardData.dataset_info?.filename}
              </h2>
              {dashboardData.dataset_info?.is_demo && (
                <Badge variant="blue" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                  Synthetic Demo
                </Badge>
              )}
              <Badge variant="emerald" size="sm">
                {formatNumber(kpis.total_transactions)} Line Items
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Period: {kpis.date_range_start || 'N/A'} &mdash; {kpis.date_range_end || 'N/A'}
              </span>
              <span>&bull;</span>
              <span>{kpis.total_products_count} Unique Products Analyzed</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('analytics')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Explore Analytics
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('reports')}
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Download Reports
          </Button>
        </div>
      </div>

      {/* Data Quality Warning Notice (if any) */}
      {valSummary && (valSummary.rejected_rows > 0 || valSummary.warning_count > 0) && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-900">
            <span className="font-bold">Data Quality Audit Notice: </span>
            {valSummary.rejected_rows > 0 ? (
              <span>
                {valSummary.rejected_rows} invalid row(s) were automatically quarantined to maintain calculation integrity.
              </span>
            ) : null}{' '}
            {valSummary.warnings.length > 0 ? valSummary.warnings[0] : ''}
          </div>
          <button
            onClick={() => setActiveTab('upload')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
          >
            Review Audit Details
          </button>
        </div>
      )}

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Revenue */}
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Net Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(kpis.total_net_revenue, currency, 0)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Gross: {formatCurrency(kpis.total_gross_revenue, currency, 0)}</span>
            {kpis.total_discount_amount > 0 && (
              <span className="text-rose-600 font-medium">
                Disc: -{formatCurrency(kpis.total_discount_amount, currency, 0)}
              </span>
            )}
          </div>
        </Card>

        {/* KPI 2: Total Orders / Transactions */}
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {kpis.order_count_label}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(kpis.total_orders)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sales Line Items: {formatNumber(kpis.total_transactions)}</span>
            <Badge variant="slate" size="sm">
              {kpis.has_order_ids ? 'Order IDs Mapped' : 'Row Level'}
            </Badge>
          </div>
        </Card>

        {/* KPI 3: Total Units Sold */}
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Units Sold
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(kpis.total_units_sold)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Avg Units / Order</span>
            <span className="font-semibold text-slate-700">
              {kpis.total_orders > 0
                ? (kpis.total_units_sold / kpis.total_orders).toFixed(1)
                : '1.0'}
            </span>
          </div>
        </Card>

        {/* KPI 4: Average Order Value (AOV) & Profit Margin */}
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Order Value (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(kpis.average_order_value, currency, 1)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            {kpis.has_cost_data && kpis.profit_margin_pct != null ? (
              <>
                <span className="text-slate-500 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-600" /> Margin:
                </span>
                <span className="font-bold text-emerald-700">
                  {kpis.profit_margin_pct != null ? kpis.profit_margin_pct.toFixed(1) : '0.0'}% ({formatCurrency(kpis.total_profit, currency, 0)})
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-500">Net Sales / Orders</span>
                <span className="text-slate-700 font-medium">Standard AOV</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Revenue Trend Area Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Monthly Net Revenue Trend"
            subtitle="Analyzed timeline performance across billing cycles"
            action={
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                Deep-dive filters <ArrowRight className="w-3 h-3" />
              </button>
            }
          >
            <RevenueTrendChart
              data={dashboardData.monthly_trends}
              currency={currency}
              height={290}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card
            title="Category Revenue Share"
            subtitle="Distribution by product segments"
          >
            <CategoryDistributionChart
              categories={dashboardData.category_breakdown}
              currency={currency}
              height={290}
            />
          </Card>
        </div>
      </div>

      {/* Row 3: Top 5 Products Table & Horizontal Comparison Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products Table */}
        <Card
          title="Top-Performing Products"
          subtitle="Ranked by total net sales revenue contribution"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('products')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              All Products
            </Button>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-right">Units</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                  <th className="py-3 px-4 text-right">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData.top_products.map((prod) => (
                  <tr key={prod.product_name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center justify-center text-[10px]">
                        #{prod.revenue_rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{prod.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{prod.category || 'General'}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-medium">
                      {formatNumber(prod.units_sold)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(prod.net_revenue, currency, 0)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {prod.revenue_share_pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Products Comparison Chart */}
        <Card
          title="Product Revenue Comparison"
          subtitle="Direct sales comparison among leading products"
        >
          <TopProductsChart
            products={dashboardData.top_products}
            currency={currency}
            height={275}
          />
        </Card>
      </div>

      {/* Row 4: Recent Valid Transactions Sample */}
      <Card
        title="Recent Verified Sales Records"
        subtitle="Sample of latest processed orders in current dataset"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('reports')}
          >
            Export All Records (.csv)
          </Button>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Discounts</th>
                <th className="py-3 px-4 text-right">Net Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboardData.recent_transactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                    {tx.order_id || `TXN-${idx + 1}`}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{tx.date}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{tx.product}</td>
                  <td className="py-2.5 px-4 text-right text-slate-700 font-semibold">{tx.quantity}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600">
                    {formatCurrency(tx.unit_price, currency, 2)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-rose-600">
                    {tx.discount_amount > 0 ? `-${formatCurrency(tx.discount_amount, currency, 2)}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                    {formatCurrency(tx.net_sales, currency, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
