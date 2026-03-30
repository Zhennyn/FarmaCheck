import type { SqliteDatabase } from './sqlite-client';

export const SQLITE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_produtos_validade ON produtos(validade)',
  'CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo)',
  'CREATE INDEX IF NOT EXISTS idx_produtos_colaborador ON produtos(colaborador)',
  'CREATE INDEX IF NOT EXISTS idx_produtos_status_conferencia ON produtos(status_conferencia)',
  'CREATE INDEX IF NOT EXISTS idx_historico_data_evento ON historico_produtos(data_evento)',
] as const;

export const ensureColumn = async (db: SqliteDatabase, table: string, definition: string) => {
  const columnName = definition.trim().split(/\s+/)[0];
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);

  if (columns.some((column) => column.name === columnName)) return;
  await db.runAsync(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
};

export const createBaseSchema = async (db: SqliteDatabase) => {
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY NOT NULL,
      nome TEXT,
      codigo TEXT,
      apresentacao TEXT,
      embalagem TEXT,
      unidade_medida TEXT,
      quantidade_medida REAL DEFAULT 0,
      validade TEXT,
      validades_adicionais TEXT,
      custo REAL,
      qtd INTEGER,
      colaborador TEXT,
      lote TEXT,
      observacao TEXT,
      status_conferencia TEXT DEFAULT 'pendente'
    )`
  );

  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS ean_cache (
      codigo TEXT PRIMARY KEY NOT NULL,
      nome TEXT NOT NULL,
      apresentacao TEXT,
      embalagem TEXT,
      custo REAL DEFAULT 0,
      unidade_medida TEXT,
      quantidade_medida REAL DEFAULT 0,
      referencia TEXT,
      atualizado_em INTEGER
    )`
  );

  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS historico_produtos (
      id TEXT PRIMARY KEY NOT NULL,
      produto_id TEXT,
      acao TEXT,
      nome TEXT,
      codigo TEXT,
      colaborador TEXT,
      data_evento INTEGER,
      detalhes TEXT,
      tipo_produto TEXT
    )`
  );

  await ensureColumn(db, 'ean_cache', 'referencia TEXT');
  await ensureColumn(db, 'produtos', "unidade_medida TEXT DEFAULT 'unidades'");
  await ensureColumn(db, 'produtos', 'embalagem TEXT');
  await ensureColumn(db, 'produtos', 'quantidade_medida REAL DEFAULT 0');
  await ensureColumn(db, 'produtos', 'validades_adicionais TEXT');
  await ensureColumn(db, 'produtos', 'lote TEXT');
  await ensureColumn(db, 'produtos', 'observacao TEXT');
  await ensureColumn(db, 'produtos', "status_conferencia TEXT DEFAULT 'pendente'");
  await ensureColumn(db, 'ean_cache', "unidade_medida TEXT DEFAULT 'unidades'");
  await ensureColumn(db, 'ean_cache', 'embalagem TEXT');
  await ensureColumn(db, 'ean_cache', 'quantidade_medida REAL DEFAULT 0');
  await ensureColumn(db, 'historico_produtos', 'tipo_produto TEXT');

  for (const indexSql of SQLITE_INDEXES) {
    await db.runAsync(indexSql);
  }
};
