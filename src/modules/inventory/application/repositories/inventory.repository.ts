import type { Log, Produto } from '../../domain/models/product.model';
import type { InventoryDatabase } from '../ports/inventory-database.port';

export const inventoryRepository = (db: InventoryDatabase) => ({
  listAll: async () => db.getAllAsync<Produto>('SELECT * FROM produtos'),

  upsert: async (product: Produto) => {
    const now = Date.now();
    await db.runAsync(
      `INSERT OR REPLACE INTO produtos (
        id, nome, codigo, apresentacao, embalagem, unidade_medida, quantidade_medida,
        validade, validades_adicionais, custo, qtd, colaborador, lote, observacao, status_conferencia,
        sync_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      product.id,
      product.nome,
      product.codigo,
      product.apresentacao || '',
      product.embalagem || '',
      product.unidade_medida || 'unidades',
      product.quantidade_medida || 0,
      product.validade,
      product.validades_adicionais || '',
      product.custo,
      product.qtd,
      product.colaborador,
      product.lote || '',
      product.observacao || '',
      product.status_conferencia || 'pendente',
      'pending',
      now
    );
  },

  findExpiringSoon: async () => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dateString = sevenDaysFromNow.toISOString().split('T')[0];
    return db.getAllAsync<Produto>(
      `SELECT * FROM produtos WHERE validade IS NOT NULL AND validade <= ?`,
      dateString
    );
  },

  findLowStock: async (threshold: number = 5) => {
    return db.getAllAsync<Produto>(
      `SELECT * FROM produtos WHERE qtd <= ?`,
      threshold
    );
  },

  insertLog: async (log: Log) => {
    await db.runAsync(
      `INSERT INTO logs (id, action, timestamp) VALUES (?, ?, ?)`,
      log.id,
      log.action,
      log.timestamp
    );
  },

  delete: async (id: string) => {
    await db.runAsync('DELETE FROM produtos WHERE id = ?', id);
  },
export type { InventoryDatabase } from '../ports/inventory-database.port';

export type { InventoryDatabase } from '../ports/inventory-database.port';

