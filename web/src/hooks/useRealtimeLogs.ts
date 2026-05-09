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
  item_name: string;
  item_category: string;
  item_risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface RealtimeLogsState {
  logs: EnrichedLog[];
  loading: boolean;
}

const fetchEnrichedLogs = async (): Promise<EnrichedLog[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scan_logs')
    .select(`
      id, item_id, employee_id, scanned_at, action, quantity, synced,
      profiles!employee_id ( name ),
      items!item_id ( name, category, risk_level )
    `)
    .order('scanned_at', { ascending: false })
    .limit(200);

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
      profiles: { name: string }[] | { name: string } | null;
      items: { name: string; category: string; risk_level: string }[] | { name: string; category: string; risk_level: string } | null;
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
      item_name: itemObj?.name ?? 'Desconhecido',
      item_category: itemObj?.category ?? '',
      item_risk_level: (itemObj?.risk_level ?? 'low') as EnrichedLog['item_risk_level'],
    };
  });
};

const useRealtimeLogs = (): RealtimeLogsState => {
  const [logs, setLogs] = useState<EnrichedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchEnrichedLogs();
      setLogs(data);
    } catch (error: unknown) {
      console.error('useRealtimeLogs refresh error:', error);
    }
  }, []);

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
