import React, { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { RevenueTrendChart } from '../components/charts/RevenueTrendChart';
import { SalesVolumeChart } from '../components/charts/SalesVolumeChart';
import { api, formatCurrency, formatNumber } from '../services/api';
import type { AnalyticsData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { sessionId, currency, setActiveTab } = useSales();

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [grouping, setGrouping] = useState<string>('monthly');

  const fetchAnalytics = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAnalytics(sessionId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        product: selectedProduct || undefined,
        category: selectedCategory || undefined,
        grouping,
        currency,
      });
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [sessionId, startDate, endDate, selectedProduct, selectedCategory, grouping, currency]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedProduct('');
    setSelectedCategory('');
    setGrouping('monthly');
  };

  const handleApplyPreset = (preset: 'all' | 'last30' | 'last90') => {
    if (!analyticsData) return;
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (analyticsData.date_max) {
      const maxDate = new Date(analyticsData.date_max);
      const days = preset === 'last30' ? 30 : 90;
      const minDate = new Date(maxDate.getTime() - days * 24 * 60 * 60 * 1000);
      setStartDate(minDate.toISOString().split('T')[0]);
      setEndDate(analyticsData.date_max);
    }
  };

  if (!sessionId) {
    return <EmptyState title="No Active Sales Dataset for Analytics" />;
  }

  const kpis = analyticsData?.kpis;

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" title="Analytics Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters Toolbar */}
      <Card noPadding className="p-4 sm:p-5 bg-white border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Interactive Analytics Filters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Presets:</span>
              <button
                onClick={() => handleApplyPreset('all')}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                All Time
              </button>
              <button
                onClick={() => handleApplyPreset('last90')}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                Last 90 Days
              </button>
              <button
                onClick={() => handleApplyPreset('last30')}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={handleResetFilters}
                className="text-xs px-2.5 py-1 rounded text-slate-500 hover:text-slate-800 font-medium transition-colors ml-2"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">From Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  min={analyticsData?.date_min}
                  max={analyticsData?.date_max}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  min={startDate || analyticsData?.date_min}
                  max={analyticsData?.date_max}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filter by Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Products</option>
                {analyticsData?.available_products.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Categories</option>
                {analyticsData?.available_categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeline Grouping */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Timeline Grouping</label>
              <select
                value={grouping}
                onChange={(e) => setGrouping(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="monthly">Monthly Periods</option>
                <option value="weekly">Weekly Intervals</option>
                <option value="daily">Daily Aggregation</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner label="Recalculating metrics and trend series..." />
      )}

      {/* Filtered Metrics & Charts */}
      {kpis && !loading && (
        <>
          {/* Dynamic Filtered KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-emerald-100 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Filtered Net Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {formatCurrency(kpis.total_net_revenue, currency, 0)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Gross: {formatCurrency(kpis.total_gross_revenue, currency, 0)}
              </span>
            </Card>

            <Card className="border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">{kpis.order_count_label}</span>
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {formatNumber(kpis.total_orders)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {formatNumber(kpis.total_transactions)} Line Items
              </span>
            </Card>

            <Card className="border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Units Sold</span>
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {formatNumber(kpis.total_units_sold)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Active in selection
              </span>
            </Card>

            <Card className="border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Average Order Value</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {formatCurrency(kpis.average_order_value, currency, 1)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {kpis.has_cost_data && kpis.profit_margin_pct != null
                  ? `Margin: ${kpis.profit_margin_pct.toFixed(1)}%`
                  : 'Net Revenue / Orders'}
              </span>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Revenue Trajectory"
              subtitle={`Time-series progression (${grouping} grouping)`}
            >
              <RevenueTrendChart
                data={analyticsData?.trends || []}
                currency={currency}
                height={280}
              />
            </Card>

            <Card
              title="Sales & Order Volume"
              subtitle={`Volume distribution across intervals (${grouping})`}
            >
              <SalesVolumeChart
                data={analyticsData?.trends || []}
                height={280}
              />
            </Card>
          </div>

          {/* Time Series Summary Table */}
          <Card
            title="Aggregated Timeline Breakdown"
            subtitle="Detailed metrics across chronological intervals"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('reports')}
              >
                Export Excel / PDF
              </Button>
            }
            noPadding
          >
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4 text-right">Net Revenue</th>
                    <th className="py-2.5 px-4 text-right">Gross Sales</th>
                    <th className="py-2.5 px-4 text-right">Discounts</th>
                    <th className="py-2.5 px-4 text-right">Units</th>
                    <th className="py-2.5 px-4 text-right">Orders</th>
                    <th className="py-2.5 px-4 text-right">AOV</th>
                    {kpis.has_cost_data && (
                      <th className="py-2.5 px-4 text-right">Gross Profit</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analyticsData?.trends || []).map((t) => (
                    <tr key={t.period} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{t.label}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(t.net_revenue, currency, 0)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600">
                        {formatCurrency(t.gross_revenue, currency, 0)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-rose-600">
                        {t.gross_revenue > t.net_revenue
                          ? `-${formatCurrency(t.gross_revenue - t.net_revenue, currency, 0)}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-slate-800">
                        {formatNumber(t.units_sold)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700">
                        {formatNumber(t.order_count)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600">
                        {formatCurrency(t.average_order_value, currency, 1)}
                      </td>
                      {kpis.has_cost_data && (
                        <td className="py-2.5 px-4 text-right font-semibold text-teal-700">
                          {formatCurrency(t.profit, currency, 0)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
