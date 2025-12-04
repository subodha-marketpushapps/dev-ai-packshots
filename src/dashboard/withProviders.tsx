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
import i18n from "../i18n";

const queryClient = new QueryClient();

// Initialize LogRocket
if (_DEV === false && LOGROCKET_APP_ID) {
  LogRocket.init(LOGROCKET_APP_ID);
}

export function withProviders<P extends {} = {}>(Component: React.FC<P>) {
  console.log(`[${APP_NAME}] App version: v${APP_VERSION}`);
  return function DashboardProviders(props: P) {
    const locale = i18nEssentials.getLocale();
    const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized);

    useEffect(() => {
      if (i18n.isInitialized) {
        setIsI18nReady(true);
        return;
      }

      const handleInitialized = () => setIsI18nReady(true);
      const handleFailed = (lng: string, ns: string, msg: string) => {
        console.warn("i18n initialization failed", { lng, ns, msg });
        setIsI18nReady(true);
      };

      i18n.on("initialized", handleInitialized);
      i18n.on("failedLoading", handleFailed);

      return () => {
        i18n.off("initialized", handleInitialized);
        i18n.off("failedLoading", handleFailed);
      };
    }, []);

    useEffect(() => {
      if (!isI18nReady) return;

      const userLocale = i18nEssentials.getLanguage();
      i18n.changeLanguage(userLocale);
    }, [isI18nReady]);
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
