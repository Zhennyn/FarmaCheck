import { describe, expect, it, jest } from '@jest/globals';
import type { Produto } from '../../types/inventory';
import { inventoryRepository, type InventoryDatabase } from './inventory.repository';

describe('inventory repository', () => {
  const sample: Produto = {
    id: 'p-1',
    nome: 'Dipirona',
    codigo: '789',
    apresentacao: 'Frasco 120 ml',
    validade: '2026-12-31',
    custo: 0,
    qtd: 2,
    colaborador: 'Time A',
    unidade_medida: 'ml',
    quantidade_medida: 120,
  };

  it('lists products from sqlite adapter', async () => {
    const db: InventoryDatabase = {
      getAllAsync: async <T = unknown>(_sql: string, ..._params: unknown[]) => [sample as T],
      runAsync: async (_sql: string, ..._params: unknown[]) => ({}),
    };
    const getAllSpy = jest.spyOn(db, 'getAllAsync');

    const repo = inventoryRepository(db);
    const result = await repo.listAll();

    expect(result).toEqual([sample]);
    expect(getAllSpy).toHaveBeenCalledWith('SELECT * FROM produtos');
  });

  it('upserts product with default-safe values', async () => {
    const db: InventoryDatabase = {
      getAllAsync: async <T = unknown>(_sql: string, ..._params: unknown[]) => [] as T[],
      runAsync: async (_sql: string, ..._params: unknown[]) => undefined,
    };
    const runSpy = jest.spyOn(db, 'runAsync');

    const repo = inventoryRepository(db);
    await repo.upsert(sample);

    expect(runSpy).toHaveBeenCalled();
  });
});
