export type InventoryDatabase = {
  getAllAsync: <T = unknown>(sql: string, ...params: unknown[]) => Promise<T[]>;
  runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>;
};
