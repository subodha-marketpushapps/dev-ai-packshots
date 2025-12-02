import React, { useCallback } from "react";
import StudioModalBase from "./StudioModalBase";
import {
  Box,
  Heading,
  Divider,
  Text,
  Button,
  TextButton,
  Image,
  IconButton,
  SectionHeader,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import {
  ALL_PRICING_PLANS,
  ENTERPRISE_PLAN_NAMES,
} from "../../../../constants/data";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { useIntercom } from "react-use-intercom";
import PricingPlanCard from "../../../components/common/ModalPricingPlans/PricingPlanCard";
import { openWixUpgradePage } from "../../../utils/open-wix-page";
import { useRecoilState, useRecoilValue } from "recoil";
import { wixSiteDataState } from "../../../services/state";

// import ImageEnhancedPhoto from "../../../../assets/images/image_modal-upgrade-packshot.png";

const ModalRequestUpgrade: React.FC = () => {
  const { hideUpgradeModal, subscription, isUpgradeModalOpen } =
    usePhotoStudio();
  const { showNewMessage } = useIntercom();
  const { instanceId } = useRecoilValue(wixSiteDataState);

  const handleOnClose = useCallback(() => {
    hideUpgradeModal();
  }, [hideUpgradeModal]);

  const openIntercomWithContent = useCallback(
    (message: string | undefined) => showNewMessage(message),
    [showNewMessage]
  );

  const handleContactClick = useCallback(
    (planName: string) => {
      openIntercomWithContent(
        `Hi, I am interested in the ${planName} plan. Can you help me with this?`
      );
    },
    [openIntercomWithContent]
  );

  const handleOpenWixUpgradePage = useCallback(() => {
    openWixUpgradePage(instanceId);
  }, [instanceId]);

  if (!isUpgradeModalOpen) return null;

  // Only show plans above the user's current plan, but include the current plan as the first card
  const planOrder = ALL_PRICING_PLANS.map((plan) => plan.plan);
  const userPlan = subscription?.plan || "Basic";
  const userPlanIndex = planOrder.indexOf(userPlan);
  const currentPlanObj = ALL_PRICING_PLANS.find(
    (plan) => plan.plan === userPlan
  );
  const availablePlans = ALL_PRICING_PLANS.filter(
    (plan) => planOrder.indexOf(plan.plan) > userPlanIndex
  );
  const plansToShow = [
    ...(currentPlanObj ? [currentPlanObj] : []),
    ...availablePlans,
  ];
  const nextPlan = availablePlans[0]?.plan;

  // Divide plans into regular and enterprise
  const regularPlansToShow = plansToShow.filter(
    (plan) => !ENTERPRISE_PLAN_NAMES.includes(plan.plan)
  );
  const enterprisePlansToShow = ALL_PRICING_PLANS.filter((plan) =>
    ENTERPRISE_PLAN_NAMES.includes(plan.plan)
  );

  const showUpgrade =
    subscription?.creditsAvailable !== undefined &&
    subscription.creditsAvailable <= 3;

  if (!isUpgradeModalOpen) return null;

  return (
    <StudioModalBase isOpen={isUpgradeModalOpen}>
      <Box
        minWidth={600}
        backgroundColor="D80"
        margin="auto"
        width={"100%"}
        borderRadius={8}
        maxWidth={900}
        height={600}
        overflow="hidden"
      >
        <Box width={"50%"} height={600} backgroundColor="D80">
          <Image
            src={
              "https://mkp-prod.nyc3.cdn.digitaloceanspaces.com/ai-packshots/image_modal-upgrade-packshot.png"
            }
            width="100%"
            height="100%"
            borderRadius={0}
          />
        </Box>
        <Box width={"60%"} direction="vertical">
          <Box
            padding={"SP3 SP4"}
            gap="SP3"
            width={"100%"}
            align="space-between"
            position="relative"
          >
            <Box direction="vertical" gap={"2px"}>
              <Heading size="medium">Upgrade Your Plan</Heading>
              <Text secondary>
                {showUpgrade
                  ? "Your balance is too low. Purchase more credits to generate new images."
                  : "Upgrade your plan to get more credits."}
              </Text>
            </Box>
            <Box
              align="right"
              padding={"SP1"}
              position="absolute"
              top={0}
              right={0}
            >
              <IconButton
                onClick={handleOnClose}
                skin="dark"
                priority="tertiary"
              >
                <Icons.Dismiss />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box maxHeight={"100%"} overflowY="auto" direction="vertical">
            <Box
              gap="SP3"
              padding={"SP4"}
              backgroundColor="D70"
              direction="vertical"
            >
              {/* Regular plans */}
              {regularPlansToShow.map((plan) => (
                <PricingPlanCard
                  key={plan.plan}
                  plan={plan}
                  suggested={plan?.plan === nextPlan}
                  isCurrent={plan.plan === userPlan}
                  onUpgradeClick={openWixUpgradePage}
                  onContactClick={handleContactClick}
                />
              ))}
            </Box>

            {/* Enterprise plans section */}
            <SectionHeader title="Enterprise plans" skin="standard" />
            <Box
              gap="SP3"
              padding={"SP4"}
              backgroundColor="D70"
              direction="vertical"
            >
              {enterprisePlansToShow.map((plan) => (
                <PricingPlanCard
                  key={plan.plan}
                  plan={plan}
                  suggested={false}
                  isCurrent={plan.plan === userPlan}
                  onUpgradeClick={openWixUpgradePage}
                  onContactClick={handleContactClick}
                />
              ))}
            </Box>
          </Box>

          <Divider />
          <Box align="space-between" padding={"SP3 SP4"} verticalAlign="middle">
            <TextButton
              size="small"
              onClick={() =>
                openIntercomWithContent(
                  "Hi, I have some questions about pricing."
                )
              }
            >
              Need support?
            </TextButton>
            <Button
              suffixIcon={<Icons.ExternalLink />}
              size="small"
              onClick={handleOpenWixUpgradePage}
            >
              Pricing Plans
            </Button>
          </Box>
        </Box>
      </Box>
    </StudioModalBase>
  );
};

export default ModalRequestUpgrade;
