import * as SQLite from 'expo-sqlite';

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

let db: SQLite.SQLiteDatabase | null = null;

const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('farmacheck.db');
  }
  return db;
};

export const initDB = async (): Promise<void> => {
  const database = getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      barcode TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      expiry_date TEXT,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('low','medium','high','critical')),
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS scan_logs (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      scanned_at TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('entrada','saida')),
      quantity INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE INDEX IF NOT EXISTS idx_scan_logs_synced ON scan_logs(synced);
    CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
  `);
};

export const insertItem = async (item: Omit<LocalItem, 'synced'>): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    `INSERT OR IGNORE INTO items (id, barcode, name, category, quantity, expiry_date, risk_level, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [item.id, item.barcode, item.name, item.category, item.quantity, item.expiry_date ?? null, item.risk_level, item.created_at]
  );
};

export const insertScanLog = async (log: Omit<LocalScanLog, 'synced'>): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO scan_logs (id, item_id, employee_id, scanned_at, action, quantity, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [log.id, log.item_id, log.employee_id, log.scanned_at, log.action, log.quantity]
  );
};

export const getPendingLogs = async (): Promise<LocalScanLog[]> => {
  const database = getDb();
  return database.getAllAsync<LocalScanLog>(
    `SELECT * FROM scan_logs WHERE synced = 0 ORDER BY scanned_at ASC`
  );
};

export const markLogsAsSynced = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const database = getDb();
  const placeholders = ids.map(() => '?').join(',');
  await database.runAsync(
    `UPDATE scan_logs SET synced = 1 WHERE id IN (${placeholders})`,
    ids
  );
};

export const getItemByBarcode = async (barcode: string): Promise<LocalItem | null> => {
  const database = getDb();
  const row = await database.getFirstAsync<LocalItem>(
    `SELECT * FROM items WHERE barcode = ?`,
    [barcode]
  );
  return row ?? null;
};

export const getRecentLogs = async (limit = 50): Promise<(LocalScanLog & { item_name: string; item_category: string; item_risk_level: string })[]> => {
  const database = getDb();
  return database.getAllAsync<LocalScanLog & { item_name: string; item_category: string; item_risk_level: string }>(
    `SELECT sl.*, i.name as item_name, i.category as item_category, i.risk_level as item_risk_level
     FROM scan_logs sl
     LEFT JOIN items i ON i.id = sl.item_id
     ORDER BY sl.scanned_at DESC
     LIMIT ?`,
    [limit]
  );
};
