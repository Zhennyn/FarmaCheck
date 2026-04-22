import React from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type LoadingViewProps = {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  fullScreen?: boolean;
};

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = 'Carregando...',
  size = 'large',
  color,
  style,
  fullScreen = false,
}) => {
  const containerStyle: ViewStyle = fullScreen
    ? {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        ...style,
      }
    : {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...style,
      };

  return (
    <ThemedView style={containerStyle}>
      <ActivityIndicator
        size={size}
        color={color}
        style={{ marginBottom: message ? 12 : 0 }}
      />
      {message && (
        <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>
          {message}
        </ThemedText>
      )}
    </ThemedView>
  );
};