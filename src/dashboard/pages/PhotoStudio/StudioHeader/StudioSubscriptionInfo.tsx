import React, { useCallback } from "react";
import {
  Box,
  Text,
  Button,
  SkeletonGroup,
  SkeletonRectangle,
  Divider,
} from "@wix/design-system";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import * as Icons from "@wix/wix-ui-icons-common";
import InfoFloatingHelper from "../../../components/common/SubscriptionInfo/InfoFloatingHelper";
import { openWixUpgradePage } from "../../../utils/open-wix-page";
import { useRecoilValue } from "recoil";
import { wixSiteDataState } from "../../../services/state";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";
import { openDashboardPage } from "../../../utils/helpers";

interface StudioSubscriptionInfoProps {
  context?: "modal" | "dashboard";
}

/**
 * StudioSubscriptionInfo
 * Displays current subscription plan and credits in the Studio header.
 * Uses PhotoStudioProvider context for subscription data and upgrade modal.
 */
const StudioSubscriptionInfo: React.FC<StudioSubscriptionInfoProps> = ({
  context = "dashboard",
}) => {
  const { subscription, isUpgradeModalOpen } = usePhotoStudio();
  const { addToast } = useStatusToast();

  const { instanceId } = useRecoilValue(wixSiteDataState);

  const handleOpenWixUpgradePage = useCallback(() => {
    openWixUpgradePage(instanceId);
  }, [instanceId]);

  const handleOpenDashboard = useCallback(async () => {
    try {
      await openDashboardPage();
    } catch (error) {
      addToast({
        content:
          error instanceof Error
            ? error.message
            : "Failed to open the AI Product Images Dashboard. Please try again later.",
        status: "error",
      });
    }
  }, [addToast]);

  // Early returns for loading/error states
  if (subscription === undefined) {
    return (
      <SkeletonGroup skin="light">
        <SkeletonRectangle height="36px" width="180px" />
      </SkeletonGroup>
    );
  }
  if (subscription === null) {
    return (
      <Box
        backgroundColor="R60"
        borderRadius={8}
        height={"36px"}
        verticalAlign="middle"
        padding="0 SP2"
      >
        <Text size="small">Subscription unavailable</Text>
      </Box>
    );
  }

  // Derived values
  const showUpgrade = subscription.creditsAvailable <= 3;
  const mustUpgrade = subscription.creditsAvailable <= 0;

  return (
    <Box
      borderRadius={8}
      gap={1}
      verticalAlign="middle"
      padding="6px 12px 6px 8px"
      direction="horizontal"
    >
      <Box verticalAlign="middle" direction="horizontal">
        <Box
          verticalAlign="middle"
          direction="horizontal"
          gap="2px"
          color="B10"
        >
          <Icons.SparklesFilled size={16} />
          <Text size="small">{subscription.creditsAvailable} credits</Text>
        </Box>
        <Box color="D10">
          <Icons.CircleSmallFilledSmall />
        </Box>
        <Text size="small">
          {subscription.plan == "Basic" ? "Free" : subscription.plan}
        </Text>
      </Box>

      <Box gap={"SP1"} verticalAlign="middle" direction="horizontal">
        <InfoFloatingHelper
          subscription={subscription}
          onExplorePlans={handleOpenWixUpgradePage}
          uiMode="minimal"
          context={context}
        >
          {context === "modal" && (
            <Box direction="vertical" marginTop={2} gap={3}>
              <Divider />

              <Box gap={2} direction="vertical">
                <Text size="tiny">
                  Open the AI Product Images Dashboard & easily generate images
                  across all your products.
                </Text>
                <Box>
                  <Button
                    suffixIcon={<Icons.ExternalLink />}
                    onClick={handleOpenDashboard}
                    size="tiny"
                  >
                    Go to Dashboard
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </InfoFloatingHelper>
        {showUpgrade && (
          <Button
            size="tiny"
            skin="premium"
            priority={mustUpgrade ? "primary" : "secondary"}
            onClick={handleOpenWixUpgradePage}
            disabled={isUpgradeModalOpen}
          >
            Upgrade
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default StudioSubscriptionInfo;
