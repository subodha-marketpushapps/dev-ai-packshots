import React, { useState, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WixDesignSystemProvider } from "@wix/design-system";
import { RecoilRoot } from "recoil";

import { i18n as i18nEssentials } from "@wix/essentials";
import {
  _DEV,
  APP_NAME,
  INTERCOM_APP_ID,
  LOGROCKET_APP_ID,
  APP_VERSION,
} from "../constants";

import { BaseModalProvider } from "./services/providers/BaseModalProvider";
import { PhotoStudioProvider } from "./services/providers/PhotoStudioProvider";
import StatusToastProvider from "./services/providers/StatusToastProvider";
import DebugObserver from "./services/state/debug-observer";

import { IntercomProvider } from "react-use-intercom";
import LogRocket from "logrocket";
import i18n, { waitForI18n, isI18nReady } from "../i18n";

const queryClient = new QueryClient();

// Initialize LogRocket
if (_DEV === false && LOGROCKET_APP_ID) {
  LogRocket.init(LOGROCKET_APP_ID);
}

export function withProviders<P extends {} = {}>(Component: React.FC<P>) {
  console.log(`[${APP_NAME}] App version: v${APP_VERSION}`);
  return function DashboardProviders(props: P) {
    const locale = i18nEssentials.getLocale();
    const [i18nReady, setI18nReady] = useState(isI18nReady());

    useEffect(() => {
      // Wait for i18n to be fully ready (initialized + namespace loaded)
      waitForI18n()
        .then(() => {
          setI18nReady(true);
        })
        .catch((err) => {
          console.error("Failed to initialize i18n:", err);
          // Still set ready to prevent blocking the app
          setI18nReady(true);
        });

      // Also listen for events as backup
      const handleInitialized = () => {
        waitForI18n().then(() => setI18nReady(true));
      };
      const handleLoaded = () => {
        if (isI18nReady()) {
          setI18nReady(true);
        }
      };
      const handleFailed = (lng: string, ns: string, msg: string) => {
        console.warn("i18n initialization failed", { lng, ns, msg });
        // Still mark as ready to prevent blocking
        setI18nReady(true);
      };

      i18n.on("initialized", handleInitialized);
      i18n.on("loaded", handleLoaded);
      i18n.on("failedLoading", handleFailed);

      return () => {
        i18n.off("initialized", handleInitialized);
        i18n.off("loaded", handleLoaded);
        i18n.off("failedLoading", handleFailed);
      };
    }, []);

    useEffect(() => {
      if (!i18nReady) return;

      // Set language after i18n is ready
      const normalizedLocale = locale?.split('-')[0]?.toLowerCase() || 'en';
      if (i18n.language !== normalizedLocale) {
        i18n.changeLanguage(normalizedLocale);
      }
    }, [i18nReady, locale]);
    // Don't render until i18n is ready to prevent translation errors
    if (!i18nReady) {
      return null; // or a loading spinner
    }

    return (
      <WixDesignSystemProvider
        locale={locale}
        features={{ newColorsBranding: true }}
      >
        <RecoilRoot>
          {_DEV && <DebugObserver />}
          <IntercomProvider appId={INTERCOM_APP_ID}>
            <BaseModalProvider>
              <StatusToastProvider>
                <QueryClientProvider client={queryClient}>
                  <PhotoStudioProvider>
                    <Component {...props} />
                  </PhotoStudioProvider>
                </QueryClientProvider>
              </StatusToastProvider>
            </BaseModalProvider>
          </IntercomProvider>
        </RecoilRoot>
      </WixDesignSystemProvider>
    );
  };
}
