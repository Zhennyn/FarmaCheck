import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { createClient } from '@/src/lib/supabase';
import { getPendingLogs, markLogsAsSynced } from '@/src/database/db';

const MAX_RETRIES = 3;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const syncWithBackoff = async (attempt = 0): Promise<void> => {
  try {
    const logs = await getPendingLogs();
    if (logs.length === 0) return;

    const supabase = createClient();
    const { error } = await supabase.from('scan_logs').upsert(
      logs.map(({ synced: _synced, ...log }) => ({ ...log, synced: true })),
      { onConflict: 'id' }
    );

    if (error) throw error;

    await markLogsAsSynced(logs.map((l) => l.id));
  } catch (error: unknown) {
    if (attempt < MAX_RETRIES - 1) {
      await delay(Math.pow(2, attempt) * 1000);
      await syncWithBackoff(attempt + 1);
    } else {
      console.error('Sync failed after max retries:', error);
    }
  }
};

export const syncPendingLogs = async (): Promise<void> => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;
  await syncWithBackoff();
};

export const startAutoSync = (): (() => void) => {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected) {
      syncWithBackoff().catch((err: unknown) => {
        console.error('Auto-sync error:', err);
      });
    }
  });

  return unsubscribe;
};
