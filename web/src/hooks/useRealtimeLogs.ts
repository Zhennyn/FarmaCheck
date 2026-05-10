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
  drugstore_number: string | null;
  regional: string | null;
  item_name: string;
  item_category: string;
  item_quantity: number;
  item_risk_level: 'low' | 'medium' | 'high' | 'critical';
  item_expiry_date: string | null;
}

interface RealtimeLogsState {
  logs: EnrichedLog[];
  loading: boolean;
}

// BUG 3: include quantity explicitly in items join + add profile fields for BUG 6
const fetchEnrichedLogs = async (
  drugsStoreNumber?: string,
  regional?: string
): Promise<EnrichedLog[]> => {
  const supabase = createClient();

  let query = supabase
    .from('scan_logs')
    .select(`
      id,
      item_id,
      employee_id,
      scanned_at,
      action,
      quantity,
      synced,
      profiles!employee_id ( name, drugstore_number, regional ),
      items!item_id ( name, category, quantity, risk_level, expiry_date )
    `)
    .order('scanned_at', { ascending: false })
    .limit(500);

  // BUG 6: filter by drugstore_number and regional when set
  if (drugsStoreNumber) {
    query = query.eq('profiles.drugstore_number', drugsStoreNumber);
  }
  if (regional) {
    query = query.eq('profiles.regional', regional);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return (data as unknown[]).map((rawRow) => {
    const row = rawRow as {
      id: string;
      item_id: string;
      employee_id: string;
      scanned_at: string;
      action: 'entrada' | 'saida';
      quantity: number;
      synced: boolean;
      profiles:
        | { name: string; drugstore_number: string | null; regional: string | null }[]
        | { name: string; drugstore_number: string | null; regional: string | null }
        | null;
      items:
        | { name: string; category: string; quantity: number; risk_level: string; expiry_date: string | null }[]
        | { name: string; category: string; quantity: number; risk_level: string; expiry_date: string | null }
        | null;
    };

    const profileObj = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const itemObj = Array.isArray(row.items) ? row.items[0] : row.items;

    return {
      id: row.id,
      item_id: row.item_id,
      employee_id: row.employee_id,
      scanned_at: row.scanned_at,
      action: row.action,
      quantity: row.quantity,
      synced: row.synced,
      employee_name: profileObj?.name ?? 'Desconhecido',
      drugstore_number: profileObj?.drugstore_number ?? null,
      regional: profileObj?.regional ?? null,
      item_name: itemObj?.name ?? 'Desconhecido',
      item_category: itemObj?.category ?? '',
      item_quantity: itemObj?.quantity ?? 0,
      item_risk_level: (itemObj?.risk_level ?? 'low') as EnrichedLog['item_risk_level'],
      item_expiry_date: itemObj?.expiry_date ?? null,
    };
  });
};

interface UseRealtimeLogsOptions {
  drugstoreNumber?: string;
  regional?: string;
}

const useRealtimeLogs = (options: UseRealtimeLogsOptions = {}): RealtimeLogsState => {
  const [logs, setLogs] = useState<EnrichedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchEnrichedLogs(options.drugstoreNumber, options.regional);
      setLogs(data);
    } catch (error: unknown) {
      console.error('useRealtimeLogs refresh error:', error);
    }
  }, [options.drugstoreNumber, options.regional]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));

    const supabase = createClient();
    const channel = supabase
      .channel('scan_logs_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scan_logs' },
        (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { logs, loading };
};

export default useRealtimeLogs;
