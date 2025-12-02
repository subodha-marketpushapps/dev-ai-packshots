import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Locize from 'i18next-locize-backend';
import { LOCIZE_PROJECT_ID, LOCIZE_API_KEY, LOCIZE_VERSION, _DEV } from './constants';

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

