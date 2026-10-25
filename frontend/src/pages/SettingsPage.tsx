import React from 'react';
import {
  Shield,
  Database,
  Trash2,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  Calculator,
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const {
    currency,
    setCurrency,
    sessionId,
    dashboardData,
    clearSession,
    loadDemo,
    loading,
  } = useSales();

  const currencyOptions = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee (Default)' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings &amp; Methodology</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure financial display parameters, review business calculation formulas, and inspect privacy safeguards.
        </p>
      </div>

      {/* 1. Currency Display Configuration */}
      <Card
        title="Currency Display Preference"
        subtitle="Configure the active currency symbol rendered across all KPI cards, charts, and report exports"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currencyOptions.map((c) => {
              const isSelected = currency === c.code;
              return (
                <div
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900">{c.symbol}</span>
                    {isSelected && <Badge variant="emerald" size="sm">Active</Badge>}
                  </div>
                  <div className="mt-1 font-semibold text-xs text-slate-800">{c.code}</div>
                  <div className="text-[11px] text-slate-500">{c.name}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Currency Notice: </span>
              Changing the currency selection updates formatting and symbols across dashboards, Excel tables, and PDF documents.
              It does <b>not</b> perform dynamic foreign exchange conversion or recalculate historical exchange rates.
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Dataset Session Management */}
      <Card
        title="Dataset Session Management"
        subtitle="Manage the current active in-memory session and cached analytics"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Session ID:</span>
              <span className="font-mono text-slate-800 font-semibold">{sessionId || 'None (No active session)'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Current Dataset:</span>
              <span className="font-medium text-slate-900">{dashboardData?.dataset_info?.filename || 'No data loaded'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Valid Records:</span>
              <span className="font-semibold text-emerald-700">
                {dashboardData?.dataset_info?.total_records?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => window.open(api.getDemoDownloadUrl(), '_blank')}
            >
              Download Demo CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              loading={loading}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={loadDemo}
            >
              Reload Synthetic Demo Dataset
            </Button>

            {sessionId && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (window.confirm('Are you sure you want to unload the active dataset and clear session cache?')) {
                    clearSession();
                  }
                }}
              >
                Clear Current Dataset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Business Logic & Accounting Methodology */}
      <Card
        title="Business Calculations &amp; Methodology"
        subtitle="Explicit definitions and accounting principles implemented by the Python analytics engine"
      >
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              1. Sales Revenue Calculations
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li><b>Gross Sales:</b> Calculated strictly as <code>Quantity × Unit Price</code> for each line item.</li>
              <li><b>Customer Discounts:</b> Supported as either a percentage (0&ndash;100%) or monetary amount.</li>
              <li><b>Net Sales Revenue:</b> <code>Gross Sales − Discount Amount</code>. Negative net sales are clamped to 0.00.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              2. Unique Orders vs. Transaction Line Items
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>When an <b>Order ID</b> column is mapped and populated, <b>Order Count</b> represents distinct order identifiers. Multiple items in the same cart (same Order ID) represent line items of a single order.</li>
              <li>If <b>Order ID</b> is unmapped or absent, each valid row is treated as an individual sales transaction.</li>
              <li><b>Average Order Value (AOV):</b> <code>Net Sales Revenue ÷ Order Count</code>.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              3. Cost, Profit &amp; Margin Assumptions
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li><b>Revenue does NOT equal profit.</b> If a Unit Cost column is provided, Total Cost = <code>Quantity × Unit Cost</code>.</li>
              <li><b>Gross Profit:</b> <code>Net Sales Revenue − Total Cost</code>.</li>
              <li><b>Gross Margin:</b> <code>(Gross Profit ÷ Net Sales Revenue) × 100%</code>.</li>
              <li>If no cost column is mapped, profit and margin metrics are omitted to prevent misleading assumptions.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              4. Date Interpretation
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Dates are parsed into standard ISO 8601 date-only format (<code>YYYY-MM-DD</code>).</li>
              <li>Dates are evaluated without applying timezone conversions to preserve billing day consistency.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 4. Security & Privacy Safeguards */}
      <Card
        title="Security &amp; Data Privacy Architecture"
        subtitle="Safeguards ensuring zero data leakage, safe exports, and clean memory management"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
              <Lock className="w-4 h-4 text-emerald-600" />
              Formula Injection Sanitization
            </div>
            <p className="text-slate-600 leading-relaxed">
              Spreadsheet exports sanitize values starting with <code>=</code>, <code>+</code>, <code>-</code>, <code>@</code> to protect against CSV / Excel Formula Injection vulnerabilities when opened in desktop spreadsheet software.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
              <Shield className="w-4 h-4 text-emerald-600" />
              Isolated Session Storage
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every upload is stored under a cryptographically random UUID session token. Data is isolated in memory with automated 2-hour TTL expiration and is never shared between browser sessions.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
              <Database className="w-4 h-4 text-emerald-600" />
              Zero Permanent PII Retention
            </div>
            <p className="text-slate-600 leading-relaxed">
              This application does not log or persist customer personal identifiers in external databases. File uploads are sanitized and temporary memory is cleared upon session deletion or server restart.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Strict Input &amp; Size Validation
            </div>
            <p className="text-slate-600 leading-relaxed">
              File uploads are capped at 15 MB with MIME-type and extension verification. Filenames are sanitized to prevent directory traversal attacks.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
