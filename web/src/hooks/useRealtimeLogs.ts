import { useState, useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase';

export interface EnrichedLog {
  id: string;
  item_id: string;
  employee_id: string;
  scanned_at: string;
  action: 'entrada' | 'saida';
  quantity: number;
  synced: boolean;
  employee_name: string;
  employee_sigla: string | null;
  employee_number: string | null;
  employee_regional: string | null;
  item_name: string;
  item_category: string;
  item_quantity: number;
  item_risk_level: 'low' | 'medium' | 'high' | 'critical';
  item_expiry_date: string | null;
}

interface UseRealtimeLogsOptions {
  drugstoreNumber?: string;
  regional?: string;
  limit?: number;
}

interface RealtimeLogsState {
  logs: EnrichedLog[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const fetchLogs = async (opts: UseRealtimeLogsOptions): Promise<EnrichedLog[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scan_logs')
    .select(`
      id, item_id, employee_id, scanned_at, action, quantity, synced,
      profiles!employee_id ( name, sigla, number, regional ),
      items!item_id ( name, category, quantity, risk_level, expiry_date )
    `)
    .order('scanned_at', { ascending: false })
    .limit(opts.limit ?? 300);

  if (error || !data) return [];

  return (data as unknown[]).map((raw) => {
    const row = raw as {
      id: string; item_id: string; employee_id: string; scanned_at: string;
      action: 'entrada' | 'saida'; quantity: number; synced: boolean;
      profiles: { name: string; sigla: string | null; number: string | null; regional: string | null } | null;
      items: { name: string; category: string; quantity: number; risk_level: string; expiry_date: string | null } | null;
    };
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const it = Array.isArray(row.items) ? row.items[0] : row.items;
    return {
      id: row.id, item_id: row.item_id, employee_id: row.employee_id,
      scanned_at: row.scanned_at, action: row.action, quantity: row.quantity, synced: row.synced,
      employee_name: p?.name ?? 'Desconhecido',
      employee_sigla: p?.sigla ?? null,
      employee_number: p?.number ?? null,
      employee_regional: p?.regional ?? null,
      item_name: it?.name ?? 'Desconhecido',
      item_category: it?.category ?? '',
      item_quantity: it?.quantity ?? 0,
      item_risk_level: (it?.risk_level ?? 'low') as EnrichedLog['item_risk_level'],
      item_expiry_date: it?.expiry_date ?? null,
    };
  });
};

const useRealtimeLogs = (options: UseRealtimeLogsOptions = {}): RealtimeLogsState => {
  const [logs, setLogs] = useState<EnrichedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLogs(options);
      setLogs(data);
    } catch (err: unknown) {
      console.error('useRealtimeLogs:', err);
    }
  }, [options.drugstoreNumber, options.regional, options.limit]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const supabase = createClient();
    const ch = supabase.channel(`scan_logs_rt_${Date.now()}_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scan_logs' },
        (_: RealtimePostgresChangesPayload<Record<string, unknown>>) => { refresh(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  return { logs, loading, refresh };
};

export default useRealtimeLogs;
