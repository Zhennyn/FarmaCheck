import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';

export const LANGUAGE_STORAGE_KEY = '@app_language';
export const DEFAULT_LANGUAGE = 'pt-BR' as const;
export const SUPPORTED_LANGUAGES = ['pt-BR'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type TranslationKey = keyof typeof ptBR;

const normalizeLanguage = (value?: string | null): SupportedLanguage => {
  if (!value) return DEFAULT_LANGUAGE;
  return 'pt-BR';
};

const detector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored) {
        callback(normalizeLanguage(stored));
        return;
      }

      const deviceLanguage = getLocales()[0]?.languageTag;
      callback(normalizeLanguage(deviceLanguage));
    } catch {
      callback(DEFAULT_LANGUAGE);
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(lang));
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(detector)
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      resources: {
        'pt-BR': { translation: ptBR },
      },
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export const changeAppLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export default i18n;
