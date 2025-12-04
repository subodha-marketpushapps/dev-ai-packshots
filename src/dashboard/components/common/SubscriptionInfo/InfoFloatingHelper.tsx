import React, { useCallback, useState } from "react";
import {
  Box,
  FloatingHelper,
  Text,
  Heading,
  IconButton,
  Tooltip,
  TextButton,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useTranslation } from "react-i18next";
import { ALL_PRICING_PLANS } from "../../../../constants";

export interface SubscriptionInfoPanelProps {
  subscription: {
    plan: string;
    creditsAvailable: number;
    creditsResetAt: number;
  };
  onExplorePlans: () => void;
  context?: "modal" | "dashboard";
  children?: React.ReactNode;
}

const SubscriptionInfoPanel: React.FC<SubscriptionInfoPanelProps> = React.memo(
  ({ subscription, onExplorePlans, context = "dashboard", children }) => {
    const { t } = useTranslation();
    const currentPricingPlan = ALL_PRICING_PLANS.find(
      (plan) => plan.plan === subscription.plan
    );
    const totalCredits = currentPricingPlan?.credits_per_month || 0;

    return (
      <Box borderRadius={8} gap={"SP2"} direction="vertical">
        <Heading size="small">
          {context === "modal"
            ? t('subscriptionInfo.aiProductImagesSubscription', {defaultValue: "AI Product Images Subscription"})
            : t('subscriptionInfo.subscriptionInfo', {defaultValue: "Subscription Info"})}
        </Heading>
        <Box gap={"SP1"} direction="vertical">
          <Box gap="2px">
            <Box width={"114px"}>
              <Text size="small" weight="normal">
                {t('subscriptionInfo.planName', {defaultValue: "Plan Name"})}
              </Text>
            </Box>
            <Box>
              <Text size="small" secondary>
                {subscription.plan == "Basic" ? t('subscriptionInfo.free', {defaultValue: "Free"}) : subscription.plan}
              </Text>
            </Box>
          </Box>
          <Box gap="2px">
            <Box width={"114px"}>
              <Text size="small" weight="normal">
                {t('subscriptionInfo.creditsAvailable', {defaultValue: "Credits available"})}
              </Text>
            </Box>
            <Box
              color="B10"
              gap={"2px"}
              verticalAlign="middle"
              direction="horizontal"
            >
              <Text size="small" secondary>
                {subscription.creditsAvailable}
              </Text>
              <Text size="tiny" secondary>
                {/* {subscription.pendingCreditDeductions
              ? "(-" + subscription.pendingCreditDeductions + ")"
              : ""} */}
                /{totalCredits}
              </Text>
              <Icons.SparklesFilled size={14} />
            </Box>
          </Box>
          {subscription.plan && subscription.plan !== "Basic" && (
            <Box gap="2px">
              <Box width={"114px"}>
                <Text size="small" weight="normal">
                  {t('subscriptionInfo.creditsReset', {defaultValue: "Credits reset"})}
                </Text>
              </Box>
              <Box gap={"2px"} verticalAlign="middle">
                <Text size="small" secondary maxLines={1} ellipsis>
                  {t('subscriptionInfo.resetsEveryMonth', {defaultValue: "Resets every 1st of the month"})}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
        <Box gap={"SP1"} verticalAlign="middle">
          <Text size="tiny">
            {context === "modal"
              ? t('subscriptionInfo.upgradeAiProductImages', {defaultValue: "Upgrade AI Product Images."})
              : t('subscriptionInfo.upgradeSubtitle', {defaultValue: "Upgrade your plan to get more credits."})}
          </Text>
          <TextButton
            size="tiny"
            onClick={onExplorePlans}
            suffixIcon={<Icons.ExternalLink />}
          >
            {t('subscriptionInfo.explorePlans', {defaultValue: "Explore Plans"})}
          </TextButton>
        </Box>

        {children}
      </Box>
    );
  }
);

interface InfoFloatingHelperProps {
  subscription: SubscriptionInfoPanelProps["subscription"];
  onExplorePlans: () => void;
  uiMode?: "minimal" | "default";
  context?: "modal" | "dashboard";
  children?: React.ReactNode;
}

const InfoFloatingHelper: React.FC<InfoFloatingHelperProps> = ({
  subscription,
  onExplorePlans,
  uiMode = "default",
  context = "dashboard",
  children,
}) => {
  const { t } = useTranslation();
  const [isSubscriptionInfoOpen, setIsSubscriptionInfoOpen] = useState(false);
  // Handlers
  const handleExplorePlans = useCallback(() => {
    onExplorePlans();
    setIsSubscriptionInfoOpen(false);
  }, [onExplorePlans]);

  const handleToggleInfo = useCallback(() => {
    setIsSubscriptionInfoOpen((open) => !open);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setIsSubscriptionInfoOpen(false);
  }, []);

  return (
    <FloatingHelper
      opened={isSubscriptionInfoOpen}
      initiallyOpened={false}
      skin="light"
      target={
        uiMode === "default" ? (
          <Tooltip content={t('subscriptionInfo.subscriptionInfo', {defaultValue: "Subscription Info"})} size="small">
            <Box
              gap={"SP1"}
              verticalAlign="middle"
              direction="horizontal"
              paddingLeft="1px"
              paddingRight="2px"
            >
              <IconButton
                skin="standard"
                priority="tertiary"
                onClick={handleToggleInfo}
                size={"tiny"}
                aria-label={t('subscriptionInfo.showSubscriptionInfo', {defaultValue: "Show Subscription Info"})}
              >
                <Icons.ChevronDown />
              </IconButton>
            </Box>
          </Tooltip>
        ) : (
          <Tooltip content={t('subscriptionInfo.subscriptionInfo', {defaultValue: "Subscription Info"})} size="small">
            <IconButton
              skin="standard"
              priority="tertiary"
              onClick={handleToggleInfo}
              size={"tiny"}
            >
              <Icons.More />
            </IconButton>
          </Tooltip>
        )
      }
      width={394}
      zIndex={999999}
      content={
        <SubscriptionInfoPanel
          subscription={subscription}
          onExplorePlans={handleExplorePlans}
          context={context}
        >
          {children}
        </SubscriptionInfoPanel>
      }
      onClose={handleCloseInfo}
      placement="bottom"
    />
  );
};

export default InfoFloatingHelper;
