import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const GUIA = [
  {
    emoji: '\u2795',
    titulo: 'Cadastrar Produtos',
    passos: [
      'Toque no bot\u00e3o azul (+) no canto inferior direito',
      'Escaneie o c\u00f3digo EAN ou digite manualmente',
      'O nome \u00e9 buscado automaticamente na base ANVISA',
      'Preencha validade, quantidade e medida',
      'Toque em \"Gravar no SQLite\"',
    ],
  },
  {
    emoji: '\ud83d\udc46',
    titulo: 'Editar / Excluir',
    passos: [
      'Na lista, deslize o card do produto para a esquerda',
      'Bot\u00e3o azul = Editar | Bot\u00e3o vermelho = Excluir',
      'S\u00f3 um slide pode estar aberto por vez (fecha o anterior)',
    ],
  },
  {
    emoji: '\ud83d\udd0d',
    titulo: 'Filtrar a Lista',
    passos: [
      'Use os chips r\u00e1pidos: Todos, No Prazo, Pr\u00f3ximos, Vencidos',
      'Toque em \"Filtros Avan\u00e7ados\" para filtrar por setor, colaborador ou status',
      'Quando h\u00e1 filtro ativo aparece o bot\u00e3o \u201cLimpar filtros\u201d em vermelho',
    ],
  },
  {
    emoji: '\u2630',
    titulo: 'Menu Lateral',
    passos: [
      'Toque no \u00edcone de loja (canto superior esquerdo)',
      'Resumo do Turno: vis\u00e3o geral de vencimentos pendentes',
      'Confer\u00eancia R\u00e1pida: scan simplificado com checklist',
      'Gr\u00e1fico de Status: distribui\u00e7\u00e3o visual dos vencimentos',
      'Exportar PDF: relat\u00f3rio completo com timestamp',
    ],
  },
  {
    emoji: '\u2699\ufe0f',
    titulo: 'Configura\u00e7\u00f5es',
    passos: [
      'Menu Lateral > Defini\u00e7\u00f5es',
      'Configure loja, regional e nome do colaborador',
      'Personalize os setores dispon\u00edveis no cadastro',
      'Escolha o tema: Sistema, Claro ou Escuro',
      'Importe produtos via planilha CSV / XLSX',
    ],
  },
];

export default function ComoUsarScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>COMO USAR</Text>
          <Text style={styles.headerSub}>FarmaCheck v1.0.2</Text>
        </View>

        {GUIA.map((item) => (
          <View key={item.titulo} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.emoji}\u2002{item.titulo}
            </Text>
            {item.passos.map((passo, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>{passo}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Desenvolvido para auditoria de validade de produtos farmac\u00eauticos.</Text>
          <Text style={styles.footerVersion}>v1.0.2 \u2022 2026</Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  headerBox: {
    backgroundColor: '#1A1C5A',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Fonts.rounded,
  },
  headerSub: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 6 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#1A1C5A', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#565DF0', marginTop: 6, flexShrink: 0 },
  stepText: { flex: 1, color: '#475569', fontSize: 13, fontWeight: '600', lineHeight: 20 },
  footer: { alignItems: 'center', marginTop: 8, gap: 4 },
  footerText: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  footerVersion: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
});
