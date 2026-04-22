import type { Log, Produto } from '../../domain/models/product.model';
import { getDaysUntilExpiry, normalizeIsoDate } from '../../shared/utils/date';

// Função simples para gerar ID único
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export type InventoryServiceError = {
  code: string;
  message: string;
  details?: string[];
};

export type InventoryServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: InventoryServiceError };

export type CreateProductInput = {
  nome: string;
  codigo: string;
  validade: string;
  qtd: number;
  colaborador: string;
  custo?: number;
  apresentacao?: string;
  embalagem?: string;
  unidade_medida?: string;
  quantidade_medida?: number;
  lote?: string;
  observacao?: string;
  validades_adicionais?: string;
  status_conferencia?: string;
};

export type UpdateProductInput = CreateProductInput & {
  id: string;
};

export type DeleteProductInput = {
  id: string;
  colaborador: string;
};

type InventoryRepository = {
  upsert: (product: Produto) => Promise<void>;
  insertLog: (log: Log) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

export const inventoryService = (repository: InventoryRepository) => ({
  createProduct: async (input: CreateProductInput): Promise<InventoryServiceResult<Produto>> => {
    try {
      // Validações
      if (!input.nome?.trim()) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Nome do produto é obrigatório',
          },
        };
      }

      if (!input.codigo?.trim()) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Código do produto é obrigatório',
          },
        };
      }

      if (input.qtd < 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Quantidade não pode ser negativa',
          },
        };
      }

      const normalizedExpiry = normalizeIsoDate(input.validade);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedExpiry)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Data de validade deve estar no formato AAAA-MM-DD',
          },
        };
      }

      if (getDaysUntilExpiry(normalizedExpiry) < 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Não é permitido cadastrar produto com validade no passado',
          },
        };
      }

      // Criar produto
      const product: Produto = {
        id: generateId(),
        nome: input.nome.trim(),
        codigo: input.codigo.trim(),
        validade: normalizedExpiry,
        qtd: input.qtd,
        colaborador: input.colaborador,
        custo: input.custo || 0,
        apresentacao: input.apresentacao,
        embalagem: input.embalagem,
        unidade_medida: input.unidade_medida,
        quantidade_medida: input.quantidade_medida,
        lote: input.lote,
        observacao: input.observacao,
        validades_adicionais: input.validades_adicionais,
        status_conferencia: input.status_conferencia,
      };

      await repository.upsert(product);

      // Registrar log
      const log: Log = {
        id: generateId(),
        action: 'DELETE_PRODUCT',
        timestamp: Date.now(),
      };
      await repository.insertLog(log);

      return { success: true, data: product };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno ao criar produto',
          details: [error instanceof Error ? error.message : 'Erro desconhecido'],
        },
      };
    }
  },

  updateProduct: async (input: UpdateProductInput): Promise<InventoryServiceResult<Produto>> => {
    try {
      // Validações
      if (!input.nome?.trim()) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Nome do produto é obrigatório',
          },
        };
      }

      if (!input.codigo?.trim()) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Código do produto é obrigatório',
          },
        };
      }

      if (input.qtd < 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Quantidade não pode ser negativa',
          },
        };
      }

      const normalizedExpiry = normalizeIsoDate(input.validade);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedExpiry)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Data de validade deve estar no formato AAAA-MM-DD',
          },
        };
      }

      // Criar produto atualizado
      const product: Produto = {
        id: input.id,
        nome: input.nome.trim(),
        codigo: input.codigo.trim(),
        validade: normalizedExpiry,
        qtd: input.qtd,
        colaborador: input.colaborador,
        custo: input.custo || 0,
        apresentacao: input.apresentacao,
        embalagem: input.embalagem,
        unidade_medida: input.unidade_medida,
        quantidade_medida: input.quantidade_medida,
        lote: input.lote,
        observacao: input.observacao,
        validades_adicionais: input.validades_adicionais,
        status_conferencia: input.status_conferencia,
      };

      await repository.upsert(product);

      // Registrar log
      const log: Log = {
        id: uuidv4(),
        action: 'UPDATE_PRODUCT',
        timestamp: Date.now(),
      };
      await repository.insertLog(log);

      return { success: true, data: product };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno ao atualizar produto',
          details: [error instanceof Error ? error.message : 'Erro desconhecido'],
        },
      };
    }
  },

  deleteProduct: async (input: DeleteProductInput): Promise<InventoryServiceResult<void>> => {
    try {
      // Deletar produto
      await repository.delete(input.id);

      // Registrar log
      const log: Log = {
        id: uuidv4(),
        action: 'DELETE_PRODUCT',
        timestamp: Date.now(),
      };
      await repository.insertLog(log);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno ao deletar produto',
          details: [error instanceof Error ? error.message : 'Erro desconhecido'],
        },
      };
    }
  },
});