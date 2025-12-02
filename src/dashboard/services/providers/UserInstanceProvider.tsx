import React, { createContext, ReactNode, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useWixData } from "./WixDataProvider";
import { useModalWixData } from "./ModalWixDataProvider";

import {
  EmptyStateError,
  EmptyStateLoading,
} from "../../components/ui/PageLoadingStatus";

const UserInstanceContext = createContext(undefined);

interface UserInstanceProviderProps {
  children: ReactNode;
  context?: "modal" | "page";
}

export const UserInstanceProvider: React.FC<UserInstanceProviderProps> = ({
  children,
  context = "page", // Default to page for backward compatibility
}) => {
  // Get wixSiteData from the appropriate provider based on context
  let wixSiteData = null;

  if (context === "modal") {
    wixSiteData = useModalWixData().wixSiteData;
  } else {
    wixSiteData = useWixData().wixSiteData;
  }

  const { updateInstance } = useSettings();

  // Track mutation state
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  const sendRequest = (instanceId: string) => {
    setIsLoading(true);
    setError(null);
    updateInstance
      .mutateAsync({ instanceId })
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (wixSiteData) {
      const instanceId = wixSiteData.instanceId;
      sendRequest(instanceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wixSiteData]);

  if (isLoading) {
    return <EmptyStateLoading loadingText="" />;
  }

  if (error) {
    return (
      <EmptyStateError
        title="We couldn't update your instance"
        subtitle="Looks like there was a technical issue on our end. Wait a few minutes and try again."
        refreshActions={
          wixSiteData?.instanceId
            ? () => sendRequest(wixSiteData.instanceId)
            : undefined
        }
      />
    );
  }

  return (
    <UserInstanceContext.Provider value={undefined}>
      {children}
    </UserInstanceContext.Provider>
  );
};
