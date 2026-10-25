import React from 'react';
import { Menu, UploadCloud, RefreshCw, Trash2, Coins } from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import type { PageTab } from '../../context/SalesContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

const PAGE_METADATA: Record<PageTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Sales Dashboard',
    subtitle: 'High-level business KPIs, revenue trends, top products, and data health',
  },
  upload: {
    title: 'Upload & Map Sales Data',
    subtitle: 'Upload CSV or XLSX spreadsheets, map columns, and review validation rules',
  },
  analytics: {
    title: 'Interactive Sales Analytics',
    subtitle: 'Slice sales performance by date ranges, products, categories, and grouping',
  },
  products: {
    title: 'Product Performance & Rankings',
    subtitle: 'Comprehensive product volume, revenue share, unit price, and margin analysis',
  },
  reports: {
    title: 'Report Generation & Downloads',
    subtitle: 'Export executive-formatted Excel workbooks, PDF executive briefings, and clean CSVs',
  },
  settings: {
    title: 'Application Settings & Methodology',
    subtitle: 'Configure display currencies, review accounting assumptions, and manage storage',
  },
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { activeTab, setActiveTab, currency, setCurrency, dashboardData, clearSession, refreshDashboard, loading } = useSales();
  const pageInfo = PAGE_METADATA[activeTab] || PAGE_METADATA.dashboard;

  const currencyOptions = [
    { code: 'INR', symbol: '₹' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'JPY', symbol: '¥' },
  ];

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu button & page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              {pageInfo.title}
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5 font-normal">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions, Currency Switcher, Upload Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Pill Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600">
            <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700 hidden md:inline">Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-hidden cursor-pointer text-xs"
              title="Currency display formatting (does not apply FX conversion)"
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {dashboardData?.has_data && (
            <>
              {/* Refresh button */}
              <button
                onClick={refreshDashboard}
                disabled={loading}
                title="Refresh dashboard metrics"
                className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>

              {/* Clear dataset button */}
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to unload the current dataset?')) {
                    clearSession();
                    setActiveTab('upload');
                  }
                }}
                title="Unload dataset and start fresh"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Quick Upload CTA if not on upload tab */}
          {activeTab !== 'upload' && (
            <Button
              variant={dashboardData?.has_data ? 'secondary' : 'primary'}
              size="sm"
              icon={<UploadCloud className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('upload')}
            >
              <span className="hidden sm:inline">Upload New</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
