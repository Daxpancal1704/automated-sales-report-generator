import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Alert } from '../ui/Alert';
import { useSales } from '../../context/SalesContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { error, setError } = useSales();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {error && (
            <div className="mb-6">
              <Alert type="error" title="Notice" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            </div>
          )}
          {children}
        </main>

        <footer className="py-6 px-8 border-t border-slate-200/70 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl w-full mx-auto">
          <div>
            <span className="font-semibold text-slate-700">Automated Sales Report Generator</span> &bull; Portfolio Production Quality
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>FastAPI &bull; React &bull; Tailwind &bull; pandas</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
