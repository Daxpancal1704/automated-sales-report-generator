import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { DashboardData } from '../types';
import { api } from '../services/api';

export type PageTab = 'dashboard' | 'upload' | 'analytics' | 'products' | 'reports' | 'settings';

interface SalesContextType {
  sessionId: string | null;
  currency: string;
  activeTab: PageTab;
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  setActiveTab: (tab: PageTab) => void;
  setCurrency: (currency: string) => void;
  setSessionId: (sessionId: string) => void;
  loadDemo: () => Promise<void>;
  clearSession: () => void;
  refreshDashboard: () => Promise<void>;
  setError: (err: string | null) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    return localStorage.getItem('sales_report_session_id');
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('sales_report_currency') || 'INR';
  });

  const [activeTab, setActiveTab] = useState<PageTab>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('sales_report_currency', newCurrency);
  };

  const setSessionId = (newSessionId: string) => {
    setSessionIdState(newSessionId);
    localStorage.setItem('sales_report_session_id', newSessionId);
  };

  const clearSession = () => {
    setSessionIdState(null);
    setDashboardData(null);
    localStorage.removeItem('sales_report_session_id');
  };

  const refreshDashboard = useCallback(async () => {
    if (!sessionId) {
      setDashboardData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard(sessionId, currency);
      setDashboardData(data);
      if (!data.has_data) {
        // If session was cleared on server or expired
        setSessionIdState(null);
        localStorage.removeItem('sales_report_session_id');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [sessionId, currency]);

  const loadDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const demoRes = await api.loadDemoData(currency);
      setSessionId(demoRes.session_id);
      const dash = await api.getDashboard(demoRes.session_id, currency);
      setDashboardData(dash);
      setActiveTab('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to load demo data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      refreshDashboard();
    }
  }, [sessionId, currency, refreshDashboard]);

  return (
    <SalesContext.Provider
      value={{
        sessionId,
        currency,
        activeTab,
        dashboardData,
        loading,
        error,
        setActiveTab,
        setCurrency,
        setSessionId,
        loadDemo,
        clearSession,
        refreshDashboard,
        setError,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
