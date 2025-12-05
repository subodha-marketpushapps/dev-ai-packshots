import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LocizeBackend from 'i18next-locize-backend';
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

// Supported languages (available in both Locize and local resources)
const SUPPORTED_LANGUAGES = [
  'cs', 'da', 'de', 'en', 'es', 'fr', 'id', 'it', 'ja', 'ko',
  'nb', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'uk', 'vi', 'zh'
] as const;

// Local resources as fallback (fills gaps in Locize translations)
const localResources: Record<string, typeof enTranslations> = {
  cs: csTranslations,
  da: daTranslations,
  de: deTranslations,
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  id: idTranslations,
  it: itTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  nb: nbTranslations,
  nl: nlTranslations,
  pl: plTranslations,
  pt: ptTranslations,
  ru: ruTranslations,
  sv: svTranslations,
  th: thTranslations,
  tr: trTranslations,
  uk: ukTranslations,
  vi: viTranslations,
  zh: zhTranslations,
};

// Validate and normalize language code
const normalizeLanguage = (lng: string | string[]): string => {
  const language = Array.isArray(lng) ? lng[0] : lng;
  if (!language) return 'en';
  
  const baseLang = language.split('-')[0].toLowerCase();
  
  // Check if it's a supported language
  if (SUPPORTED_LANGUAGES.includes(baseLang as typeof SUPPORTED_LANGUAGES[number])) {
    return baseLang;
  }
  
  // Filter out invalid codes like 'dev', 'test', etc.
  if (baseLang.length !== 2 || !/^[a-z]{2}$/.test(baseLang)) {
    if (_DEV) {
      console.warn(`[i18n] Invalid language code "${language}", falling back to "en"`);
    }
    return 'en';
  }
  
  return 'en';
};

// Consolidated function to ensure local resources are available for a language
// Uses i18next's built-in merging with overwrite: false to let Locize override local
const ensureLocalResources = (lng: string): void => {
  const normalizedLng = normalizeLanguage(lng);
  const resource = localResources[normalizedLng];
  
  if (resource) {
    // Add with overwrite: false - Locize keys take precedence, local fills gaps
    i18n.addResourceBundle(normalizedLng, 'translation', resource, true, false);
    if (_DEV) {
      console.log(`[i18n] Ensured local resources for ${normalizedLng}`);
    }
  }
};

// Track loaded languages from Locize
const loadedFromBackend = new Set<string>();
let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
let isNamespaceLoaded = false;

// Initialize i18n
const initPromise = i18n
  .use(LocizeBackend)
  .use(initReactI18next)
  .init({
    defaultNS: 'translation',
    ns: ['translation'],
    load: 'languageOnly',
    partialBundledLanguages: true, // Enable merging Locize with local fallbacks

    backend: {
      projectId: LOCIZE_PROJECT_ID,
      apiKey: LOCIZE_API_KEY,
      version: LOCIZE_VERSION,
      reloadInterval: 60 * 1000,
      allowMultiLoading: false,
      ...(_DEV && { 
        caches: [],
        expirationTime: 0 
      }),
    },

    // Custom fallback: current language's local resources, then English
    fallbackLng: (code: string) => {
      const normalizedCode = normalizeLanguage(code);
      if (normalizedCode !== 'en' && localResources[normalizedCode]) {
        return [normalizedCode, 'en'];
      }
      return 'en';
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
      lookupQuerystring: 'lng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      convertDetectedLanguage: (lng: string) => normalizeLanguage(lng),
    },

    react: {
      useSuspense: false,
    },

    debug: _DEV,
    interpolation: {
      escapeValue: false,
    },
  });

// Add initial local resources immediately after init
// This ensures translations are available even if Locize is slow or fails
initPromise.then(() => {
  const detectedLng = i18n.language || 'en';
  const normalizedLng = normalizeLanguage(detectedLng);
  
  // Always add English as base fallback
  ensureLocalResources('en');
  
  // Add detected language resources
  if (normalizedLng !== 'en') {
    ensureLocalResources(normalizedLng);
  }
  
  isNamespaceLoaded = true;
  if (_DEV) {
    console.log(`[i18n] Initialized with language "${normalizedLng}", local resources added`);
  }
}).catch((err) => {
  console.error('[i18n] Initialization error:', err);
  // Still add local resources on error
  ensureLocalResources('en');
  ensureLocalResources(i18n.language || 'en');
  isNamespaceLoaded = true;
});

// When Locize loads successfully, ensure local resources are merged
// This fills in any missing keys from Locize
i18n.on('loaded', (loaded: Record<string, Record<string, unknown>>) => {
  Object.keys(loaded).forEach((lng) => {
    loadedFromBackend.add(lng);
    const normalizedLng = normalizeLanguage(lng);
    
    // Re-add local resources to fill gaps (overwrite: false ensures Locize takes precedence)
    ensureLocalResources(normalizedLng);
    
    isNamespaceLoaded = true;
    if (_DEV) {
      console.log(`[i18n] ✓ Loaded ${lng} from Locize, local resources merged`);
    }
  });
});

// When language changes, ensure local resources are available
i18n.on('languageChanged', (lng: string) => {
  const normalizedLng = normalizeLanguage(lng);
  ensureLocalResources(normalizedLng);
  
  // Ensure namespace is loaded
  i18n.loadNamespaces('translation').then(() => {
    isNamespaceLoaded = true;
    if (_DEV) {
      console.log(`[i18n] Language changed to ${lng}, namespace loaded`);
    }
  }).catch((err) => {
    console.error(`[i18n] Failed to load namespace for ${lng}:`, err);
    isNamespaceLoaded = true;
  });
});

// Handle backend load failures
i18n.on('failedLoading', (lng: string, ns: string, msg: string) => {
  if (ns === 'translation') {
    const normalizedLng = normalizeLanguage(lng);
    
    // If invalid language detected, switch to English
    if (normalizedLng !== lng && normalizedLng === 'en') {
      if (_DEV) {
        console.warn(`[i18n] Invalid language "${lng}" detected, switching to "en"`);
      }
      i18n.changeLanguage('en');
      return;
    }
    
    if (_DEV) {
      console.warn(`[i18n] ✗ Failed to load ${normalizedLng} from Locize:`, msg);
    }
    ensureLocalResources(normalizedLng);
    isNamespaceLoaded = true;
  }
});

// Timeout fallback if backend doesn't load in time
fallbackTimeoutId = setTimeout(() => {
  const currentLng = i18n.language || 'en';
  const bundle = i18n.getResourceBundle(currentLng, 'translation');
  const hasTranslations = bundle && Object.keys(bundle).length > 0;
  
  if (!hasTranslations && !loadedFromBackend.has(currentLng)) {
    if (_DEV) {
      console.warn(`[i18n] ⏱ Backend timeout - using local fallback for ${currentLng}`);
    }
    ensureLocalResources(currentLng);
    isNamespaceLoaded = true;
  }
}, 10000); // 10 seconds

// Clean up timeout and validate language on initialization
i18n.on('initialized', async () => {
  if (fallbackTimeoutId) {
    clearTimeout(fallbackTimeoutId);
    fallbackTimeoutId = null;
  }
  
  const currentLng = i18n.language;
  const normalizedLng = normalizeLanguage(currentLng);
  
  // Correct invalid language
  if (normalizedLng !== currentLng) {
    if (_DEV) {
      console.warn(`[i18n] Correcting invalid language "${currentLng}" to "${normalizedLng}"`);
    }
    await i18n.changeLanguage(normalizedLng);
  }
  
  // Ensure local resources are available
  ensureLocalResources(normalizedLng);
  
  // Ensure namespace is loaded
  try {
    await i18n.loadNamespaces('translation');
    isNamespaceLoaded = true;
    if (_DEV) {
      console.log(`[i18n] Initialized with language "${normalizedLng}", ready`);
    }
  } catch (err) {
    console.error('[i18n] Failed to load namespace:', err);
    isNamespaceLoaded = true;
  }
});

// Export helper to check if i18n is ready
export const isI18nReady = (): boolean => {
  return i18n.isInitialized && isNamespaceLoaded;
};

// Export promise that resolves when i18n is fully ready
export const waitForI18n = async (): Promise<void> => {
  if (isI18nReady()) {
    return;
  }
  
  // Wait for initialization
  if (!i18n.isInitialized) {
    await initPromise;
  }
  
  // Wait for namespace to load
  if (!isNamespaceLoaded) {
    await i18n.loadNamespaces('translation');
    isNamespaceLoaded = true;
  }
};

export default i18n;
