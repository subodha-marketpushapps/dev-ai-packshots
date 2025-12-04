import {
  Box,
  Modal,
  CustomModalLayout,
  SectionHeader,
} from "@wix/design-system";
import React, { useCallback, useState } from "react";
import { useRecoilValue } from "recoil";
import { useIntercom } from "react-use-intercom";
import { useTranslation } from "react-i18next";
import * as Icons from "@wix/wix-ui-icons-common";

import PricingPlanCard from "./PricingPlanCard";
import {
  ALL_PRICING_PLANS,
  ENTERPRISE_PLAN_NAMES,
} from "../../../../constants";
import { subscriptionState } from "../../../services/state/subscriptionState";
import { openWixUpgradePage } from "../../../utils/open-wix-page";
import { wixSiteDataState } from "../../../services/state";

const ModalPricingPlans: React.FC<{
  onModalClosed: () => void;
  isModalOpened: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const subscription = useRecoilValue(subscriptionState);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const { showNewMessage } = useIntercom();
  const { instanceId } = useRecoilValue(wixSiteDataState);

  const openIntercomWithContent = useCallback(
    (message: string | undefined) => showNewMessage(message),
    [showNewMessage]
  );

  const handleContactClick = useCallback(
    (planName: string) => {
      openIntercomWithContent(
        t('modalPricingPlans.contactMessage', {
          defaultValue: "Hi, I am interested in the {{planName}} plan. Can you help me with this?",
          planName
        })
      );
    },
    [openIntercomWithContent, t]
  );

  const handleOpenWixUpgradePage = useCallback(() => {
    openWixUpgradePage(instanceId);
  }, [instanceId]);

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

  const PricingPlanCardsView = () => (
    <Box maxHeight={"100%"} overflowY="auto" direction="vertical">
      {/* Regular plans */}
      <SectionHeader title={t('modalPricingPlans.basicPlans', {defaultValue: "Basic plans"})} skin="standard" />
      <Box gap="SP3" padding={"SP4"} backgroundColor="D70" direction="vertical">
        {regularPlansToShow.map((plan) => (
          <PricingPlanCard
            key={plan.plan}
            plan={plan}
            suggested={plan?.plan === nextPlan}
            isCurrent={plan.plan === userPlan}
            onUpgradeClick={handleOpenWixUpgradePage}
            onContactClick={handleContactClick}
          />
        ))}
      </Box>

      {/* Enterprise plans section */}
      <SectionHeader title={t('modalPricingPlans.enterprisePlans', {defaultValue: "Enterprise plans"})} skin="standard" />
      <Box gap="SP3" padding={"SP4"} backgroundColor="D70" direction="vertical">
        {enterprisePlansToShow.map((plan) => (
          <PricingPlanCard
            key={plan.plan}
            plan={plan}
            suggested={false}
            isCurrent={plan.plan === userPlan}
            onUpgradeClick={handleOpenWixUpgradePage}
            onContactClick={handleContactClick}
          />
        ))}
      </Box>
    </Box>
  );

  return (
    <Modal
      isOpen={props.isModalOpened}
      onRequestClose={props.onModalClosed}
      shouldCloseOnOverlayClick={true}
      zIndex={9999999}
    >
      <CustomModalLayout
        primaryButtonText={t('modalPricingPlans.wixPricingPlans', {defaultValue: "Wix Pricing Plans"})}
        secondaryButtonText={t('modalPricingPlans.needSupport', {defaultValue: "Need support?"})}
        onCloseButtonClick={props.onModalClosed}
        primaryButtonOnClick={handleOpenWixUpgradePage}
        secondaryButtonOnClick={() =>
          openIntercomWithContent(t('modalPricingPlans.pricingQuestions', {defaultValue: "Hi, I have some questions about pricing."}))
        }
        primaryButtonProps={{ prefixIcon: <Icons.ExternalLink /> }}
        title={t('modalPricingPlans.upgradeYourPlan', {defaultValue: "Upgrade Your Plan"})}
        subtitle={t('modalPricingPlans.upgradeSubtitle', {defaultValue: "Upgrade your plan to get more credits."})}
        content={PricingPlanCardsView()}
        removeContentPadding={viewMode === "cards"}
        width={800}
      />
    </Modal>
  );
};
export default ModalPricingPlans;
