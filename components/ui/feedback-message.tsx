import React, { useEffect, useState } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { Check, X, AlertTriangle } from 'lucide-react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

type FeedbackMessageProps = {
  type: FeedbackType;
  message: string;
  duration?: number;
  onDismiss?: () => void;
  style?: ViewStyle;
};

export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  type,
  message,
  duration = 3000,
  onDismiss,
  style,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss após duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: <Check size={20} color="white" />,
          textColor: 'white',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: <X size={20} color="white" />,
          textColor: 'white',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: <AlertTriangle size={20} color="white" />,
          textColor: 'white',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#3B82F6',
          icon: <AlertTriangle size={20} color="white" />,
          textColor: 'white',
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: config.backgroundColor,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          marginHorizontal: 16,
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
    >
      {config.icon}
      <ThemedText
        style={{
          color: config.textColor,
          fontSize: 14,
          fontWeight: '500',
          marginLeft: 8,
          flex: 1,
        }}
      >
        {message}
      </ThemedText>
    </Animated.View>
  );
};

// Hook para gerenciar feedback messages
export const useFeedback = () => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: FeedbackType;
    message: string;
    duration?: number;
  }>>([]);

  const showFeedback = (
    type: FeedbackType,
    message: string,
    duration = 3000
  ) => {
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, type, message, duration }]);
  };

  const dismissMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const success = (message: string, duration?: number) =>
    showFeedback('success', message, duration);

  const error = (message: string, duration?: number) =>
    showFeedback('error', message, duration);

  const warning = (message: string, duration?: number) =>
    showFeedback('warning', message, duration);

  const info = (message: string, duration?: number) =>
    showFeedback('info', message, duration);

  return {
    messages,
    showFeedback,
    dismissMessage,
    success,
    error,
    warning,
    info,
  };
};

// Componente container para renderizar messages
export const FeedbackContainer: React.FC<{
  feedback: ReturnType<typeof useFeedback>;
}> = ({ feedback }) => {
  if (feedback.messages.length === 0) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
      {feedback.messages.map(msg => (
        <FeedbackMessage
          key={msg.id}
          type={msg.type}
          message={msg.message}
          duration={msg.duration}
          onDismiss={() => feedback.dismissMessage(msg.id)}
        />
      ))}
    </View>
  );
};