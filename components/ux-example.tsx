/**
 * Exemplo de Componente com UX Melhorada
 *
 * Demonstra como integrar os novos componentes de UX:
 * - LoadingView para estados de carregamento
 * - EmptyState para listas vazias
 * - SmartButton para ações com feedback
 * - FeedbackMessage para notificações
 * - useAsyncOperation para gerenciar operações assíncronas
 */

import React, { useState, useEffect } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { LoadingView } from '../ui/loading-view';
import { EmptyState } from '../ui/empty-state';
import { SmartButton } from '../ui/smart-button';
import { FeedbackContainer, useFeedback } from '../ui/feedback-message';
import { useAsyncOperation } from '../../hooks/use-async-operation';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

// Simulação de dados e operações
type Product = {
  id: string;
  name: string;
  quantity: number;
};

const mockProducts: Product[] = [
  { id: '1', name: 'Produto A', quantity: 10 },
  { id: '2', name: 'Produto B', quantity: 5 },
  { id: '3', name: 'Produto C', quantity: 0 },
];

const simulateApiCall = (delay = 1000): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simular erro aleatório (10% de chance)
      if (Math.random() < 0.1) {
        reject(new Error('Erro ao carregar produtos'));
      } else {
        resolve(mockProducts);
      }
    }, delay);
  });
};

const simulateSaveProduct = (productName: string): Promise<Product> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.2) {
        reject(new Error('Erro ao salvar produto'));
      } else {
        resolve({
          id: Date.now().toString(),
          name: productName,
          quantity: Math.floor(Math.random() * 100),
        });
      }
    }, 1500);
  });
};

export const UXExampleScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Hook para operações assíncronas com feedback automático
  const loadOperation = useAsyncOperation(true);
  const saveOperation = useAsyncOperation();

  // Hook para feedback manual
  const feedback = useFeedback();

  // Carregar produtos na inicialização
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const result = await loadOperation.execute(
      () => simulateApiCall(),
      {
        successMessage: 'Produtos carregados com sucesso!',
        errorMessage: 'Não foi possível carregar os produtos',
        showAlertOnError: true,
      }
    );

    if (result) {
      setProducts(result);
    }

    setIsInitialLoad(false);
  };

  const addProduct = async () => {
    const result = await saveOperation.execute(
      () => simulateSaveProduct('Novo Produto'),
      {
        successMessage: 'Produto adicionado com sucesso!',
        errorMessage: 'Erro ao adicionar produto',
      }
    );

    if (result) {
      setProducts(prev => [...prev, result]);
    }
  };

  const refreshProducts = () => {
    loadProducts();
  };

  // Renderizar item da lista
  const renderProduct = ({ item }: { item: Product }) => (
    <ThemedView
      style={{
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>
        {item.name}
      </ThemedText>
      <ThemedText style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
        Quantidade: {item.quantity}
      </ThemedText>
    </ThemedView>
  );

  // Estado de carregamento inicial
  if (isInitialLoad) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <FeedbackContainer feedback={feedback} />
        <LoadingView
          message="Carregando produtos..."
          fullScreen
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Container de feedback - deve estar no topo */}
      <FeedbackContainer feedback={feedback} />

      {/* Header com botão de adicionar */}
      <ThemedView
        style={{
          padding: 16,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>
            Meus Produtos
          </ThemedText>

          <SmartButton
            title="Adicionar"
            onPress={addProduct}
            loading={saveOperation.isLoading}
            loadingText="Salvando..."
            size="small"
            style={{ minWidth: 100 }}
          />
        </View>
      </ThemedView>

      {/* Lista de produtos ou estado vazio */}
      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          message="Adicione seu primeiro produto para começar a gerenciar seu inventário"
          action={
            <SmartButton
              title="Adicionar Primeiro Produto"
              onPress={addProduct}
              loading={saveOperation.isLoading}
              loadingText="Adicionando..."
              size="large"
              style={{ marginTop: 16 }}
            />
          }
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{ paddingVertical: 8 }}
          refreshing={loadOperation.isLoading}
          onRefresh={refreshProducts}
          ListHeaderComponent={
            <ThemedView style={{ padding: 16, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 14, color: '#6B7280' }}>
                {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
              </ThemedText>
            </ThemedView>
          }
        />
      )}

      {/* Botão flutuante para adicionar (opcional) */}
      {products.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
        }}>
          <SmartButton
            title=""
            onPress={addProduct}
            loading={saveOperation.isLoading}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              paddingHorizontal: 0,
              paddingVertical: 0,
            }}
            textStyle={{ fontSize: 24 }}
          >
            <Plus size={24} color="white" />
          </SmartButton>
        </View>
      )}
    </ThemedView>
  );
};