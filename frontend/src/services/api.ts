import type {
  PreviewData, ColumnMapping, ValidationSummary,
  DashboardData, AnalyticsData, ProductListData
} from '../types';

const API_BASE = '/api';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

export function formatCurrency(amount: number | null | undefined, currency: string = 'INR', decimals: number = 2): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
  const sym = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  return `${sym} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return val.toLocaleString('en-US');
}

export const api = {
  async checkHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  async uploadPreview(file: File): Promise<PreviewData> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/preview`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload preview failed' }));
      throw new Error(err.detail || 'Upload preview failed');
    }
    return res.json();
  },

  async confirmUpload(sessionId: string, mapping: ColumnMapping, currency: string = 'INR'): Promise<{
    session_id: string;
    status: string;
    message: string;
    validation: ValidationSummary;
  }> {
    const res = await fetch(`${API_BASE}/upload/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, mapping, currency }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Confirmation failed' }));
      throw new Error(err.detail || 'Confirmation failed');
    }
    return res.json();
  },

  async loadDemoData(currency: string = 'INR'): Promise<{
    session_id: string;
    filename: string;
    is_demo: boolean;
    total_records: number;
    validation_summary: ValidationSummary;
  }> {
    const res = await fetch(`${API_BASE}/demo/load?currency=${encodeURIComponent(currency)}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load demo data' }));
      throw new Error(err.detail || 'Failed to load demo data');
    }
    return res.json();
  },

  async getDashboard(sessionId?: string, currency?: string): Promise<DashboardData> {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (currency) params.append('currency', currency);

    const res = await fetch(`${API_BASE}/dashboard?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch dashboard' }));
      throw new Error(err.detail || 'Failed to fetch dashboard');
    }
    return res.json();
  },

  async getAnalytics(
    sessionId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      product?: string;
      category?: string;
      grouping?: string;
      currency?: string;
    }
  ): Promise<AnalyticsData> {
    const params = new URLSearchParams({ session_id: sessionId });
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.product) params.append('product', filters.product);
    if (filters.category) params.append('category', filters.category);
    if (filters.grouping) params.append('grouping', filters.grouping);
    if (filters.currency) params.append('currency', filters.currency);

    const res = await fetch(`${API_BASE}/analytics?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch analytics' }));
      throw new Error(err.detail || 'Failed to fetch analytics');
    }
    return res.json();
  },

  async getProducts(
    sessionId: string,
    params: {
      search?: string;
      category?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ProductListData> {
    const query = new URLSearchParams({ session_id: sessionId });
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.sortBy) query.append('sort_by', params.sortBy);
    if (params.sortOrder) query.append('sort_order', params.sortOrder);
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch product list' }));
      throw new Error(err.detail || 'Failed to fetch product list');
    }
    return res.json();
  },

  getExcelReportUrl(sessionId: string, currency?: string, startDate?: string, endDate?: string): string {
    const params = new URLSearchParams({ session_id: sessionId });
    if (currency) params.append('currency', currency);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return `${API_BASE}/reports/excel?${params.toString()}`;
  },

  getPdfReportUrl(sessionId: string, currency?: string, startDate?: string, endDate?: string): string {
    const params = new URLSearchParams({ session_id: sessionId });
    if (currency) params.append('currency', currency);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return `${API_BASE}/reports/pdf?${params.toString()}`;
  },

  getCleanedCsvUrl(sessionId: string, startDate?: string, endDate?: string): string {
    const params = new URLSearchParams({ session_id: sessionId });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return `${API_BASE}/reports/csv?${params.toString()}`;
  },

  getValidationErrorsCsvUrl(sessionId: string): string {
    return `${API_BASE}/reports/validation-errors?session_id=${encodeURIComponent(sessionId)}`;
  },

  getDemoDownloadUrl(): string {
    return `${API_BASE}/demo/download`;
  },
};
