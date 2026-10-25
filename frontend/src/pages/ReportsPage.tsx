import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const { sessionId, currency, dashboardData } = useSales();

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  if (!sessionId || !dashboardData?.has_data) {
    return <EmptyState title="No Active Sales Dataset for Report Generation" />;
  }

  const handleDownloadExcel = () => {
    const url = api.getExcelReportUrl(
      sessionId,
      currency,
      filterStartDate || undefined,
      filterEndDate || undefined
    );
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    const url = api.getPdfReportUrl(
      sessionId,
      currency,
      filterStartDate || undefined,
      filterEndDate || undefined
    );
    window.open(url, '_blank');
  };

  const handleDownloadCsv = () => {
    const url = api.getCleanedCsvUrl(
      sessionId,
      filterStartDate || undefined,
      filterEndDate || undefined
    );
    window.open(url, '_blank');
  };

  const handleDownloadAuditCsv = () => {
    const url = api.getValidationErrorsCsvUrl(sessionId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Report Generation Center</h2>
        <p className="text-sm text-slate-500 mt-1">
          Generate client-ready spreadsheets, executive briefings, and cleaned data extracts.
        </p>
      </div>

      {/* Date Filtering Bar */}
      <Card noPadding className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Optional Export Date Filter:
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:border-emerald-500"
              />
            </div>
            {(filterStartDate || filterEndDate) && (
              <button
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Multi-Sheet Excel Workbook */}
        <Card className="flex flex-col justify-between border-slate-200 hover:border-emerald-400 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <Badge variant="emerald" size="md">
                .XLSX Format
              </Badge>
            </div>

            <h3 className="text-base font-bold text-slate-900">Multi-Sheet Executive Excel Workbook</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Full-featured workbook generated using <code>openpyxl</code> with native charts, frozen headers, and auto-filters.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Executive Summary:</b> KPI cards and metadata</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Monthly Performance:</b> Trends, totals row &amp; native chart</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Product Performance:</b> Revenue and quantity rankings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Cleaned Sales Data:</b> Standardized line items with auto-filter</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Data Quality Audit:</b> Validation rules audit sheet</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownloadExcel}
            >
              Download Excel Workbook (.xlsx)
            </Button>
          </div>
        </Card>

        {/* 2. Executive PDF Report */}
        <Card className="flex flex-col justify-between border-slate-200 hover:border-emerald-400 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <Badge variant="rose" size="md">
                .PDF Format
              </Badge>
            </div>

            <h3 className="text-base font-bold text-slate-900">Executive PDF Briefing Report</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Publication-grade PDF generated using ReportLab with clean typography, vector charts, and business disclosures.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Executive KPI Summary:</b> 2x4 styled metric dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Vector Trend Chart:</b> Native crisp vector drawing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Monthly Sales Table:</b> Alternating rows with currency format</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Top Products Breakdown:</b> Leading sales contributors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><b>Methodology &amp; Notes:</b> Clear accounting assumptions</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              size="md"
              className="w-full text-slate-800"
              icon={<Download className="w-4 h-4 text-rose-600" />}
              onClick={handleDownloadPdf}
            >
              Download PDF Report (.pdf)
            </Button>
          </div>
        </Card>

        {/* 3. Cleaned CSV Dataset */}
        <Card className="flex flex-col justify-between border-slate-200 hover:border-emerald-400 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <FileCode className="w-6 h-6" />
              </div>
              <Badge variant="blue" size="md">
                .CSV Format
              </Badge>
            </div>

            <h3 className="text-base font-bold text-slate-900">Standardized Cleaned Dataset</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Export all validated sales transactions with calculated Net Sales, discounts, and formula injection sanitization.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standardized ISO 8601 Date format (YYYY-MM-DD)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sanitized formulas (blocks CSV injection attacks)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pre-computed Gross, Discount, and Net Sales</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownloadCsv}
            >
              Download Cleaned CSV (.csv)
            </Button>
          </div>
        </Card>

        {/* 4. Data Quality Audit CSV */}
        <Card className="flex flex-col justify-between border-slate-200 hover:border-emerald-400 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <Badge variant="amber" size="md">
                Audit Log
              </Badge>
            </div>

            <h3 className="text-base font-bold text-slate-900">Validation Rejection Audit Report</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Export the complete audit trail of quarantined records and exact rejection reasons for data cleansing.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Row numbers and order identifiers of failed rows</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Specific validation rule broken (e.g. negative price, unparseable date)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Original raw record preserved for source reconciliation</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={<Download className="w-4 h-4 text-amber-600" />}
              onClick={handleDownloadAuditCsv}
            >
              Download Rejection Audit (.csv)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
