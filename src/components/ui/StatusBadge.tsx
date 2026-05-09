/**
 * StatusBadge
 * Componente reutilizável de badge de status para os cards de produto.
 * Exibe um pill colorido com rótulo conforme o status de validade.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type BadgeVariant = 'ok' | 'markdown' | 'retirar' | 'vencido' | 'low_stock';

type BadgeConfig = {
  label: string;
  bg: string;
  border: string;
  color: string;
};

const BADGE_CONFIG: Record<BadgeVariant, BadgeConfig> = {
  ok: {
    label: 'Dentro do prazo',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    color: '#10B981',
  },
  markdown: {
    label: 'Atenção',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    color: '#F59E0B',
  },
  retirar: {
    label: 'Estoque baixo',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
    color: '#F97316',
  },
  vencido: {
    label: 'Vencido',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    color: '#EF4444',
  },
  low_stock: {
    label: 'Estoque baixo',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
    color: '#F97316',
  },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  /** Rótulo customizado (opcional — usa o padrão do variant se omitido) */
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label }) => {
  const config = BADGE_CONFIG[variant] ?? BADGE_CONFIG.ok;
  const displayLabel = label ?? config.label;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
