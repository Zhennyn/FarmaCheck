/**
 * Exemplo de Uso das Métricas de Performance em Componente React
 *
 * Este arquivo demonstra como integrar opcionalmente as métricas
 * de performance em componentes React de forma não invasiva.
 */

import { useState } from 'react';
import { Alert, Button, Text, View } from 'react-native';
import { sqliteClient } from '../src/database/sqlite-client';
import { inventoryRepository } from '../src/modules/inventory/application/repositories/inventory.repository';
import { inventoryService } from '../src/modules/inventory/application/services/inventory.service';
import { generateTestProduct, measureTime, seedDatabase } from '../src/utils/performance';

// Hook personalizado com métricas opcionais
const useInventoryWithOptionalMetrics = () => {
  const [metricsEnabled] = useState(__DEV__); // Apenas em desenvolvimento

  const repo = inventoryRepository(sqliteClient);
  const service = inventoryService(repo);

  // Wrapper para operações com métricas opcionais
  const createProduct = async (input: any) => {
    if (metricsEnabled) {
      return measureTime(`create_product_${input.nome}`, async () => {
        const result = await service.createProduct(input);
        if (!result.success) throw new Error(result.error.message);
        return result.data;
      });
    } else {
      const result = await service.createProduct(input);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    }
  };

  const listProducts = async () => {
    if (metricsEnabled) {
      return measureTime('list_all_products', async () => {
        return repo.listAll();
      });
    } else {
      return repo.listAll();
    }
  };

  return {
    createProduct,
    listProducts,
    metricsEnabled,
  };
};

// Componente de exemplo
export default function PerformanceExampleScreen() {
  const { createProduct, listProducts, metricsEnabled } = useInventoryWithOptionalMetrics();
  const [isLoading, setIsLoading] = useState(false);
  const [productCount, setProductCount] = useState(0);

  const handleCreateTestProduct = async () => {
    setIsLoading(true);
    try {
      const testProduct = generateTestProduct(Date.now());
      await createProduct(testProduct);
      Alert.alert('Sucesso', 'Produto criado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleListProducts = async () => {
    setIsLoading(true);
    try {
      const products = await listProducts();
      setProductCount(products.length);
      Alert.alert('Lista', `Encontrados ${products.length} produtos`);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePerformanceTest = async () => {
    setIsLoading(true);
    try {
      // Teste com 50 produtos
      await seedDatabase(50, createProduct);

      // Medir listagem
      const products = await listProducts();
      setProductCount(products.length);

      Alert.alert(
        'Teste Concluído',
        `Criados e listados ${products.length} produtos.\n` +
        `Métricas: ${metricsEnabled ? 'Ativadas' : 'Desativadas'}`
      );
    } catch (error) {
      Alert.alert('Erro no Teste', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
        Exemplo de Métricas de Performance
      </Text>

      <Text style={{ marginBottom: 10 }}>
        Métricas: {metricsEnabled ? '✅ Ativadas' : '❌ Desativadas'}
      </Text>

      <Text style={{ marginBottom: 20 }}>
        Produtos no banco: {productCount}
      </Text>

      <Button
        title={isLoading ? "Processando..." : "Criar Produto de Teste"}
        onPress={handleCreateTestProduct}
        disabled={isLoading}
      />

      <View style={{ height: 10 }} />

      <Button
        title={isLoading ? "Carregando..." : "Listar Produtos"}
        onPress={handleListProducts}
        disabled={isLoading}
      />

      <View style={{ height: 10 }} />

      <Button
        title={isLoading ? "Testando..." : "Executar Teste de Performance"}
        onPress={handlePerformanceTest}
        disabled={isLoading}
      />

      <Text style={{ marginTop: 20, fontSize: 12, color: 'gray', textAlign: 'center' }}>
        Verifique o console para ver as métricas de performance quando ativadas.
      </Text>
    </View>
  );
}