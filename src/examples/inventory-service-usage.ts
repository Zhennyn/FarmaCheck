// Exemplo de uso do novo Inventory Service
// Este arquivo demonstra como integrar o service na aplicação

import { inventoryRepository } from '../modules/inventory/application/repositories/inventory.repository';
import { inventoryService } from '../modules/inventory/application/services/inventory.service';
import { sqliteClient } from '../database/sqlite-client';

// Exemplo de uso em um componente React ou hook
export const useInventoryService = () => {
  const db = sqliteClient(); // Assumindo que sqliteClient retorna a instância do DB
  const repo = inventoryRepository(db);
  const service = inventoryService(repo);

  const createProduct = async (input: Parameters<typeof service.createProduct>[0]) => {
    const result = await service.createProduct(input);
    if (result.success) {
      // Produto criado com sucesso
      console.log('Produto criado:', result.data);
      // Aqui você pode atualizar o estado da UI ou mostrar uma notificação
    } else {
      // Erro na criação
      console.error('Erro:', result.error.message);
      // Aqui você pode mostrar um Alert ou Toast com o erro
      // Alert.alert('Erro', result.error.message);
    }
    return result;
  };

  const updateProduct = async (input: Parameters<typeof service.updateProduct>[0]) => {
    const result = await service.updateProduct(input);
    if (result.success) {
      console.log('Produto atualizado:', result.data);
    } else {
      console.error('Erro:', result.error.message);
    }
    return result;
  };

  const deleteProduct = async (input: Parameters<typeof service.deleteProduct>[0]) => {
    const result = await service.deleteProduct(input);
    if (result.success) {
      console.log('Produto deletado');
    } else {
      console.error('Erro:', result.error.message);
    }
    return result;
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

// Exemplo de uso do repository para consultas
export const useInventoryQueries = () => {
  const db = sqliteClient();
  const repo = inventoryRepository(db);

  const getExpiringSoon = async () => {
    return await repo.findExpiringSoon();
  };

  const getLowStock = async (threshold = 5) => {
    return await repo.findLowStock(threshold);
  };

  return {
    getExpiringSoon,
    getLowStock,
  };
};

// Exemplo de função utilitária para alertas
import { isExpiringSoon } from '../modules/inventory/shared/utils/date';

export const checkProductAlerts = (product: { validade: string; validades_adicionais?: string }) => {
  if (isExpiringSoon(product)) {
    // Produto vence em até 7 dias - mostrar alerta
    return {
      type: 'warning',
      message: 'Produto vence em breve',
    };
  }
  return null;
};