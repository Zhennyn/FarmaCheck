import type { Produto, UnidadeMedida } from '../../../types/inventory';
import { ROTULOS_UNIDADE_MEDIDA } from '../constants';

export const formatMeasuredTotal = (
  product: Pick<Produto, 'qtd' | 'quantidade_medida' | 'unidade_medida'>
): string | null => {
  const baseQty = Number(product.quantidade_medida || 0);
  if (!baseQty) return null;

  const total = (product.qtd || 0) * baseQty;
  const unit = ROTULOS_UNIDADE_MEDIDA[product.unidade_medida || 'unidades'];
  const value = Number.isInteger(total) ? String(total) : total.toFixed(2).replace('.', ',');

  return `${value} ${unit}`;
};

export const summarizeMeasuredTotals = (products: Produto[]): string[] => {
  const totals = new Map<UnidadeMedida, number>();

  products.forEach((product) => {
    const baseQty = Number(product.quantidade_medida || 0);
    if (!baseQty) return;

    const unit = product.unidade_medida || 'unidades';
    const currentTotal = totals.get(unit) || 0;
    totals.set(unit, currentTotal + (product.qtd || 0) * baseQty);
  });

  return Array.from(totals.entries())
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([unit, total]) => {
      const value = Number.isInteger(total) ? String(total) : total.toFixed(2).replace('.', ',');
      return `${value} ${ROTULOS_UNIDADE_MEDIDA[unit]}`;
    });
};
