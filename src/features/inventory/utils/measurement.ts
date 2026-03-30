import type { TipoEmbalagem, UnidadeMedida } from '../../../types/inventory';

export const normalizeMeasureText = (value?: string) =>
  (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const parseMeasureNumber = (value: string | undefined) => {
  const text = String(value || '').replace(',', '.');
  const parsed = parseFloat(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const inferMeasureFromPresentation = (
  presentation?: string
): { unidade_medida: UnidadeMedida; quantidade_medida: number } => {
  const text = normalizeMeasureText(presentation);
  if (!text) return { unidade_medida: 'unidades', quantidade_medida: 0 };

  const matchMl = text.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
  if (matchMl) return { unidade_medida: 'ml', quantidade_medida: parseMeasureNumber(matchMl[1]) };

  const matchGrams = text.match(/(\d+(?:[.,]\d+)?)\s*g\b/);
  if (matchGrams) return { unidade_medida: 'g', quantidade_medida: parseMeasureNumber(matchGrams[1]) };

  const matchDrops = text.match(/(\d+(?:[.,]\d+)?)\s*gotas?\b/);
  if (matchDrops) return { unidade_medida: 'gotas', quantidade_medida: parseMeasureNumber(matchDrops[1]) };

  const matchX = text.match(/\bx\s*(\d+(?:[.,]\d+)?)\b/);
  const matchCt = text.match(/\bct\s*(\d+(?:[.,]\d+)?)\b/);
  const defaultQty = parseMeasureNumber(matchX?.[1] || matchCt?.[1]);

  if (/\b(com|comp|comprimido|comprimidos)\b/.test(text)) {
    return { unidade_medida: 'comprimidos', quantidade_medida: defaultQty };
  }

  if (/\b(cap|caps|capsula|capsulas)\b/.test(text)) {
    return { unidade_medida: 'capsulas', quantidade_medida: defaultQty };
  }

  if (/\b(dragea|drageas)\b/.test(text)) {
    return { unidade_medida: 'drageas', quantidade_medida: defaultQty };
  }

  if (/\b(amp|ampola|ampolas|fa)\b/.test(text)) {
    return { unidade_medida: 'ampolas', quantidade_medida: defaultQty || 1 };
  }

  if (/\b(env|envelope|envelopes|sache|saches|saqueta|saquetas)\b/.test(text)) {
    return { unidade_medida: 'envelopes', quantidade_medida: defaultQty || 1 };
  }

  if (/\b(bisnaga|bisnagas|tubo|tubos|pomada|creme|gel)\b/.test(text)) {
    return { unidade_medida: 'bisnagas', quantidade_medida: defaultQty || 1 };
  }

  if (/\b(frasco|frascos|fras)\b/.test(text)) {
    return { unidade_medida: 'frascos', quantidade_medida: defaultQty || 1 };
  }

  if (/\b(spray|sprayes|aerossol|aerosol)\b/.test(text)) {
    return { unidade_medida: 'sprays', quantidade_medida: defaultQty || 1 };
  }

  return { unidade_medida: 'unidades', quantidade_medida: defaultQty };
};

export const inferPackageType = (presentation?: string): TipoEmbalagem | null => {
  const text = normalizeMeasureText(presentation);
  if (!text) return null;

  if (/\b(amp|ampola|ampolas|fa)\b/.test(text)) return 'ampola';
  if (/\b(env|envelope|envelopes|sache|saches|saqueta|saquetas)\b/.test(text)) return 'envelope';
  if (/\b(bisnaga|bisnagas|tubo|tubos|pomada|creme|gel)\b/.test(text)) return 'bisnaga';
  if (/\b(spray|sprayes|aerossol|aerosol)\b/.test(text)) return 'spray';
  if (/\b(frasco|frascos|fras)\b/.test(text)) return 'frasco';

  return null;
};
