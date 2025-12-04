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

// Local resources as fallback (only used if Locize fails)
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
  
  // Extract base language code (e.g., 'en-US' -> 'en')
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
  
  return 'en'; // Default fallback
};

// Helper to add local resource as fallback
const addLocalFallback = (lng: string): void => {
  const resource = localResources[lng];
  if (resource) {
    i18n.addResourceBundle(lng, 'translation', resource, true, false);
    if (_DEV) {
      console.log(`[i18n] Added local fallback for ${lng}`);
    }
  }
};

// Fallback timeout configuration
const FALLBACK_TIMEOUT = 10000; // 10 seconds

// Track loaded languages from Locize
const loadedFromBackend = new Set<string>();
let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
let isNamespaceLoaded = false;

// Initialize i18n with proper async handling
const initPromise = i18n
  .use(LocizeBackend)
  .use(initReactI18next)
  .init({
    defaultNS: 'translation',
    ns: ['translation'],
    load: 'languageOnly',
    partialBundledLanguages: true, // Allow merging Locize with local fallbacks

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

    fallbackLng: 'en',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      // Custom lookup function to filter invalid language codes
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
      lookupQuerystring: 'lng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      // Convert detected language to valid code
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

// Add local resources immediately as safety net (before backend loads)
// This ensures translations are available even if Locize is slow or fails
const addInitialLocalResources = async () => {
  const detectedLng = i18n.language || 'en';
  const normalizedLng = normalizeLanguage(detectedLng);
  
  // Add English as base fallback immediately
  if (normalizedLng !== 'en' && localResources.en) {
    i18n.addResourceBundle('en', 'translation', localResources.en, true, false);
  }
  
  // Add detected language as fallback
  if (localResources[normalizedLng]) {
    i18n.addResourceBundle(normalizedLng, 'translation', localResources[normalizedLng], true, false);
    isNamespaceLoaded = true;
    if (_DEV) {
      console.log(`[i18n] Added initial local resources for ${normalizedLng}`);
    }
  }
};

// Wait for init and add initial resources
initPromise.then(() => {
  addInitialLocalResources();
}).catch((err) => {
  console.error('[i18n] Initialization error:', err);
  addInitialLocalResources(); // Still add local resources on error
});

// Track successful loads from Locize backend
i18n.on('loaded', (loaded: Record<string, Record<string, unknown>>) => {
  Object.keys(loaded).forEach((lng) => {
    loadedFromBackend.add(lng);
    isNamespaceLoaded = true;
    if (_DEV) {
      console.log(`[i18n] ✓ Loaded ${lng} from Locize`);
    }
  });
});

// Track when namespace is ready
i18n.on('languageChanged', (lng: string) => {
  // Ensure namespace is loaded when language changes
  i18n.loadNamespaces('translation').then(() => {
    isNamespaceLoaded = true;
    if (_DEV) {
      console.log(`[i18n] Namespace loaded for ${lng}`);
    }
  }).catch((err) => {
    console.error(`[i18n] Failed to load namespace for ${lng}:`, err);
    // Add local fallback if namespace load fails
    addLocalFallback(normalizeLanguage(lng));
    isNamespaceLoaded = true;
  });
});

// Handle backend load failures - add local fallback immediately
i18n.on('failedLoading', (lng: string, ns: string, msg: string) => {
  if (ns === 'translation') {
    const normalizedLng = normalizeLanguage(lng);
    
    // If invalid language detected, switch to fallback
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
    addLocalFallback(normalizedLng);
  }
});

// Set timeout fallback if backend doesn't load in time
fallbackTimeoutId = setTimeout(() => {
  const currentLng = i18n.language || 'en';
  const bundle = i18n.getResourceBundle(currentLng, 'translation');
  const hasTranslations = bundle && Object.keys(bundle).length > 0;
  
  if (!hasTranslations && !loadedFromBackend.has(currentLng)) {
    if (_DEV) {
      console.warn(`[i18n] ⏱ Backend timeout - using local fallback for ${currentLng}`);
    }
    addLocalFallback(currentLng);
  }
}, FALLBACK_TIMEOUT);

// Clean up timeout on successful initialization
i18n.on('initialized', async () => {
  if (fallbackTimeoutId) {
    clearTimeout(fallbackTimeoutId);
    fallbackTimeoutId = null;
  }
  
  // Validate and fix language after initialization
  const currentLng = i18n.language;
  const normalizedLng = normalizeLanguage(currentLng);
  
  if (normalizedLng !== currentLng) {
    if (_DEV) {
      console.warn(`[i18n] Correcting invalid language "${currentLng}" to "${normalizedLng}"`);
    }
    await i18n.changeLanguage(normalizedLng);
  }
  
  // Ensure namespace is loaded
  try {
    await i18n.loadNamespaces('translation');
    isNamespaceLoaded = true;
    if (_DEV) {
      console.log(`[i18n] Initialized with language "${normalizedLng}" - namespace loaded`);
    }
  } catch (err) {
    console.error('[i18n] Failed to load namespace:', err);
    // Add local fallback
    addLocalFallback(normalizedLng);
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

