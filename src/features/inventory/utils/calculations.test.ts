import { describe, expect, it } from '@jest/globals';
import type { Produto } from '../../../types/inventory';
import { formatMeasuredTotal, summarizeMeasuredTotals } from './calculations';

describe('inventory calculations', () => {
  it('formats measured total for one product', () => {
    const result = formatMeasuredTotal({ qtd: 3, quantidade_medida: 120, unidade_medida: 'ml' });
    expect(result).toBe('360 ml');
  });

  it('returns null when base quantity is missing', () => {
    const result = formatMeasuredTotal({ qtd: 2, quantidade_medida: 0, unidade_medida: 'g' });
    expect(result).toBeNull();
  });

  it('summarizes totals by unit', () => {
    const products: Produto[] = [
      {
        id: '1',
        nome: 'A',
        codigo: '111',
        validade: '2026-12-01',
        custo: 0,
        qtd: 2,
        colaborador: 'Ana',
        unidade_medida: 'ml',
        quantidade_medida: 100,
      },
      {
        id: '2',
        nome: 'B',
        codigo: '222',
        validade: '2026-12-01',
        custo: 0,
        qtd: 1,
        colaborador: 'Ana',
        unidade_medida: 'ml',
        quantidade_medida: 50,
      },
      {
        id: '3',
        nome: 'C',
        codigo: '333',
        validade: '2026-12-01',
        custo: 0,
        qtd: 4,
        colaborador: 'Ana',
        unidade_medida: 'g',
        quantidade_medida: 10,
      },
    ];

    const result = summarizeMeasuredTotals(products);
    expect(result).toEqual(['250 ml', '40 g']);
  });
});
