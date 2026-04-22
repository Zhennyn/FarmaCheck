import { useCallback, useState } from 'react';
import type { SyncResult, SyncState } from '../modules/inventory/application/services/sync.service';

type SyncService = {
  getSyncState: () => SyncState;
  syncPendingItems: (maxRetries?: number) => Promise<SyncResult>;
  markAsSynced: (id: string) => Promise<{ success: boolean; error?: string }>;
  resetSyncState: () => void;
};

export const useSync = (syncService: SyncService) => {
  const [syncState, setSyncState] = useState<SyncState>(syncService.getSyncState());

  const updateSyncState = useCallback(() => {
    setSyncState(syncService.getSyncState());
  }, [syncService]);

  const syncPendingItems = useCallback(async (maxRetries: number = 3) => {
    const result = await syncService.syncPendingItems(maxRetries);
    updateSyncState();
    return result;
  }, [syncService, updateSyncState]);

  const markAsSynced = useCallback(async (id: string) => {
    const result = await syncService.markAsSynced(id);
    updateSyncState();
    return result;
  }, [syncService, updateSyncState]);

  const resetSyncState = useCallback(() => {
    syncService.resetSyncState();
    updateSyncState();
  }, [syncService, updateSyncState]);

  return {
    syncState,
    syncPendingItems,
    markAsSynced,
    resetSyncState,
    updateSyncState
  };
};