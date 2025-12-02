import React, { ReactNode, createContext, useContext, useState } from "react";
import {
  Box,
  CustomModalLayout,
  Heading,
  Modal,
  Text,
} from "@wix/design-system";
import {
  InfoCircleFilled,
  PremiumFilled,
  StatusDeniedFilled,
} from "@wix/wix-ui-icons-common";

type Notification = {
  theme?: "premium" | "destructive";
  title: string;
  message: string;

  approveButtonText?: string;
  onApprove?: () => void;
  cancelButtonText?: string;
  onCancel?: () => void;

  isOpen?: boolean;
  borderRadius?: number;
  closeTimeoutMS?: number;
  contentLabel?: string;
  height?: string;
  horizontalPosition?: "start" | "center" | "end";
  maxHeight?: string;
  onAfterClose?: () => void;
  onAfterOpen?: () => void;
  onRequestClose?: () => void;
  overlayPosition?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  screen?: "full" | "desktop" | "mobile";
  scrollable?: boolean;
  scrollableContent?: boolean;
  shouldCloseOnOverlayClick?: boolean;
  shouldDisplayCloseButton?: boolean;
  verticalPosition?: "start" | "center" | "end";
  zIndex?: number;
};

type NotificationContextType = {
  notify: (notification: Notification) => void;
  clearNotification: () => void;
  notification: Notification | null;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const notify = (notification: Notification) => {
    setNotification({
      isOpen: true,
      ...notification,
      theme: notification.theme || undefined,
    });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const getIconByTheme = (theme: Notification["theme"]) => {
    switch (theme) {
      case "premium":
        return <PremiumFilled size={32} style={{ color: "gold" }} />;
      case "destructive":
        return <StatusDeniedFilled size={32} color="#E62214" />;
      default:
        return <InfoCircleFilled size={32} color="" />;
    }
  };

  const handleApprove = () => {
    notification?.onApprove?.();
    clearNotification();
  };

  const handleCancel = () => {
    notification?.onCancel?.();
    clearNotification();
  };

  return (
    <NotificationContext.Provider
      value={{ notify, clearNotification, notification }}
    >
      {children}
      {notification && (
        <Modal isOpen={notification.isOpen || true} screen="desktop">
          <CustomModalLayout
            {...(notification.theme ? { theme: notification.theme } : {})}
            primaryButtonText={notification.approveButtonText || "Ok"}
            onCloseButtonClick={clearNotification}
            title={
              <Box verticalAlign="middle">
                {getIconByTheme(notification.theme)}
                <Heading size="medium">{notification.title}</Heading>
              </Box>
            }
            content={
              <Text size="small">
                {notification.message || "No content provided"}
              </Text>
            }
            primaryButtonOnClick={handleApprove}
            secondaryButtonText={
              notification.onCancel
                ? notification.cancelButtonText || "Cancel"
                : undefined
            }
            secondaryButtonOnClick={
              notification.onCancel ? handleCancel : undefined
            }
          />
        </Modal>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
