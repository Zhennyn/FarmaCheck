import { describe, expect, it } from '@jest/globals';
import type { Produto } from '../../domain/models/product.model';
import {
    applySaveProductRules,
    listExpiredProducts,
    listLowStockProducts,
    listNearExpiryProducts,
    queryInventory,
    validateProductForSave,
} from './inventory-business.service';

const isoOffset = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const baseProducts: Produto[] = [
  {
    id: 'p1',
    nome: 'Dipirona',
    codigo: '111',
    validade: isoOffset(-2),
    custo: 0,
    qtd: 8,
    colaborador: 'Ana',
    status_conferencia: 'pendente',
  },
  {
    id: 'p2',
    nome: 'Paracetamol',
    codigo: '222',
    validade: isoOffset(10),
    custo: 0,
    qtd: 2,
    colaborador: 'Bruno',
    status_conferencia: 'conferido',
  },
  {
    id: 'p3',
    nome: 'Vitamina C',
    codigo: '333',
    validade: isoOffset(45),
    custo: 0,
    qtd: 4,
    colaborador: 'Ana',
    status_conferencia: 'resolvido',
  },
];

describe('inventory business service', () => {
  it('blocks create when expiry date is in the past', () => {
    const result = applySaveProductRules({
      name: 'Produto A',
      code: '789',
      expiryDate: isoOffset(-1),
      quantity: 1,
      mode: 'create',
    });

    expect(result.errors.some((message) => message.includes('validade no passado'))).toBe(true);
  });

  it('blocks negative stock quantity', () => {
    const result = validateProductForSave({
      name: 'Produto A',
      code: '789',
      expiryDate: isoOffset(10),
      quantity: -3,
      mode: 'create',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.details?.some((message) => message.includes('nao pode ser negativa'))).toBe(true);
    }
  });

  it('lists expired products', () => {
    const result = listExpiredProducts(baseProducts);
    expect(result.map((item) => item.id)).toEqual(['p1']);
  });

  it('lists near-expiry products within 30 days', () => {
    const result = listNearExpiryProducts(baseProducts, { days: 30 });
    expect(result.map((item) => item.id)).toEqual(['p2']);
  });

  it('lists low stock products with threshold', () => {
    const result = listLowStockProducts(baseProducts, { minStock: 4 });
    expect(result.map((item) => item.id)).toEqual(['p2', 'p3']);
  });

  it('applies filter and risk ordering', () => {
    const result = queryInventory(baseProducts, {
      collaborator: 'ana',
      expiryFilter: 'todos',
      statusFilter: 'todos',
      unitFilter: 'todos',
      packageFilter: 'todos',
    });

    expect(result.map((item) => item.id)).toEqual(['p1', 'p3']);
  });
});
