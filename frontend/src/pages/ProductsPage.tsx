import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { api, formatCurrency, formatNumber } from '../services/api';
import type { ProductListData } from '../types';

export const ProductsPage: React.FC = () => {
  const { sessionId, currency, setActiveTab } = useSales();

  const [productData, setProductData] = useState<ProductListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter & Sort state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('net_revenue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchProducts = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProducts(sessionId, {
        search,
        category: selectedCategory,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });
      setProductData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product rankings');
    } finally {
      setLoading(false);
    }
  }, [sessionId, search, selectedCategory, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when search or category changes
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  if (!sessionId) {
    return <EmptyState title="No Active Sales Dataset for Product Performance" />;
  }

  const totalPages = productData ? Math.ceil(productData.total_products / pageSize) : 1;

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" title="Product Query Notice" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filters Header */}
      <Card noPadding className="p-4 sm:p-5 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or category..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter & Sort Dropdowns */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:border-emerald-500"
              >
                <option value="">All Categories</option>
                {productData?.all_categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:border-emerald-500"
              >
                <option value="net_revenue">Net Revenue</option>
                <option value="units_sold">Units Sold</option>
                <option value="product_name">Product Name</option>
                <option value="avg_unit_price">Unit Price</option>
                <option value="revenue_rank">Revenue Rank</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Product Performance Table */}
      <Card
        title="Comprehensive Product Performance"
        subtitle={`Displaying ${productData?.total_products || 0} unique products ranked by sales parameters`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('reports')}
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Export All to Excel
          </Button>
        }
        noPadding
      >
        {loading ? (
          <LoadingSpinner label="Loading product metrics..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-emerald-700"
                    onClick={() => handleSort('revenue_rank')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Rev Rank</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-emerald-700"
                    onClick={() => handleSort('product_name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Product Details</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Qty Rank</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-emerald-700"
                    onClick={() => handleSort('units_sold')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Units Sold</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-emerald-700"
                    onClick={() => handleSort('avg_unit_price')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Avg Price</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-emerald-700"
                    onClick={() => handleSort('net_revenue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Net Revenue</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Revenue Share</th>
                  {productData?.products.some((p) => p.total_profit !== null) && (
                    <th className="py-3 px-4 text-right">Gross Profit &amp; Margin</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productData?.products.map((prod) => (
                  <tr key={prod.product_name} className="hover:bg-slate-50/70 transition-colors">
                    {/* Revenue Rank */}
                    <td className="py-3.5 px-4 font-bold">
                      <span
                        className={`w-6 h-6 rounded-md inline-flex items-center justify-center text-xs ${
                          prod.revenue_rank === 1
                            ? 'bg-amber-100 text-amber-800 font-black'
                            : prod.revenue_rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : prod.revenue_rank === 3
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        #{prod.revenue_rank}
                      </span>
                    </td>

                    {/* Product & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{prod.product_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Category: <span className="text-slate-600 font-medium">{prod.category || 'General'}</span>
                      </div>
                    </td>

                    {/* Quantity Rank */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                      #{prod.quantity_rank}
                    </td>

                    {/* Units Sold */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {formatNumber(prod.units_sold)}
                    </td>

                    {/* Avg Price */}
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {formatCurrency(prod.avg_unit_price, currency, 2)}
                    </td>

                    {/* Net Revenue */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 text-sm">
                      {formatCurrency(prod.net_revenue, currency, 0)}
                    </td>

                    {/* Revenue Share with Progress Bar */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, prod.revenue_share_pct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                          {prod.revenue_share_pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Optional Profit & Margin */}
                    {prod.total_profit !== null && prod.total_profit !== undefined && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-teal-800">
                          {formatCurrency(prod.total_profit, currency, 0)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {prod.profit_margin_pct?.toFixed(1)}% margin
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(productData?.total_products || 0, (page - 1) * pageSize + 1)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(productData?.total_products || 0, page * pageSize)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{productData?.total_products || 0}</span> products
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <span className="text-xs px-2.5 py-1 font-semibold text-slate-700">
                  Page {page} of {Math.max(1, totalPages)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
