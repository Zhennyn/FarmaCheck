/**
 * Guia de Integração: Melhorando UX no FarmaCheck
 *
 * Este arquivo demonstra como integrar os novos componentes de UX
 * no código existente do FarmaCheck de forma gradual e não invasiva.
 */

import React, { useState, useEffect } from 'react';
import { View, FlatList, Alert, RefreshControl } from 'react-native';
import { Plus, Package } from 'lucide-react-native';

// Novos componentes de UX
import { LoadingView } from '../ui/loading-view';
import { EmptyState } from '../ui/empty-state';
import { SmartButton } from '../ui/smart-button';
import { FeedbackContainer } from '../ui/feedback-message';
import { useAsyncOperation } from '../../hooks/use-async-operation';

// Componentes existentes (themed)
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

// Simulação de dados do FarmaCheck
type Produto = {
  id: string;
  nome: string;
  codigo: string;
  validade: string;
  qtd: number;
  colaborador: string;
};

// Simulação de serviço (substitua pela implementação real)
const mockInventoryService = {
  createProduct: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, data: { ...data, id: Date.now().toString() } };
  },

  listAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      {
        id: '1',
        nome: 'Produto A',
        codigo: 'ABC123',
        validade: '2024-12-31',
        qtd: 10,
        colaborador: 'João',
      },
    ];
  },
};

/**
 * EXEMPLO 1: Tela de Produtos com UX Melhorada
 *
 * Versão melhorada da tela principal de produtos
 */
export const ProductListScreen_Improved: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Hooks para operações assíncronas
  const loadOperation = useAsyncOperation(true);
  const createOperation = useAsyncOperation();

  // Carregar produtos na inicialização
  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    const result = await loadOperation.execute(
      () => mockInventoryService.listAll(),
      {
        successMessage: 'Produtos carregados!',
        errorMessage: 'Erro ao carregar produtos',
        showAlertOnError: true,
      }
    );

    if (result) {
      setProdutos(result);
    }

    setIsInitialLoad(false);
  };

  const adicionarProduto = async () => {
    const novoProduto = {
      nome: 'Novo Produto',
      codigo: `PROD${Date.now()}`,
      validade: '2024-12-31',
      qtd: 1,
      colaborador: 'Usuário',
    };

    const result = await createOperation.execute(
      () => mockInventoryService.createProduct(novoProduto),
      {
        successMessage: 'Produto adicionado com sucesso!',
        errorMessage: 'Erro ao adicionar produto',
      }
    );

    if (result) {
      setProdutos(prev => [...prev, result.data]);
    }
  };

  // Loading inicial
  if (isInitialLoad) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <FeedbackContainer feedback={loadOperation.feedback} />
        <LoadingView
          message="Carregando produtos..."
          fullScreen
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Sistema de notificações */}
      <FeedbackContainer feedback={loadOperation.feedback} />
      <FeedbackContainer feedback={createOperation.feedback} />

      {/* Header */}
      <ThemedView
        style={{
          padding: 16,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>
          Produtos
        </ThemedText>

        <SmartButton
          title="Adicionar"
          onPress={adicionarProduto}
          loading={createOperation.isLoading}
          loadingText="Adicionando..."
          size="small"
        />
      </ThemedView>

      {/* Conteúdo */}
      {produtos.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          message="Adicione seu primeiro produto para começar a gerenciar seu inventário"
          action={
            <SmartButton
              title="Adicionar Primeiro Produto"
              onPress={adicionarProduto}
              loading={createOperation.isLoading}
              loadingText="Adicionando..."
              size="large"
              style={{ marginTop: 16 }}
            />
          }
        />
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
                {item.nome}
              </ThemedText>
              <ThemedText style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                Código: {item.codigo} | Qtd: {item.qtd}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                Validade: {item.validade} | Por: {item.colaborador}
              </ThemedText>
            </ThemedView>
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={loadOperation.isLoading}
              onRefresh={carregarProdutos}
              colors={['#3B82F6']}
            />
          }
          ListHeaderComponent={
            <ThemedView style={{ padding: 16, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 14, color: '#6B7280' }}>
                {produtos.length} produto{produtos.length !== 1 ? 's' : ''} encontrado{produtos.length !== 1 ? 's' : ''}
              </ThemedText>
            </ThemedView>
          }
        />
      )}
    </ThemedView>
  );
};

/**
 * EXEMPLO 2: Modal de Cadastro Melhorado
 *
 * Versão melhorada do modal de cadastro de produtos
 */
export const ProductFormModal_Improved: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (produto: Produto) => void;
}> = ({ visible, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    validade: '',
    qtd: 1,
    colaborador: '',
  });

  const saveOperation = useAsyncOperation();

  const handleSave = async () => {
    // Validações básicas
    if (!formData.nome.trim() || !formData.codigo.trim()) {
      Alert.alert('Erro', 'Nome e código são obrigatórios');
      return;
    }

    const result = await saveOperation.execute(
      async () => {
        const produto = { ...formData, id: Date.now().toString() };
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simular API
        return produto;
      },
      {
        successMessage: 'Produto salvo com sucesso!',
        errorMessage: 'Erro ao salvar produto',
        showAlertOnError: true,
      }
    );

    if (result) {
      onSave(result);
      onClose();
      // Reset form
      setFormData({
        nome: '',
        codigo: '',
        validade: '',
        qtd: 1,
        colaborador: '',
      });
    }
  };

  if (!visible) return null;

  return (
    <ThemedView style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}>
      <FeedbackContainer feedback={saveOperation.feedback} />

      <ThemedView style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 400,
      }}>
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
          Novo Produto
        </ThemedText>

        {/* Form fields aqui (simplificado) */}
        <ThemedText style={{ marginBottom: 20, color: '#6B7280' }}>
          Formulário de produto seria renderizado aqui...
        </ThemedText>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SmartButton
            title="Cancelar"
            onPress={onClose}
            variant="secondary"
            style={{ flex: 1, marginRight: 8 }}
            disabled={saveOperation.isLoading}
          />

          <SmartButton
            title="Salvar"
            onPress={handleSave}
            loading={saveOperation.isLoading}
            loadingText="Salvando..."
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </ThemedView>
    </ThemedView>
  );
};

/**
 * EXEMPLO 3: Hook Personalizado para Operações de Inventário
 *
 * Hook que combina operações comuns com UX melhorada
 */
export const useInventoryWithUX = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const loadOperation = useAsyncOperation();
  const createOperation = useAsyncOperation();
  const updateOperation = useAsyncOperation();
  const deleteOperation = useAsyncOperation();

  const carregarProdutos = () => loadOperation.execute(
    () => mockInventoryService.listAll(),
    { successMessage: 'Produtos atualizados!' }
  ).then(result => {
    if (result) setProdutos(result);
    return result;
  });

  const criarProduto = (data: Omit<Produto, 'id'>) => createOperation.execute(
    () => mockInventoryService.createProduct(data),
    { successMessage: 'Produto criado!' }
  ).then(result => {
    if (result) setProdutos(prev => [...prev, result.data]);
    return result;
  });

  const atualizarProduto = (id: string, data: Partial<Produto>) => updateOperation.execute(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { ...data, id };
    },
    { successMessage: 'Produto atualizado!' }
  );

  const excluirProduto = (id: string) => deleteOperation.execute(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return id;
    },
    {
      successMessage: 'Produto excluído!',
      errorMessage: 'Erro ao excluir produto'
    }
  ).then(result => {
    if (result) setProdutos(prev => prev.filter(p => p.id !== id));
    return result;
  });

  return {
    produtos,
    operations: {
      load: loadOperation,
      create: createOperation,
      update: updateOperation,
      delete: deleteOperation,
    },
    actions: {
      carregarProdutos,
      criarProduto,
      atualizarProduto,
      excluirProduto,
    },
  };
};