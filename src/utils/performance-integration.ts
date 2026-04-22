/**
 * Exemplo de Integração de Métricas de Performance
 *
 * Este arquivo demonstra como integrar opcionalmente as métricas
 * de performance no código principal sem poluir a lógica de negócio.
 *
 * IMPORTANTE: Esta é uma integração OPCIONAL. O código principal
 * funciona perfeitamente sem estas métricas.
 */

import { sqliteClient } from '../src/database/sqlite-client';
import { inventoryRepository } from '../src/modules/inventory/application/repositories/inventory.repository';
import { inventoryService } from '../src/modules/inventory/application/services/inventory.service';
import { measureTime } from '../src/utils/performance';

// Exemplo 1: Service com métricas opcionais
export const inventoryServiceWithMetrics = (repository: any) => {
  const baseService = inventoryService(repository);

  return {
    ...baseService,

    // Versão com métricas da operação createProduct
    createProductWithMetrics: async (input: any) => {
      return measureTime(`create_product_${input.nome || 'unknown'}`, async () => {
        return baseService.createProduct(input);
      });
    },

    // Versão com métricas da operação updateProduct
    updateProductWithMetrics: async (input: any) => {
      return measureTime(`update_product_${input.id}`, async () => {
        return baseService.updateProduct(input);
      });
    },

    // Versão com métricas da operação deleteProduct
    deleteProductWithMetrics: async (input: any) => {
      return measureTime(`delete_product_${input.id}`, async () => {
        return baseService.deleteProduct(input);
      });
    },
  };
};

// Exemplo 2: Repository com métricas opcionais
export const inventoryRepositoryWithMetrics = (db: any) => {
  const baseRepo = inventoryRepository(db);

  return {
    ...baseRepo,

    // Versão com métricas da operação listAll
    listAllWithMetrics: async () => {
      return measureTime('repository_list_all', async () => {
        return baseRepo.listAll();
      });
    },

    // Versão com métricas da operação upsert
    upsertWithMetrics: async (product: any) => {
      return measureTime(`repository_upsert_${product.id}`, async () => {
        return baseRepo.upsert(product);
      });
    },
  };
};

// Exemplo 3: Hook React com métricas (opcional)
export const useInventoryWithMetrics = () => {
  // Versão base (sem métricas)
  const baseRepo = inventoryRepository(sqliteClient);
  const baseService = inventoryService(baseRepo);

  // Versão com métricas (opcional - pode ser ativada via feature flag)
  const metricsEnabled = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_METRICS === 'true';

  const service = metricsEnabled
    ? inventoryServiceWithMetrics(baseRepo)
    : baseService;

  const repo = metricsEnabled
    ? inventoryRepositoryWithMetrics(sqliteClient)
    : baseRepo;

  return {
    service,
    repo,
    metricsEnabled,
  };
};

// Exemplo 4: Utilitário para feature flag
export const PerformanceConfig = {
  // Ativar métricas apenas em desenvolvimento
  enabled: __DEV__ && process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_METRICS === 'true',

  // Níveis de log
  logLevel: process.env.EXPO_PUBLIC_PERFORMANCE_LOG_LEVEL || 'basic', // 'basic' | 'detailed' | 'none'

  // Thresholds para alertas (ms)
  slowOperationThreshold: 100, // Alertar operações > 100ms
  verySlowOperationThreshold: 1000, // Alertar operações > 1s
};

// Exemplo 5: Wrapper genérico para qualquer função
export const withPerformanceMetrics = <T extends any[], R>(
  operationName: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    if (!PerformanceConfig.enabled) {
      return fn(...args);
    }

    return measureTime(operationName, () => fn(...args));
  };
};

/*
// Exemplo de uso em componente React:

import { useInventoryWithMetrics } from './performance-integration';

export default function InventoryScreen() {
  const { service, metricsEnabled } = useInventoryWithMetrics();

  const handleCreateProduct = async () => {
    if (metricsEnabled) {
      // Usa versão com métricas
      await service.createProductWithMetrics(productData);
    } else {
      // Usa versão normal
      await service.createProduct(productData);
    }
  };

  return (
    <View>
      <Text>Métricas: {metricsEnabled ? 'Ativadas' : 'Desativadas'}</Text>
      // ... resto do componente
    </View>
  );
}
*/