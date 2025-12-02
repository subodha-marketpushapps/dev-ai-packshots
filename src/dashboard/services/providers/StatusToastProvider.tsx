import { StatusToast, ToastContainer, ToastStatus } from "@wix/design-system";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  ReactElement,
} from "react";

// Define the shape of a toast
interface Toast {
  id: string;
  toast: ReactElement;
}

interface ToastProps {
  status: ToastStatus;
  content: string;
  action?: JSX.Element;
  duration?: number;
  customId?: string;
  dismissible?: boolean;
}

// Define the context value type
interface StatusToastContextValue {
  addToast: (toastProps: ToastProps) => string; // Return toast ID for better control
  clearToasts: (id?: string) => void;
  makeId: () => string;
}

const StatusToastContext = createContext<StatusToastContextValue | null>(null);

const StatusToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const makeId = () => Math.random().toString(36).substring(2, 9);

  const clearToasts = (id?: string) => {
    if (id) {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    } else {
      setToasts([]); // Clear all toasts if no ID provided
    }
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const addToast = ({
    status,
    content,
    action,
    duration,
    customId,
    dismissible = true,
  }: ToastProps): string => {
    const toastId = customId ?? makeId();

    const toastElement = (
      <StatusToast
        key={toastId}
        dataHook={toastId}
        status={status}
        dismissible={dismissible}
        dismissLabel="Dismiss"
        onDismiss={() => removeToast(toastId)}
        action={action}
        duration={duration}
      >
        {content}
      </StatusToast>
    );

    setToasts((prevToasts) => [
      ...prevToasts,
      { id: toastId, toast: toastElement },
    ]);

    return toastId; // Return ID for potential manual removal
  };

  const value = useMemo(
    () => ({
      addToast,
      clearToasts,
      makeId,
    }),
    // Only recreate value when these functions change
    [] // Removed 'toasts' from dependencies as it's not needed in the context value
  );

  return (
    <StatusToastContext.Provider value={value}>
      {/* @ts-ignore */}
      <ToastContainer maxToasts={3}>
        {toasts.map(({ id, toast }) => (
          <div key={id}>{toast}</div>
        ))}
      </ToastContainer>
      {children}
    </StatusToastContext.Provider>
  );
};

export const useStatusToast = (): StatusToastContextValue => {
  const context = useContext(StatusToastContext);
  if (!context) {
    throw new Error("useStatusToast must be used within a StatusToastProvider");
  }
  return context;
};

export default StatusToastProvider;
