import React from 'react';
import { BarChart3, UploadCloud, Sparkles, FileSpreadsheet } from 'lucide-react';
import { Button } from './Button';
import { useSales } from '../../context/SalesContext';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showActions?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Sales Data Ingested Yet',
  description = 'Upload your CSV or Excel sales records, or instantly load our realistic 12-month synthetic demo dataset to explore interactive dashboards, analytics, and downloadable reports.',
  showActions = true,
}) => {
  const { setActiveTab, loadDemo, loading } = useSales();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-10 md:p-14 text-center max-w-2xl mx-auto my-8 shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-xs">
        <BarChart3 className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">{description}</p>

      {showActions && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={<UploadCloud className="w-4 h-4" />}
            onClick={() => setActiveTab('upload')}
          >
            Upload Sales File (.csv / .xlsx)
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
            loading={loading}
            onClick={loadDemo}
          >
            Load Synthetic Demo Dataset
          </Button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          Supports CSV & Excel (XLSX)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Zero server tracking / Safe session isolation
        </span>
      </div>
    </div>
  );
};
