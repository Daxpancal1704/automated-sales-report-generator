import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { api, formatNumber } from '../services/api';
import type { PreviewData, ColumnMapping, ValidationSummary } from '../types';

export const UploadPage: React.FC = () => {
  const { setSessionId, refreshDashboard, setActiveTab, currency, loadDemo } = useSales();

  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Column mapping form state
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    product: '',
    quantity: '',
    unit_price: '',
    order_id: '',
    discount: '',
    discount_type: 'percent',
    cost: '',
    category: '',
  });

  // Validation report after confirmation
  const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null);
  const [confirmedSessionId, setConfirmedSessionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.csv' && ext !== '.xlsx' && ext !== '.xls') {
      setError('Invalid file format. Please upload a .csv or .xlsx spreadsheet.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB limit. Please upload a smaller file.');
      return;
    }

    setError(null);
    setValidationResult(null);
    setLoading(true);

    try {
      const preview = await api.uploadPreview(file);
      setPreviewData(preview);
      // Pre-populate mapping from detected suggestions
      setMapping({
        date: preview.suggested_mapping.date || '',
        product: preview.suggested_mapping.product || '',
        quantity: preview.suggested_mapping.quantity || '',
        unit_price: preview.suggested_mapping.unit_price || '',
        order_id: preview.suggested_mapping.order_id || '',
        discount: preview.suggested_mapping.discount || '',
        discount_type: 'percent',
        cost: preview.suggested_mapping.cost || '',
        category: preview.suggested_mapping.category || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to inspect uploaded file.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMapping = async () => {
    if (!previewData) return;

    if (!mapping.date || !mapping.product || !mapping.quantity || !mapping.unit_price) {
      setError('Please map all required fields: Date, Product, Quantity, and Unit Price.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.confirmUpload(previewData.session_id, mapping, currency);
      setValidationResult(res.validation);
      setConfirmedSessionId(res.session_id);
      setSessionId(res.session_id);
      await refreshDashboard();
    } catch (err: any) {
      setError(err.message || 'Validation failed. Please inspect your column mapping.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewData(null);
    setValidationResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Data Ingestion &amp; Validation</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload raw sales records in CSV or Excel format. Our parsing engine checks data types, flags anomalies, and standardizes transactions.
        </p>
      </div>

      {error && (
        <Alert type="error" title="Ingestion Notice" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 1: Upload Zone (when no preview loaded) */}
      {!previewData && !validationResult && (
        <div className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 md:p-14 text-center transition-all duration-200 cursor-pointer ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 shadow-md scale-[1.005]'
                : 'border-slate-300 hover:border-emerald-600/70 bg-white hover:bg-slate-50/50 shadow-2xs'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-2xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Drag &amp; drop your sales spreadsheet here
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
              Supports CSV, Excel (.xlsx, .xls) files up to 15 MB.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Local File
              </Button>
            </div>
          </div>

          {/* Quick Demo Dataset Banner */}
          <Card className="bg-gradient-to-r from-emerald-50/60 to-slate-50 border-emerald-200/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Don't have a dataset ready?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Test the complete workflow with our synthetic 1,470-row 12-month multi-item sales dataset.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(api.getDemoDownloadUrl(), '_blank')}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Demo CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={loadDemo}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Instant Demo Load
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <LoadingSpinner label="Parsing spreadsheet and verifying data types..." />
      )}

      {/* Step 2: Column Mapping & Data Preview (when file is uploaded) */}
      {previewData && !validationResult && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{previewData.filename}</h4>
                <p className="text-xs text-slate-500">
                  {formatNumber(previewData.total_raw_rows)} raw rows detected &bull;{' '}
                  {(previewData.file_size_bytes / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Upload Different File
            </Button>
          </div>

          {/* Interactive Column Mapping Card */}
          <Card
            title="Configure Column Mapping"
            subtitle="Verify or map standard sales attributes to columns found in your file"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Required: Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Sales Date *</span>
                  <Badge variant="emerald" size="sm">Required</Badge>
                </label>
                <select
                  value={mapping.date}
                  onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Select Date Column --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.date === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Interpreted in date-only format (YYYY-MM-DD).</p>
              </div>

              {/* Required: Product */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Product Name / Title *</span>
                  <Badge variant="emerald" size="sm">Required</Badge>
                </label>
                <select
                  value={mapping.product}
                  onChange={(e) => setMapping({ ...mapping, product: e.target.value })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Select Product Column --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.product === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Item name or SKU identifier.</p>
              </div>

              {/* Required: Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Units Sold / Quantity *</span>
                  <Badge variant="emerald" size="sm">Required</Badge>
                </label>
                <select
                  value={mapping.quantity}
                  onChange={(e) => setMapping({ ...mapping, quantity: e.target.value })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Select Quantity Column --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.quantity === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Must be positive numeric values (&gt; 0).</p>
              </div>

              {/* Required: Unit Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Unit Selling Price *</span>
                  <Badge variant="emerald" size="sm">Required</Badge>
                </label>
                <select
                  value={mapping.unit_price}
                  onChange={(e) => setMapping({ ...mapping, unit_price: e.target.value })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Select Unit Price Column --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.unit_price === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Gross sales = Quantity × Unit Price.</p>
              </div>

              {/* Optional: Order ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Order Identifier</span>
                  <Badge variant="slate" size="sm">Optional</Badge>
                </label>
                <select
                  value={mapping.order_id || ''}
                  onChange={(e) => setMapping({ ...mapping, order_id: e.target.value || undefined })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- None (Treat each row as a separate transaction) --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.order_id === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Used to count unique orders when multi-item baskets exist.</p>
              </div>

              {/* Optional: Discount & Discount Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Discount Column</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Type:</span>
                    <select
                      value={mapping.discount_type || 'percent'}
                      onChange={(e) => setMapping({ ...mapping, discount_type: e.target.value as any })}
                      className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50"
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="amount">Amount ($/₹)</option>
                    </select>
                    <Badge variant="slate" size="sm">Optional</Badge>
                  </div>
                </label>
                <select
                  value={mapping.discount || ''}
                  onChange={(e) => setMapping({ ...mapping, discount: e.target.value || undefined })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- None (No discounts applied) --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.discount === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Net Sales = Gross Sales minus applied discount.</p>
              </div>

              {/* Optional: Unit Cost */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Unit Cost / COGS</span>
                  <Badge variant="slate" size="sm">Optional</Badge>
                </label>
                <select
                  value={mapping.cost || ''}
                  onChange={(e) => setMapping({ ...mapping, cost: e.target.value || undefined })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- None (Do not calculate profit) --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.cost === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Enables gross profit and margin calculations.</p>
              </div>

              {/* Optional: Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Product Category</span>
                  <Badge variant="slate" size="sm">Optional</Badge>
                </label>
                <select
                  value={mapping.category || ''}
                  onChange={(e) => setMapping({ ...mapping, category: e.target.value || undefined })}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- None (Default: 'General') --</option>
                  {previewData.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {previewData.suggested_mapping.category === col ? '(Suggested)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Used for segment breakdowns in analytics.</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                Raw data will never be silently altered or modified.
              </span>

              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmMapping}
                loading={loading}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Mapping &amp; Validate Data
              </Button>
            </div>
          </Card>

          {/* Raw Data Preview Table */}
          <Card
            title="Sample Records Preview"
            subtitle={`Showing first ${previewData.sample_rows.length} rows of uploaded file`}
            noPadding
          >
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    {previewData.columns.map((c) => (
                      <th key={c} className="py-2.5 px-3 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.sample_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      {previewData.columns.map((c) => (
                        <td key={c} className="py-2 px-3 text-slate-700 whitespace-nowrap">
                          {String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Step 3: Post-Validation Results Report */}
      {validationResult && confirmedSessionId && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-emerald-200 bg-emerald-50/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dataset Successfully Ingested &amp; Validated
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Your sales data is fully processed and ready for interactive dashboards, time-series forecasting, and report generation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setActiveTab('dashboard')}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Accepted Valid Rows
              </span>
              <p className="text-3xl font-bold text-emerald-700 mt-2">
                {formatNumber(validationResult.accepted_rows)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {((validationResult.accepted_rows / validationResult.total_rows) * 100).toFixed(1)}% of total rows
              </span>
            </Card>

            <Card className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rejected Erroneous Rows
              </span>
              <p className={`text-3xl font-bold mt-2 ${validationResult.rejected_rows > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatNumber(validationResult.rejected_rows)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Quarantined from metrics
              </span>
            </Card>

            <Card className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quality Warnings
              </span>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {formatNumber(validationResult.warning_count)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Non-fatal anomalies flagged
              </span>
            </Card>
          </div>

          {/* Rejection Reasons Breakdown & Download Link */}
          {validationResult.rejected_rows > 0 && (
            <Card
              title="Data Quality Audit &amp; Quarantine Log"
              subtitle="Detailed breakdown of rows excluded due to data integrity rules"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(api.getValidationErrorsCsvUrl(confirmedSessionId), '_blank')}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Audit Report (.csv)
                </Button>
              }
              noPadding
            >
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Rejection Summary by Rule:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(validationResult.rejection_reasons).map(([reason, count]) => (
                    <div key={reason} className="flex justify-between p-2 rounded bg-white border border-slate-200">
                      <span className="text-slate-700 font-medium">{reason}:</span>
                      <span className="font-bold text-rose-600">{count} row(s)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Rejected Rows */}
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Identifier</th>
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResult.sample_rejected.map((issue, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/30">
                        <td className="py-2 px-3 font-mono text-slate-500">{issue.row_index}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{issue.row_identifier || '—'}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{issue.field}</td>
                        <td className="py-2 px-3 text-rose-600 font-medium">{issue.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Warnings List (if any) */}
          {validationResult.warnings.length > 0 && (
            <Card title="Data Quality Insights &amp; Warnings" noPadding>
              <div className="p-4 space-y-2">
                {validationResult.warnings.map((warn, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="secondary" size="md" onClick={handleReset}>
              Upload Another Dataset
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setActiveTab('analytics')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Analytics
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setActiveTab('dashboard')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Open Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
