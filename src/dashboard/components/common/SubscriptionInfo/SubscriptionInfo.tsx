import React, { useCallback } from "react";
import {
  Box,
  Text,
  Button,
  Divider,
  SkeletonRectangle,
  SkeletonGroup,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useTranslation } from "react-i18next";
import InfoFloatingHelper from "./InfoFloatingHelper";
import { useRecoilValue } from "recoil";
import { subscriptionState } from "../../../services/state/subscriptionState";
import { wixSiteDataState } from "../../../services/state";
import { openWixUpgradePage } from "../../../utils/open-wix-page";

// Use inline type for subscription to avoid import errors
interface SubscriptionInfoPanelProps {
  subscription: {
    plan: string;
    creditsAvailable: number;
    creditsResetAt: number; // changed from string to number
  };
  onExplorePlans: () => void;
}

/**
 * StudioSubscriptionInfo
 * Displays current subscription plan and credits in the Studio header.
 * Uses PhotoStudioProvider context for subscription data and upgrade modal.
 */
const StudioSubscriptionInfo: React.FC = () => {
  const { t } = useTranslation();
  const subscription = useRecoilValue(subscriptionState);
  const { instanceId } = useRecoilValue(wixSiteDataState);

  const handleOpenWixUpgradePage = useCallback(() => {
    openWixUpgradePage(instanceId);
  }, [instanceId]);

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
        <Text size="small">{t('subscriptionInfo.subscriptionUnavailable', {defaultValue: "Subscription unavailable"})}</Text>
      </Box>
    );
  }

  // Derived values
  const showUpgrade = subscription.creditsAvailable <= 3;
  const mustUpgrade = subscription.creditsAvailable <= 0;

  return (
    <Box
      borderRadius={8}
      verticalAlign="middle"
      direction="horizontal"
      backgroundColor="D80"
      height={"36px"}
    >
      <Box
        verticalAlign="middle"
        direction="horizontal"
        padding="6px 12px 6px 8px"
      >
        <Box
          verticalAlign="middle"
          direction="horizontal"
          gap="2px"
          color="B10"
        >
          <Icons.SparklesFilled size={16} />
          <Text size="small">{subscription.creditsAvailable} {t('subscriptionInfo.credits', {defaultValue: "credits"})}</Text>
        </Box>
        <Box color="D10">
          <Icons.CircleSmallFilledSmall />
        </Box>
        <Text size="small">
          {subscription.plan == "Basic" ? t('subscriptionInfo.free', {defaultValue: "Free"}) : subscription.plan}
        </Text>
        {showUpgrade && (
          <Box
            padding={"0 0 0 SP2"}
            verticalAlign="middle"
            direction="horizontal"
          >
            <Button
              size="tiny"
              skin="premium"
              priority={mustUpgrade ? "primary" : "secondary"}
              onClick={handleOpenWixUpgradePage}
            >
              {t('subscriptionInfo.upgrade', {defaultValue: "Upgrade"})}
            </Button>
          </Box>
        )}
      </Box>
      <Divider direction="vertical" />
      <InfoFloatingHelper
        subscription={subscription}
        onExplorePlans={handleOpenWixUpgradePage}
      />
    </Box>
  );
};

export default StudioSubscriptionInfo;
