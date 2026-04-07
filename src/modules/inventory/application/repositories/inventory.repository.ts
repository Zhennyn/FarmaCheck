import type { Produto } from '../../domain/models/product.model';
import type { InventoryDatabase } from '../ports/inventory-database.port';

export const inventoryRepository = (db: InventoryDatabase) => ({
  listAll: async () => db.getAllAsync<Produto>('SELECT * FROM produtos'),

  upsert: async (product: Produto) => {
    await db.runAsync(
      `INSERT OR REPLACE INTO produtos (
        id, nome, codigo, apresentacao, embalagem, unidade_medida, quantidade_medida,
        validade, validades_adicionais, custo, qtd, colaborador, lote, observacao, status_conferencia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      product.status_conferencia || 'pendente'
    );
  },
});

export type { InventoryDatabase } from '../ports/inventory-database.port';

