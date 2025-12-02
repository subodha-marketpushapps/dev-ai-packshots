import React from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WixDesignSystemProvider } from "@wix/design-system";
import { RecoilRoot } from "recoil";

import { i18n } from "@wix/essentials";
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

const queryClient = new QueryClient();

// Initialize LogRocket
if (_DEV === false && LOGROCKET_APP_ID) {
  LogRocket.init(LOGROCKET_APP_ID);
}

export function withProviders<P extends {} = {}>(Component: React.FC<P>) {
  console.log(`[${APP_NAME}] App version: v${APP_VERSION}`);
  return function DashboardProviders(props: P) {
    const locale = i18n.getLocale();
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
