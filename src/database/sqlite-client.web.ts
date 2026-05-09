// Web stub — expo-sqlite is not available on web.
// Metro automatically picks this file instead of sqlite-client.ts when bundling for web.

export type SqliteDatabase = Record<string, unknown>;

export const openAppDatabase = async (): Promise<SqliteDatabase> => ({});
export const closeAppDatabase = async (): Promise<void> => {};
export const withDatabase = async <T>(_fn: (db: SqliteDatabase) => Promise<T>): Promise<T> => {
  throw new Error('SQLite is not available on web.');
};
