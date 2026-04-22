import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Package } from 'lucide-react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type EmptyStateProps = {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhum item encontrado',
  message = 'Adicione seu primeiro item para começar',
  icon,
  action,
  style,
}) => {
  const defaultIcon = (
    <Package size={64} color="#9CA3AF" style={{ marginBottom: 16, opacity: 0.5 }} />
  );

  return (
    <ThemedView
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          minHeight: 200,
        },
        style,
      ]}
    >
      {icon || defaultIcon}

      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: 8,
          color: '#374151',
        }}
      >
        {title}
      </ThemedText>

      <ThemedText
        style={{
          fontSize: 14,
          textAlign: 'center',
          color: '#6B7280',
          marginBottom: action ? 24 : 0,
          lineHeight: 20,
        }}
      >
        {message}
      </ThemedText>

      {action && (
        <View style={{ marginTop: 8 }}>
          {action}
        </View>
      )}
    </ThemedView>
  );
};