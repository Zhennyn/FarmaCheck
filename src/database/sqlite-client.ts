import * as SQLite from 'expo-sqlite';

export type SqliteDatabase = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;

let dbPromise: Promise<SqliteDatabase> | null = null;

export const openAppDatabase = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('farmacia.db');
  }

  return dbPromise;
};

export const closeAppDatabase = async () => {
  if (!dbPromise) return;

  const db = await dbPromise;
  await db.closeAsync();
  dbPromise = null;
};

export const withDatabase = async <T>(fn: (db: SqliteDatabase) => Promise<T>) => {
  const db = await openAppDatabase();
  return fn(db);
};
