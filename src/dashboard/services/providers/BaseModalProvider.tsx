import React, {
  ReactNode,
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import ModalFeedback from "../../components/common/ModalFeedback";
import { dashboard } from "@wix/dashboard";
import { useRecoilState } from "recoil";
import { settingsState, statisticsState } from "../../services/state";
import { updateSettings } from "../../services/api/settings";
import { Settings, UpdateSettingDto } from "../../../interfaces";
import { APP_NAME } from "../../../constants";
import ModalPricingPlans from "../../components/common/ModalPricingPlans";

type BaseModalContextType = {
  checkAndOpenWidgetPreview: (previewURL?: string) => void;
  openFeedbackModal: () => void;
  openPricingPlansModal: () => void;
  checkAndDisplayFeedbackModal: (
    time?: number,
    type?: "auto" | "request" | "close"
  ) => void;
};

const BaseModalContext = createContext<BaseModalContextType | undefined>(
  undefined
);

const useModalState = () => {
  const [modalState, setModalState] = useState({
    previewURL: undefined as string | undefined,
    isFeedbackModalOpen: false,
    isPricingPlansModalOpen: false,
  });

  return {
    modalState,
    setModalState,
  };
};

export const BaseModalProvider = ({ children }: { children: ReactNode }) => {
  const { modalState, setModalState } = useModalState();
  const [settings, setSettings] = useRecoilState(settingsState);
  const [stats] = useRecoilState(statisticsState);

  // Function to handle feedback modal display
  const checkAndDisplayFeedbackModal = useCallback(
    (time: number = 10000, type: "auto" | "request" | "close" = "auto") => {
      const sessionKey = generateSessionKey(type);
      const hasAlreadyShown = sessionStorage.getItem(sessionKey);

      const isAskConditionTrue = () => {
        const { isUserReviewed, openedSite } = settings || {};
        if (type === "request") return !isUserReviewed;
        if (type === "close") return openedSite && !isUserReviewed;

        return openedSite && !isUserReviewed;
      };

      if (isAskConditionTrue() && !hasAlreadyShown) {
        setTimeout(() => {
          setModalState((prev) => ({ ...prev, isFeedbackModalOpen: true }));
          sessionStorage.setItem(sessionKey, "true");
        }, time);
      }
    },
    [settings, stats, setModalState]
  );

  // Function to handle widget preview
  const checkAndOpenWidgetPreview = useCallback(
    (previewURL?: string) => {
      if (settings?.openedSite) {
        if (!previewURL) {
          dashboard.showToast({
            message: "Preview URL is missing",
            type: "error",
          });
          return;
        }
        window.open(previewURL, "_blank", "noopener");
        checkAndDisplayFeedbackModal(1000, "request");
        return;
      }
      setModalState((prev) => ({
        ...prev,
        isGuideModalOpen: true,
        guideType: "preview",
        previewURL,
      }));
    },
    [settings, setModalState, checkAndDisplayFeedbackModal]
  );

  // Function to open the feedback modal
  const openFeedbackModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isFeedbackModalOpen: true }));
  }, [setModalState]);

  // Function to open the pricing plans modal
  const openPricingPlansModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isPricingPlansModalOpen: true }));
  }, [setModalState]);

  // Update site settings
  const updateSiteSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      try {
        await updateSettings(newSettings);
        setSettings((prev) => ({ ...prev, ...newSettings }));
      } catch (error) {
        console.error("Failed to update settings", error);
        dashboard.showToast({
          message: "Failed to update settings. Please try again.",
          type: "error",
        });
      }
    },
    [setSettings]
  );

  const contextValue = useMemo(
    () => ({
      openFeedbackModal,
      openPricingPlansModal,
      checkAndOpenWidgetPreview,
      checkAndDisplayFeedbackModal,
    }),
    [
      openFeedbackModal,
      openPricingPlansModal,
      checkAndOpenWidgetPreview,
      checkAndDisplayFeedbackModal,
    ]
  );

  return (
    <BaseModalContext.Provider value={contextValue}>
      {children}
      <ModalFeedback
        isModalOpened={modalState.isFeedbackModalOpen}
        onModalClosed={() =>
          setModalState((prev) => ({ ...prev, isFeedbackModalOpen: false }))
        }
        onUserReviewed={() => {
          updateSiteSettings({ isUserReviewed: true });
        }}
      />
      <ModalPricingPlans
        isModalOpened={modalState.isPricingPlansModalOpen}
        onModalClosed={() =>
          setModalState((prev) => ({ ...prev, isPricingPlansModalOpen: false }))
        }
      />
    </BaseModalContext.Provider>
  );
};

export const useBaseModal = () => {
  const context = useContext(BaseModalContext);
  if (!context) {
    throw new Error("useBaseModal must be used within a BaseModalProvider");
  }
  return context;
};

function generateSessionKey(
  feedbackType: string,
  appName = APP_NAME,
  widgetType = "plugin"
) {
  const convertToCamelCase = (str: string) =>
    str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, "");

  const appNamePrefix = convertToCamelCase(appName);
  const feedbackTypeSuffix =
    feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1);

  return `${appNamePrefix}${widgetType}FeedbackModalShown${feedbackTypeSuffix}`;
}
