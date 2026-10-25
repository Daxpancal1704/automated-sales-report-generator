import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ProductStat } from '../../types';
import { formatCurrency, formatNumber } from '../../services/api';

interface TopProductsChartProps {
  products: ProductStat[];
  currency?: string;
  height?: number;
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({
  products,
  currency = 'INR',
  height = 300,
}) => {
  if (!products || products.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No product comparison data available
      </div>
    );
  }

  // Top 6 products for clean display
  const chartData = products.slice(0, 6).map((p) => ({
    name: p.product_name.length > 16 ? p.product_name.slice(0, 16) + '...' : p.product_name,
    fullName: p.product_name,
    net_revenue: p.net_revenue,
    units_sold: p.units_sold,
    share: p.revenue_share_pct,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700 max-w-xs">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{data.fullName}</p>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-400">Net Revenue:</span>
            <span className="font-semibold">{formatCurrency(data.net_revenue, currency, 0)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Units Sold:</span>
            <span>{formatNumber(data.units_sold)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Revenue Share:</span>
            <span>{data.share.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="net_revenue" fill="#059669" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
