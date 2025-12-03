import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Locize from 'i18next-locize-backend';
import { LOCIZE_PROJECT_ID, LOCIZE_API_KEY, LOCIZE_VERSION, _DEV } from './constants';
import csTranslations from './locales/cs.json';
import daTranslations from './locales/da.json';
import deTranslations from './locales/de.json';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import idTranslations from './locales/id.json';
import itTranslations from './locales/it.json';
import jaTranslations from './locales/ja.json';
import koTranslations from './locales/ko.json';
import nbTranslations from './locales/nb.json';
import nlTranslations from './locales/nl.json';
import plTranslations from './locales/pl.json';
import ptTranslations from './locales/pt.json';
import ruTranslations from './locales/ru.json';
import svTranslations from './locales/sv.json';
import thTranslations from './locales/th.json';
import trTranslations from './locales/tr.json';
import ukTranslations from './locales/uk.json';
import viTranslations from './locales/vi.json';
import zhTranslations from './locales/zh.json';

i18n
  // Load translations from Locize
  .use(Locize)
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: 'en',
    // Default namespace
    defaultNS: 'translation',
    // Load multiple namespaces if needed
    ns: ['translation'],
    // Preload all namespaces
    load: 'languageOnly', // or 'all' to load all languages

    // Local resources as fallback
    resources: {
      cs: {
        translation: csTranslations,
      },
      da: {
        translation: daTranslations,
      },
      de: {
        translation: deTranslations,
      },
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
      fr: {
        translation: frTranslations,
      },
      id: {
        translation: idTranslations,
      },
      it: {
        translation: itTranslations,
      },
      ja: {
        translation: jaTranslations,
      },
      ko: {
        translation: koTranslations,
      },
      nb: {
        translation: nbTranslations,
      },
      nl: {
        translation: nlTranslations,
      },
      pl: {
        translation: plTranslations,
      },
      pt: {
        translation: ptTranslations,
      },
      ru: {
        translation: ruTranslations,
      },
      sv: {
        translation: svTranslations,
      },
      th: {
        translation: thTranslations,
      },
      tr: {
        translation: trTranslations,
      },
      uk: {
        translation: ukTranslations,
      },
      vi: {
        translation: viTranslations,
      },
      zh: {
        translation: zhTranslations,
      },
    },

    // Locize backend configuration
    backend: {
      projectId: LOCIZE_PROJECT_ID,
      apiKey: LOCIZE_API_KEY,
      referenceLng: 'en',
      version: LOCIZE_VERSION,
      reloadInterval: 60 * 1000, // 60 seconds (minimum recommended value)
    },

    // Automatically save missing keys to Locize
    saveMissing: true,
    // Update existing keys if they change
    updateMissing: true,

    // Language detection options
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
    },

    // React i18next options
    react: {
      useSuspense: false, // Set to true if you want to use Suspense
    },

    // Debug mode (only in development)
    debug: _DEV === true,

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

