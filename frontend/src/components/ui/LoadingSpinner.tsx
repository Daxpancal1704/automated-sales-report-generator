import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Processing sales data...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-3 border-emerald-100 border-t-emerald-600 animate-spin" />
        <Loader2 className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      {label && <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">{label}</p>}
    </div>
  );
};
