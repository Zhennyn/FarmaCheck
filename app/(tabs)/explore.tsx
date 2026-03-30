import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { LanguageSwitcher } from '@/src/components/language-switcher';
import { useAppTranslation } from '@/src/hooks/use-app-translation';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ComoUsarScreen() {
  const { t } = useAppTranslation();

  const guide = [
    {
      emoji: '\u2795',
      title: t('explore.guide.register.title'),
      steps: [
        t('explore.guide.register.step1'),
        t('explore.guide.register.step2'),
        t('explore.guide.register.step3'),
        t('explore.guide.register.step4'),
        t('explore.guide.register.step5'),
      ],
    },
    {
      emoji: '\ud83d\udc46',
      title: t('explore.guide.edit.title'),
      steps: [
        t('explore.guide.edit.step1'),
        t('explore.guide.edit.step2'),
        t('explore.guide.edit.step3'),
      ],
    },
    {
      emoji: '\ud83d\udd0d',
      title: t('explore.guide.filters.title'),
      steps: [
        t('explore.guide.filters.step1'),
        t('explore.guide.filters.step2'),
        t('explore.guide.filters.step3'),
      ],
    },
    {
      emoji: '\u2630',
      title: t('explore.guide.sidebar.title'),
      steps: [
        t('explore.guide.sidebar.step1'),
        t('explore.guide.sidebar.step2'),
        t('explore.guide.sidebar.step3'),
        t('explore.guide.sidebar.step4'),
        t('explore.guide.sidebar.step5'),
      ],
    },
    {
      emoji: '\u2699\ufe0f',
      title: t('explore.guide.settings.title'),
      steps: [
        t('explore.guide.settings.step1'),
        t('explore.guide.settings.step2'),
        t('explore.guide.settings.step3'),
        t('explore.guide.settings.step4'),
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.languageCard}>
          <LanguageSwitcher />
        </View>

        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>{t('explore.header_title')}</Text>
          <Text style={styles.headerSub}>{t('explore.header_subtitle', { version: '1.0.4' })}</Text>
        </View>

        {guide.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.emoji}\u2002{item.title}
            </Text>
            {item.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('explore.footer.description')}</Text>
          <Text style={styles.footerVersion}>{t('explore.footer.version', { version: '1.0.4', year: '2026' })}</Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  languageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
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
  headerSub: { color: '#94A3B8', fontSize: 16, fontWeight: '600', marginTop: 6 },
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
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1A1C5A', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#565DF0', marginTop: 6, flexShrink: 0 },
  stepText: { flex: 1, color: '#475569', fontSize: 16, fontWeight: '600', lineHeight: 24 },
  footer: { alignItems: 'center', marginTop: 8, gap: 4 },
  footerText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  footerVersion: { color: '#CBD5E1', fontSize: 13, fontWeight: '700' },
});
