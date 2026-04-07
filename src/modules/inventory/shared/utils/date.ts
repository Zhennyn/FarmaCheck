import type { StatusValidadeInfo } from '../../domain/models/product.model';

export const normalizeIsoDate = (value: string | undefined) => {
  if (!value) return '';
  const text = value.trim().replace(/^\uFEFF/, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;

  return text;
};

export const toDate = (value?: string) => {
  const normalized = normalizeIsoDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return new Date();

  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const getDaysUntilExpiry = (expiryDate: string | undefined) => {
  if (!expiryDate) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = normalizeIsoDate(expiryDate).split('-');
  if (parts.length !== 3) return Number.POSITIVE_INFINITY;

  const expiresAt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  expiresAt.setHours(0, 0, 0, 0);

  return Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getDiscountStatus = (expiryDate: string | undefined): StatusValidadeInfo => {
  if (!expiryDate) {
    return { tipo: 'ok', label: 'SEM DATA', cor: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = normalizeIsoDate(expiryDate).split('-');

  if (parts.length !== 3) {
    return { tipo: 'ok', label: 'DATA ERRADA', cor: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' };
  }

  const expiresAt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  expiresAt.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { tipo: 'vencido', label: 'VENCIDO', cor: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' };
  if (diffDays <= 30) return { tipo: 'retirar', label: 'RETIRAR', cor: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' };
  if (diffDays <= 60) return { tipo: 'markdown', label: '60% DESC', cor: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' };
  if (diffDays <= 90) return { tipo: 'markdown', label: '40% DESC', cor: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' };
  if (diffDays <= 120) return { tipo: 'markdown', label: '30% DESC', cor: '#B45309', bg: '#FFFBEB', border: '#FDE68A' };
  if (diffDays <= 180) return { tipo: 'markdown', label: '20% DESC', cor: '#A16207', bg: '#FEFCE8', border: '#FEF08A' };

  return { tipo: 'ok', label: 'NO PRAZO', cor: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' };
};

export const formatDatePtBr = (dateValue: string | undefined) => {
  if (!dateValue) return '--/--/----';
  const parts = normalizeIsoDate(dateValue).split('-');
  if (parts.length !== 3) return dateValue;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const parseStringList = (value?: string): string[] => {
  if (!value) return [];

  try {
    const list = JSON.parse(value) as unknown;
    if (!Array.isArray(list)) return [];
    return list.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
};

export const nearestExpiry = (mainExpiry: string, additionalExpiryJson?: string): string => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (mainExpiry) {
    const current = new Date(mainExpiry);
    current.setHours(0, 0, 0, 0);
    dates.push(current);
  }

  if (additionalExpiryJson) {
    const additional = parseStringList(additionalExpiryJson);
    for (const expiry of additional) {
      const current = new Date(expiry);
      current.setHours(0, 0, 0, 0);
      dates.push(current);
    }
  }

  if (dates.length === 0) return mainExpiry;

  const nearest = dates.reduce((prev, current) => {
    const prevDiff = Math.abs(prev.getTime() - today.getTime());
    const currentDiff = Math.abs(current.getTime() - today.getTime());
    return currentDiff < prevDiff ? current : prev;
  });

  return nearest.toISOString().split('T')[0];
};
