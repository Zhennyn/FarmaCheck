import type { Produto } from '../../domain/models/product.model';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type SyncResult = {
  status: SyncStatus;
  syncedCount: number;
  errors: string[];
  timestamp: number;
};

export type SyncState = {
  status: SyncStatus;
  lastSync?: SyncResult;
  isOnline: boolean;
};

// Simulação de API - em produção seria uma chamada real para o servidor
const fakeApiSync = async (data: Produto[]): Promise<{ success: boolean; errors: string[] }> => {
  // Simular delay de rede (1-3 segundos)
  const delay = Math.random() * 2000 + 1000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simular falha aleatória (10% de chance)
  if (Math.random() < 0.1) {
    return {
      success: false,
      errors: ['Erro de conexão com o servidor']
    };
  }

  // Simular validação no servidor
  const errors: string[] = [];
  data.forEach((item, index) => {
    // Simular validação: rejeitar produtos com nome muito curto
    if (item.nome.length < 3) {
      errors.push(`Produto ${index + 1}: Nome muito curto`);
    }
    // Simular validação: rejeitar códigos duplicados (simplificado)
    if (item.codigo === 'DUPLICADO') {
      errors.push(`Produto ${index + 1}: Código já existe no servidor`);
    }
  });

  return {
    success: errors.length === 0,
    errors
  };
};

type SyncRepository = {
  findPendingSync: () => Promise<Produto[]>;
  markAsSynced: (id: string) => Promise<void>;
};

export const syncService = (repository: SyncRepository) => {
  let currentSyncState: SyncState = {
    status: 'idle',
    isOnline: true // Simular sempre online para este exemplo
  };

  const getSyncState = (): SyncState => currentSyncState;

  const syncPendingItems = async (maxRetries: number = 3): Promise<SyncResult> => {
    if (currentSyncState.status === 'syncing') {
      return {
        status: 'error',
        syncedCount: 0,
        errors: ['Sincronização já em andamento'],
        timestamp: Date.now()
      };
    }

    currentSyncState.status = 'syncing';

    try {
      // Buscar itens pendentes
      const pendingItems = await repository.findPendingSync();

      if (pendingItems.length === 0) {
        currentSyncState.status = 'success';
        const result: SyncResult = {
          status: 'success',
          syncedCount: 0,
          errors: [],
          timestamp: Date.now()
        };
        currentSyncState.lastSync = result;
        return result;
      }

      let syncedCount = 0;
      const allErrors: string[] = [];

      // Tentar sincronizar com retry
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const apiResult = await fakeApiSync(pendingItems);

          if (apiResult.success) {
            // Sucesso - marcar todos como synced
            for (const item of pendingItems) {
              await repository.markAsSynced(item.id);
              syncedCount++;
            }

            currentSyncState.status = 'success';
            const result: SyncResult = {
              status: 'success',
              syncedCount,
              errors: [],
              timestamp: Date.now()
            };
            currentSyncState.lastSync = result;
            return result;
          } else {
            // Falha na API
            allErrors.push(...apiResult.errors);
            if (attempt === maxRetries) {
              break;
            }
            // Aguardar antes do próximo retry
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        } catch (error) {
          allErrors.push(`Tentativa ${attempt}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          if (attempt === maxRetries) {
            break;
          }
          // Aguardar antes do próximo retry
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      currentSyncState.status = 'error';
      const result: SyncResult = {
        status: 'error',
        syncedCount: 0,
        errors: allErrors,
        timestamp: Date.now()
      };
      currentSyncState.lastSync = result;
      return result;

    } catch (error) {
      currentSyncState.status = 'error';
      const result: SyncResult = {
        status: 'error',
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Erro interno na sincronização'],
        timestamp: Date.now()
      };
      currentSyncState.lastSync = result;
      return result;
    }
  };

  const markAsSynced = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await repository.markAsSynced(id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao marcar como sincronizado'
      };
    }
  };

  const resetSyncState = () => {
    currentSyncState = {
      status: 'idle',
      isOnline: true
    };
  };

  return {
    getSyncState,
    syncPendingItems,
    markAsSynced,
    resetSyncState
  };
};