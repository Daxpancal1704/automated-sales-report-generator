import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  LineChart,
  PackageCheck,
  FileDown,
  Settings,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import type { PageTab } from '../../context/SalesContext';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, dashboardData, loadDemo, loading } = useSales();

  const navItems: { id: PageTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'upload', label: 'Upload Sales Data', icon: <UploadCloud className="w-5 h-5" /> },
    { id: 'analytics', label: 'Sales Analytics', icon: <LineChart className="w-5 h-5" /> },
    { id: 'products', label: 'Product Performance', icon: <PackageCheck className="w-5 h-5" /> },
    { id: 'reports', label: 'Export Reports', icon: <FileDown className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings & About', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleNavClick = (tab: PageTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block">ReportPulse</span>
            <span className="text-[11px] text-slate-500 font-medium block">Sales Insights Engine</span>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Dataset Status Banner */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dataset Status</span>
          {dashboardData?.has_data ? (
            <Badge variant="emerald" size="sm">Active</Badge>
          ) : (
            <Badge variant="slate" size="sm">Empty</Badge>
          )}
        </div>
        <p className="text-xs font-medium text-slate-800 truncate" title={dashboardData?.dataset_info?.filename || 'No data loaded'}>
          {dashboardData?.dataset_info?.filename || 'No dataset loaded'}
        </p>
        {dashboardData?.has_data && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            {dashboardData.dataset_info?.total_records.toLocaleString()} valid sales rows
          </p>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs border border-emerald-200/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Demo Action Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={loadDemo}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-300/80 bg-white hover:bg-emerald-50 text-emerald-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{loading ? 'Loading...' : 'Load Synthetic Demo'}</span>
        </button>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          FastAPI &amp; pandas analytics engine
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
