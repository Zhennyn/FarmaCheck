import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage, TranslationKey } from '../i18n';
import { changeAppLanguage } from '../i18n';

export const useAppTranslation = () => {
  const { i18n, t } = useTranslation();

  const language: SupportedLanguage = 'pt-BR';

  const translate = useCallback(
    (key: TranslationKey, options?: Record<string, unknown>) => String(t(key, options as never)),
    [t]
  );

  const setLanguage = useCallback(
    async (nextLanguage: SupportedLanguage) => {
      if (nextLanguage === language) return;
      await changeAppLanguage(nextLanguage);
    },
    [language]
  );

  return {
    t: translate,
    i18n,
    language,
    setLanguage,
  };
};
