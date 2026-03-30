import { StyleSheet, Text, View } from 'react-native';

import { useAppTranslation } from '../hooks/use-app-translation';

export const LanguageSwitcher = () => {
  const { t } = useAppTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('language.title')}</Text>
      <View style={styles.row}>
        <View style={[styles.button, styles.buttonActive]} accessibilityLabel={t('language.pt-BR')}>
          <Text style={[styles.buttonText, styles.buttonTextActive]}>PT-BR</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  buttonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
});
