import React from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import type { SyncState } from '../../src/modules/inventory/application/services/sync.service';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type SyncButtonProps = {
  syncState: SyncState;
  onSyncPress: () => void;
  disabled?: boolean;
};

export const SyncButton: React.FC<SyncButtonProps> = ({
  syncState,
  onSyncPress,
  disabled = false
}) => {
  const getButtonText = () => {
    switch (syncState.status) {
      case 'idle':
        return 'Sincronizar Dados';
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronizado ✓';
      case 'error':
        return 'Erro na Sincronização ⚠️';
      default:
        return 'Sincronizar Dados';
    }
  };

  const getButtonColor = () => {
    switch (syncState.status) {
      case 'success':
        return '#10B981'; // green
      case 'error':
        return '#EF4444'; // red
      default:
        return '#3B82F6'; // blue
    }
  };

  const handlePress = () => {
    if (syncState.status === 'syncing') return;

    if (syncState.status === 'error' && syncState.lastSync?.errors.length) {
      // Mostrar erros detalhados
      Alert.alert(
        'Erro na Sincronização',
        syncState.lastSync.errors.join('\n'),
        [
          { text: 'Tentar Novamente', onPress: onSyncPress },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } else {
      onSyncPress();
    }
  };

  const isLoading = syncState.status === 'syncing';

  return (
    <ThemedView style={{ padding: 16 }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isLoading}
        style={{
          backgroundColor: getButtonColor(),
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: (disabled || isLoading) ? 0.6 : 1,
        }}
      >
        {isLoading && (
          <ActivityIndicator
            size="small"
            color="white"
            style={{ marginRight: 8 }}
          />
        )}
        <ThemedText
          style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 16,
          }}
        >
          {getButtonText()}
        </ThemedText>
      </TouchableOpacity>

      {syncState.lastSync && (
        <View style={{ marginTop: 8 }}>
          <ThemedText style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
            Última sync: {new Date(syncState.lastSync.timestamp).toLocaleString()}
          </ThemedText>
          {syncState.lastSync.syncedCount > 0 && (
            <ThemedText style={{ fontSize: 12, color: '#10B981', textAlign: 'center' }}>
              {syncState.lastSync.syncedCount} itens sincronizados
            </ThemedText>
          )}
        </View>
      )}
    </ThemedView>
  );
};