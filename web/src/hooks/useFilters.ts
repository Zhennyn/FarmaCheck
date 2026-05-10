import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Filters {
  regional: string;
  number: string;
  category: string;
  risk_level: string;
  action: string;
  period: 'today' | '7d' | '30d' | 'custom';
  dateFrom: string;
  dateTo: string;
  employeeId: string;
  searchQuery: string;
}

const DEFAULT_FILTERS: Filters = {
  regional: '',
  number: '',
  category: '',
  risk_level: '',
  action: '',
  period: '7d',
  dateFrom: '',
  dateTo: '',
  employeeId: '',
  searchQuery: '',
};

interface UseFiltersReturn {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  applyToQuery: <T>(
    query: ReturnType<SupabaseClient['from']>,
    opts?: { dateColumn?: string; employeeColumn?: string }
  ) => ReturnType<SupabaseClient['from']>;
}

const periodToDate = (period: Filters['period']): Date => {
  const d = new Date();
  if (period === 'today') { d.setHours(0, 0, 0, 0); return d; }
  if (period === '7d') { d.setDate(d.getDate() - 7); return d; }
  if (period === '30d') { d.setDate(d.getDate() - 30); return d; }
  return d;
};

const useFilters = (initial: Partial<Filters> = {}): UseFiltersReturn => {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, ...initial });

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => { setFilters({ ...DEFAULT_FILTERS, ...initial }); }, []);

  const applyToQuery = useCallback(<T>(
    query: ReturnType<SupabaseClient['from']>,
    opts: { dateColumn?: string; employeeColumn?: string } = {}
  ): ReturnType<SupabaseClient['from']> => {
    const dc = opts.dateColumn ?? 'scanned_at';
    const ec = opts.employeeColumn ?? 'employee_id';

    if (filters.period !== 'custom') {
      query = (query as unknown as { gte: (col: string, val: string) => typeof query }).gte(dc, periodToDate(filters.period).toISOString()) as unknown as typeof query;
    } else {
      if (filters.dateFrom) query = (query as unknown as { gte: (col: string, val: string) => typeof query }).gte(dc, filters.dateFrom) as unknown as typeof query;
      if (filters.dateTo) query = (query as unknown as { lte: (col: string, val: string) => typeof query }).lte(dc, filters.dateTo + 'T23:59:59') as unknown as typeof query;
    }
    if (filters.employeeId) query = (query as unknown as { eq: (col: string, val: string) => typeof query }).eq(ec, filters.employeeId) as unknown as typeof query;
    if (filters.action) query = (query as unknown as { eq: (col: string, val: string) => typeof query }).eq('action', filters.action) as unknown as typeof query;

    return query;
  }, [filters]);

  return { filters, setFilter, resetFilters, applyToQuery };
};

export default useFilters;
