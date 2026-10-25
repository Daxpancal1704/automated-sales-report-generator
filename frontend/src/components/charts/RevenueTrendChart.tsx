import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { MonthlyTrend } from '../../types';
import { formatCurrency, formatNumber } from '../../services/api';

interface RevenueTrendChartProps {
  data: MonthlyTrend[];
  currency?: string;
  height?: number;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
  currency = 'INR',
  height = 300,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No trend data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as MonthlyTrend;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-400">Net Revenue:</span>
            <span className="font-semibold">{formatCurrency(item.net_revenue, currency, 0)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Gross Sales:</span>
            <span>{formatCurrency(item.gross_revenue, currency, 0)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Orders:</span>
            <span>{formatNumber(item.order_count)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Units Sold:</span>
            <span>{formatNumber(item.units_sold)}</span>
          </div>
          {item.profit !== null && item.profit !== undefined && (
            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
              <span className="text-teal-400">Gross Profit:</span>
              <span className="font-semibold">{formatCurrency(item.profit, currency, 0)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
              return val;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="net_revenue"
            stroke="#059669"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#emeraldGradient)"
            dot={{ r: 3, fill: '#059669', strokeWidth: 1, stroke: '#ffffff' }}
            activeDot={{ r: 5, fill: '#047857' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
