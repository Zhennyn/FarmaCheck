// Web stub — expo-sqlite is not available on web.
// Metro automatically picks this file instead of db.ts when bundling for web.

export interface LocalItem {
  id: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  expiry_date: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  synced: number;
}

export interface LocalScanLog {
  id: string;
  item_id: string;
  employee_id: string;
  scanned_at: string;
  action: 'entrada' | 'saida';
  quantity: number;
  synced: number;
}

export const initDB = async (): Promise<void> => {};
export const insertItem = async (_item: Omit<LocalItem, 'synced'>): Promise<void> => {};
export const insertScanLog = async (_log: Omit<LocalScanLog, 'synced'>): Promise<void> => {};
export const getPendingLogs = async (): Promise<LocalScanLog[]> => [];
export const markLogsAsSynced = async (_ids: string[]): Promise<void> => {};
export const getItemByBarcode = async (_barcode: string): Promise<LocalItem | null> => null;
export const getRecentLogs = async (_limit?: number): Promise<(LocalScanLog & { item_name: string; item_category: string; item_risk_level: string })[]> => [];
