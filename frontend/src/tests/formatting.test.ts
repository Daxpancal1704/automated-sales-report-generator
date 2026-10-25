import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, api } from '../services/api';

describe('Frontend Formatting and URL Helpers', () => {
  it('formats INR currency with rupee symbol correctly', () => {
    const formatted = formatCurrency(50000, 'INR', 0);
    expect(formatted).toContain('₹');
    expect(formatted).toContain('50,000');
  });

  it('formats USD currency correctly', () => {
    const formatted = formatCurrency(1234.56, 'USD', 2);
    expect(formatted).toContain('$');
    expect(formatted).toContain('1,234.56');
  });

  it('handles null and undefined currency gracefully', () => {
    expect(formatCurrency(null, 'INR')).toBe('N/A');
    expect(formatCurrency(undefined, 'USD')).toBe('N/A');
  });

  it('formats numbers with commas', () => {
    expect(formatNumber(1450000)).toBe('1,450,000');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(null)).toBe('0');
  });

  it('builds valid Excel download URL with query parameters', () => {
    const url = api.getExcelReportUrl('sess-123', 'USD', '2025-01-01', '2025-06-30');
    expect(url).toContain('/api/reports/excel');
    expect(url).toContain('session_id=sess-123');
    expect(url).toContain('currency=USD');
    expect(url).toContain('start_date=2025-01-01');
    expect(url).toContain('end_date=2025-06-30');
  });

  it('builds valid PDF download URL', () => {
    const url = api.getPdfReportUrl('sess-abc', 'INR');
    expect(url).toContain('/api/reports/pdf');
    expect(url).toContain('session_id=sess-abc');
    expect(url).toContain('currency=INR');
  });
});
