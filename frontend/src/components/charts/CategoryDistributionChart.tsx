import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { CategoryStat } from '../../types';
import { formatCurrency } from '../../services/api';

interface CategoryDistributionChartProps {
  categories: CategoryStat[];
  currency?: string;
  height?: number;
}

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857'];

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  categories,
  currency = 'INR',
  height = 260,
}) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-slate-400">
        No category data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryStat;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{item.category_name}</p>
          <div className="flex justify-between gap-3">
            <span className="text-emerald-400">Revenue:</span>
            <span>{formatCurrency(item.net_revenue, currency, 0)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Share:</span>
            <span>{item.share_pct.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          <Pie
            data={categories}
            dataKey="net_revenue"
            nameKey="category_name"
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
          >
            {categories.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
