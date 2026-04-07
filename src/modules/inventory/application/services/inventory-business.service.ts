import type {
    Produto,
    ProdutoComAnalise,
    StatusConferencia,
    TipoEmbalagem,
    TipoFiltro,
    UnidadeMedida,
} from '../../domain/models/product.model';
import { formatMeasuredTotal } from '../../shared/utils/calculations';
import { getDaysUntilExpiry, getDiscountStatus, nearestExpiry, normalizeIsoDate } from '../../shared/utils/date';
import { inferPackageType } from '../../shared/utils/measurement';

export type ApplicationError = {
  code: string;
  message: string;
  details?: string[];
};

export type ApplicationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApplicationError };

export type SaveProductRuleInput = {
  name: string;
  code: string;
  expiryDate: string;
  quantity: number;
  mode: 'create' | 'update';
};

export type SaveProductRuleResult = {
  normalizedExpiryDate: string;
  errors: string[];
};

export type InventoryFilterInput = {
  searchTerm?: string;
  expiryFilter?: TipoFiltro;
  collaborator?: string;
  statusFilter?: StatusConferencia | 'todos';
  unitFilter?: UnidadeMedida | 'todos';
  packageFilter?: TipoEmbalagem | 'todos';
};

export type InventorySortMode =
  | 'risk-first'
  | 'expiry-asc'
  | 'expiry-desc'
  | 'name-asc'
  | 'name-desc'
  | 'stock-asc'
  | 'stock-desc';

export type NearExpiryOptions = {
  days?: number;
};

export type LowStockOptions = {
  minStock?: number;
};

const riskPriority = (product: Pick<ProdutoComAnalise, 'statusValidade'>) => {
  if (product.statusValidade.tipo === 'vencido') return 0;
  if (product.statusValidade.tipo === 'retirar') return 1;
  if (product.statusValidade.tipo === 'markdown') return 2;
  return 3;
};

const cloneForSort = <T>(items: T[]): T[] => [...items];

const isAnalyzedProduct = (product: Produto | ProdutoComAnalise): product is ProdutoComAnalise =>
  'statusValidade' in product && 'diasAteValidade' in product && 'embalagemCalculada' in product;

export const analyzeProducts = (products: Produto[]): ProdutoComAnalise[] => {
  return products.map((product) => {
    const priorityExpiry = nearestExpiry(product.validade, product.validades_adicionais);
    const statusValidade = getDiscountStatus(priorityExpiry);

    return {
      ...product,
      statusValidade,
      diasAteValidade: getDaysUntilExpiry(priorityExpiry),
      embalagemCalculada: product.embalagem || inferPackageType(product.apresentacao) || null,
      totalMedidoCalculado: formatMeasuredTotal(product),
    };
  });
};

const ensureAnalyzedProducts = (products: Array<Produto | ProdutoComAnalise>): ProdutoComAnalise[] => {
  if (products.every(isAnalyzedProduct)) return products;
  return analyzeProducts(products as Produto[]);
};

export const applySaveProductRules = (input: SaveProductRuleInput): SaveProductRuleResult => {
  const errors: string[] = [];
  const normalizedExpiryDate = normalizeIsoDate(input.expiryDate);

  if (!input.name.trim()) errors.push('Nome do produto e obrigatorio.');
  if (!input.code.trim()) errors.push('Codigo do produto e obrigatorio.');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedExpiryDate)) {
    errors.push('A validade precisa estar no formato AAAA-MM-DD ou DD/MM/AAAA.');
  } else if (input.mode === 'create' && getDaysUntilExpiry(normalizedExpiryDate) < 0) {
    errors.push('Nao e permitido cadastrar produto com validade no passado.');
  }

  if (!Number.isFinite(input.quantity) || Number.isNaN(input.quantity)) {
    errors.push('Quantidade em estoque invalida.');
  } else if (input.quantity < 0) {
    errors.push('Quantidade em estoque nao pode ser negativa.');
  }

  return { normalizedExpiryDate, errors };
};

export const applyInventoryFilters = (
  products: Array<Produto | ProdutoComAnalise>,
  filters: InventoryFilterInput = {}
): ProdutoComAnalise[] => {
  const list = ensureAnalyzedProducts(products);
  const searchTerm = (filters.searchTerm || '').trim().toLowerCase();
  const collaborator = (filters.collaborator || '').trim().toLowerCase();
  const expiryFilter = filters.expiryFilter || 'todos';

  return list.filter((product) => {
    if (searchTerm) {
      const inName = product.nome.toLowerCase().includes(searchTerm);
      const inCode = product.codigo.toLowerCase().includes(searchTerm);
      if (!inName && !inCode) return false;
    }

    if (expiryFilter === 'vencidos' && product.statusValidade.tipo !== 'vencido') return false;
    if (
      expiryFilter === 'proximos'
      && product.statusValidade.tipo !== 'retirar'
      && product.statusValidade.tipo !== 'markdown'
    ) return false;
    if (expiryFilter === 'no_prazo' && product.statusValidade.tipo !== 'ok') return false;

    if (collaborator && !(product.colaborador || '').toLowerCase().includes(collaborator)) return false;

    if (filters.statusFilter && filters.statusFilter !== 'todos') {
      if ((product.status_conferencia || 'pendente') !== filters.statusFilter) return false;
    }

    if (filters.unitFilter && filters.unitFilter !== 'todos') {
      if ((product.unidade_medida || 'unidades') !== filters.unitFilter) return false;
    }

    if (filters.packageFilter && filters.packageFilter !== 'todos') {
      if ((product.embalagemCalculada || '') !== filters.packageFilter) return false;
    }

    return true;
  });
};

export const sortInventoryProducts = (
  products: ProdutoComAnalise[],
  sortMode: InventorySortMode = 'risk-first'
): ProdutoComAnalise[] => {
  const sorted = cloneForSort(products);

  switch (sortMode) {
    case 'expiry-asc':
      return sorted.sort((a, b) => a.diasAteValidade - b.diasAteValidade);
    case 'expiry-desc':
      return sorted.sort((a, b) => b.diasAteValidade - a.diasAteValidade);
    case 'name-asc':
      return sorted.sort((a, b) => a.nome.localeCompare(b.nome));
    case 'name-desc':
      return sorted.sort((a, b) => b.nome.localeCompare(a.nome));
    case 'stock-asc':
      return sorted.sort((a, b) => a.qtd - b.qtd);
    case 'stock-desc':
      return sorted.sort((a, b) => b.qtd - a.qtd);
    default:
      return sorted.sort((a, b) => {
        const priorityDiff = riskPriority(a) - riskPriority(b);
        if (priorityDiff !== 0) return priorityDiff;
        return a.diasAteValidade - b.diasAteValidade;
      });
  }
};

export const queryInventory = (
  products: Array<Produto | ProdutoComAnalise>,
  filters: InventoryFilterInput = {},
  sortMode: InventorySortMode = 'risk-first'
): ProdutoComAnalise[] => {
  const filtered = applyInventoryFilters(products, filters);
  return sortInventoryProducts(filtered, sortMode);
};

export const listExpiredProducts = (products: Array<Produto | ProdutoComAnalise>): ProdutoComAnalise[] => {
  return applyInventoryFilters(products, { expiryFilter: 'vencidos' });
};

export const listNearExpiryProducts = (
  products: Array<Produto | ProdutoComAnalise>,
  options: NearExpiryOptions = {}
): ProdutoComAnalise[] => {
  const days = options.days ?? 30;
  const analyzed = ensureAnalyzedProducts(products);

  return analyzed
    .filter((product) => product.diasAteValidade >= 0 && product.diasAteValidade <= days)
    .sort((a, b) => a.diasAteValidade - b.diasAteValidade);
};

export const listLowStockProducts = (
  products: Array<Produto | ProdutoComAnalise>,
  options: LowStockOptions = {}
): ProdutoComAnalise[] => {
  const minStock = options.minStock ?? 5;
  const analyzed = ensureAnalyzedProducts(products);

  return analyzed
    .filter((product) => product.qtd <= minStock)
    .sort((a, b) => a.qtd - b.qtd || a.nome.localeCompare(b.nome));
};

export const validateProductForSave = (input: SaveProductRuleInput): ApplicationResult<{ normalizedExpiryDate: string }> => {
  const result = applySaveProductRules(input);

  if (result.errors.length > 0) {
    return {
      success: false,
      error: {
        code: 'INVENTORY_VALIDATION_ERROR',
        message: 'Regras de cadastro de produto nao foram atendidas.',
        details: result.errors,
      },
    };
  }

  return {
    success: true,
    data: {
      normalizedExpiryDate: result.normalizedExpiryDate,
    },
  };
};
