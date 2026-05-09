/**
 * ProductListItem
 * Card de produto compacto seguindo o novo design "Produtos" (dark theme).
 * Exibe: ícone, nome + apresentação, tipo, EAN, badge de status,
 * estoque e dias até o vencimento.
 *
 * NÃO altera lógica de negócio — apenas presentação.
 */

import { ChevronRight, Pill, Box, FlaskConical, Wind, Droplet, Droplets, Syringe, Package, Disc } from 'lucide-react-native';
import React, { memo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import type { ProdutoComAnalise } from '../../types/inventory';
import { StatusBadge } from './StatusBadge';
import type { BadgeVariant } from './StatusBadge';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Mapeia o tipo de status para o variant do badge.
 * 'retirar' → 'low_stock' (Estoque baixo) conforme design
 */
const resolveVariant = (tipo: string): BadgeVariant => {
  if (tipo === 'ok') return 'ok';
  if (tipo === 'markdown') return 'markdown';
  if (tipo === 'retirar') return 'retirar';
  if (tipo === 'vencido') return 'vencido';
  return 'ok';
};

/**
 * Escolhe a cor dos dias até o vencimento.
 * ≤30 dias → vermelho/laranja; caso contrário → cinza claro.
 */
const resolveExpiryColor = (dias: number): string => {
  if (dias < 0) return '#EF4444';
  if (dias <= 15) return '#EF4444';
  if (dias <= 30) return '#F97316';
  return '#94A3B8';
};

/**
 * Retorna true quando o vencimento é crítico (ponto vermelho ao lado).
 */
const isCritical = (dias: number): boolean => dias <= 15 && dias >= 0;

/** Formata os dias de forma amigável. */
const formatDias = (dias: number): string => {
  if (dias < 0) return `${Math.abs(dias)} d`;
  if (dias === 0) return 'Hoje';
  return `${dias} d`;
};

/**
 * Emoji/ícone do tipo de produto baseado na apresentação ou unidade de medida.
 * Mantém compatibilidade com os tipos do projeto.
 */
const resolveProductIcon = (
  nome?: string,
  apresentacao?: string,
  unidade?: string,
  isDark: boolean = true
): React.ReactNode => {
  const src = `${nome || ''} ${apresentacao || ''} ${unidade || ''}`.toLowerCase();
  const color = isDark ? '#93C5FD' : '#003e91';
  const size = 22;

  if (src.includes('gotas') || src.includes('gota')) return <Droplets color={color} size={size} />;
  if (src.includes('capsula') || src.includes('cápsula') || src.includes('caps')) return <Pill color={color} size={size} />;
  if (src.includes('comprimido') || src.includes('compr') || src.includes('dragea') || src.includes('drágea')) return <Disc color={color} size={size} />;
  if (src.includes('frasco') || src.includes('ml') || src.includes('xarope') || src.includes('solução') || src.includes('suspensão')) return <FlaskConical color={color} size={size} />;
  if (src.includes('bisnaga') || src.includes('creme') || src.includes('gel') || src.includes('pomada')) return <Droplet color={color} size={size} />;
  if (src.includes('ampola') || src.includes('injetavel') || src.includes('injetável')) return <Syringe color={color} size={size} />;
  if (src.includes('spray') || src.includes('aerosol')) return <Wind color={color} size={size} />;
  if (src.includes('envelope') || src.includes('sachê') || src.includes('caixa')) return <Package color={color} size={size} />;
  return <Box color={color} size={size} />;
};

// ─── Tipos ────────────────────────────────────────────────────────────────

interface ProductListItemProps {
  produto: ProdutoComAnalise;
  onPress: (produto: ProdutoComAnalise) => void;
  isDark?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────

const ProductListItem: React.FC<ProductListItemProps> = ({ produto: p, onPress, isDark = true }) => {
  const variant = resolveVariant(p.statusValidade.tipo);
  const expiryColor = resolveExpiryColor(p.diasAteValidade);
  const critical = isCritical(p.diasAteValidade);
  const iconNode = resolveProductIcon(p.nome, p.apresentacao, p.unidade_medida, isDark);

  // Rótulo do tipo (ex: "Cápsula", "Comprimido")
  const tipoProduto = p.apresentacao
    ? p.apresentacao.split(' ')[0]
    : p.unidade_medida
    ? p.unidade_medida.charAt(0).toUpperCase() + p.unidade_medida.slice(1)
    : 'Produto';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? '#002063' : '#FFFFFF', borderColor: isDark ? 'rgba(25, 25, 46, 0.8)' : 'rgba(0, 32, 99, 0.15)' }]}
      onPress={() => onPress(p)}
      activeOpacity={0.75}>

      {/* Ícone do produto */}
      <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(0, 62, 145, 0.2)' : 'rgba(0, 62, 145, 0.1)', borderColor: isDark ? 'rgba(0, 62, 145, 0.4)' : 'rgba(0, 62, 145, 0.2)' }]}>
        {iconNode}
      </View>

      {/* Informações centrais */}
      <View style={styles.centerInfo}>
        {/* Nome + badge (badge no canto superior direito do bloco central-direito) */}
        <View style={styles.nameRow}>
          <Text style={[styles.prodName, { color: isDark ? '#F1F5F9' : '#041642' }]} numberOfLines={2}>{p.nome || 'Produto Sem Nome'}</Text>
        </View>

        {/* Tipo */}
        <Text style={[styles.prodType, { color: isDark ? '#94A3B8' : '#003e91' }]}>{tipoProduto}</Text>

        {/* EAN */}
        <Text style={[styles.prodEan, { color: isDark ? '#E0E7FF' : '#002063' }]}>EAN: {p.codigo}</Text>
      </View>

      {/* Coluna direita: badge + estoque + vencimento */}
      <View style={styles.rightCol}>
        {/* Badge de status no topo */}
        <StatusBadge variant={variant} label={p.statusValidade.label} />

        {/* Estoque + Vencimento */}
        <View style={styles.metricsRow}>
          {/* Estoque */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Estoque</Text>
            <Text style={[
              styles.metricValue,
              (p.qtd <= 10) && styles.metricValueLow,
            ]}>
              {p.qtd}
            </Text>
          </View>

          {/* Separador */}
          <View style={styles.metricDivider} />

          {/* Vencimento */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Vence em</Text>
            <View style={styles.expiryRow}>
              <Text style={[styles.metricExpiryValue, { color: expiryColor }]}>
                {formatDias(p.diasAteValidade)}
              </Text>
              {critical && (
                <View style={styles.criticalDot} />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Seta de navegação */}
      <ChevronRight size={16} color={isDark ? '#94A3B8' : '#003e91'} style={styles.chevron} />
    </TouchableOpacity>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0600AB',
    borderRadius: 14,
    marginBottom: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(151,125,255,0.3)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },

  // Ícone
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 22,
  },

  // Seção central
  centerInfo: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  prodName: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  prodType: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  prodEan: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },

  // Coluna direita
  rightCol: {
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '55%',
  },

  // Métricas (Estoque + Vencimento)
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metricItem: {
    alignItems: 'center',
    minWidth: 52,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '800',
  },
  metricValueLow: {
    color: '#F97316',
  },
  metricExpiryValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  criticalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },

  // Seta
  chevron: {
    marginLeft: 6,
  },
});

export default memo(ProductListItem);
