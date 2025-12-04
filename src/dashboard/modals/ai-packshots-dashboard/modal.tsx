import React, { type FC, useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { WixDesignSystemProvider, Box } from "@wix/design-system";
import "@wix/design-system/styles.global.css";
// import "../../styles/_modal.scss";
import { i18n as i18nEssentials } from "@wix/essentials";
import i18n from "../../../i18n";

import { PhotoStudioProvider } from "../../services/providers/PhotoStudioProvider";
import { RecoilRoot } from "recoil";
import DebugObserver from "../../services/state/debug-observer";
import { IntercomProvider } from "react-use-intercom";
import { BaseModalProvider } from "../../services/providers/BaseModalProvider";
import StatusToastProvider from "../../services/providers/StatusToastProvider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { _DEV, INTERCOM_APP_ID, LOGROCKET_APP_ID } from "../../../constants";
import LogRocket from "logrocket";

import CompactDashboard from './components/CompactDashboard';
import CompactHeader from './components/CompactHeader';

interface ModalParams {
  productId?: string;
  productName?: string;
  [key: string]: any;
}

const queryClient = new QueryClient();

// Initialize LogRocket
if (_DEV === false && LOGROCKET_APP_ID) {
  LogRocket.init(LOGROCKET_APP_ID);
}

const Modal: FC = () => {
  const [modalParams, setModalParams] = useState<ModalParams | null>(null);
  const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized);
  const locale = i18nEssentials.getLocale();

  // Initialize i18n for modal
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

  // Set language when i18n is ready
  useEffect(() => {
    if (!isI18nReady) return;

    const userLocale = i18nEssentials.getLanguage();
    i18n.changeLanguage(userLocale);
  }, [isI18nReady]);

  useEffect(() => {
    // Observe state to receive parameters passed to the modal
    dashboard.observeState((componentParams, environmentState) => {
      setModalParams(componentParams as ModalParams);
    });
  }, []);

  const handleOnRequestClose = () => {
    dashboard.closeModal();
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <RecoilRoot>
        <DebugObserver />
        <IntercomProvider appId={INTERCOM_APP_ID}>
          <BaseModalProvider>
            <StatusToastProvider>
              <QueryClientProvider client={queryClient}>
                <Box
                  height="100vh"
                  width="100vw"
                  gap={0}
                  direction="vertical"
                  backgroundColor="D80"
                  borderRadius={8}
                  position="relative"
                  overflow="hidden"
                >
                  <PhotoStudioProvider
                    photoStudioMode="absolute"
                    showCloseButton={false}
                  >
                    <Box
                      height="100%"
                      width="100%"
                      gap={0}
                      direction="vertical"
                    >
                      <CompactHeader onClose={handleOnRequestClose} />
                      <CompactDashboard />
                    </Box>

                  </PhotoStudioProvider>
                </Box>
              </QueryClientProvider>
            </StatusToastProvider>
          </BaseModalProvider>
        </IntercomProvider>
      </RecoilRoot>
    </WixDesignSystemProvider>
  );
};

export default Modal;
