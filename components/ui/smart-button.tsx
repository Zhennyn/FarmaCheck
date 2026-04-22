import React from 'react';
import { ActivityIndicator, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';

type SmartButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  style?: ViewStyle;
  textStyle?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
};

export const SmartButton: React.FC<SmartButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  loadingText,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: isDisabled ? 0.6 : 1,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 8;
        break;
      case 'large':
        baseStyle.paddingHorizontal = 24;
        baseStyle.paddingVertical = 16;
        break;
      case 'medium':
      default:
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 12;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = '#F3F4F6';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = '#D1D5DB';
        break;
      case 'danger':
        baseStyle.backgroundColor = isDisabled ? '#FECACA' : '#EF4444';
        break;
      case 'primary':
      default:
        baseStyle.backgroundColor = isDisabled ? '#93C5FD' : '#3B82F6';
        break;
    }

    return { ...baseStyle, ...style };
  };

  const getTextStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = 14;
        break;
      case 'large':
        baseStyle.fontSize = 18;
        break;
      case 'medium':
      default:
        baseStyle.fontSize = 16;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.color = isDisabled ? '#9CA3AF' : '#374151';
        break;
      case 'danger':
        baseStyle.color = 'white';
        break;
      case 'primary':
      default:
        baseStyle.color = 'white';
        break;
    }

    return { ...baseStyle, ...textStyle };
  };

  const displayText = loading && loadingText ? loadingText : title;

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? '#374151' : 'white'}
          style={{ marginRight: 8 }}
        />
      )}
      <ThemedText style={getTextStyle()}>
        {displayText}
      </ThemedText>
    </TouchableOpacity>
  );
};