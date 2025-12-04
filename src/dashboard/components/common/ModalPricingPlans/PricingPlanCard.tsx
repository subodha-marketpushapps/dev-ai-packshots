import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Layout,
  Card,
  Cell,
  Badge,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useTranslation } from "react-i18next";
import { ENTERPRISE_PLAN_NAMES } from "../../../../constants/data";

interface PricingPlan {
  plan: string;
  credits_per_month: number;
  monthly_price: string;
  per_month_billed_yearly: string | null;
  one_pay_yearly_price: string | null;
  your_cost: string;
  profit_vs_cost_monthly_yearly: string | null;
  user_gen_monthly: string | null;
}

const PricingPlanCard: React.FC<{
  plan: PricingPlan;
  suggested: boolean;
  isCurrent: boolean;
  onUpgradeClick?: () => void;
  onContactClick?: (planName: string) => void;
  showUpgradeAction?: boolean;
}> = ({
  plan,
  suggested,
  isCurrent,
  onUpgradeClick,
  onContactClick,
  showUpgradeAction = true,
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const isEnterprise = ENTERPRISE_PLAN_NAMES.includes(plan.plan);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card showShadow={hovered} key={plan.plan}>
        <Box align="space-between" height="100%" width={"100%"} padding={0}>
          <Box height="100%">
            <Layout gap={0}>
              {(suggested || isCurrent) && (
                <Cell span={12}>
                  <Box height="18px" marginTop={2} marginLeft={-1}>
                    {suggested && (
                      <Badge size="small" skin="premium">
                        {t('pricingPlanCard.suggestedForYou', {defaultValue: "SUGGESTED FOR YOU"})}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge size="small" skin="neutral">
                        {t('pricingPlanCard.currentPlan', {defaultValue: "CURRENT PLAN"})}
                      </Badge>
                    )}
                  </Box>
                </Cell>
              )}
              <Cell>
                <Box
                  height={suggested || isCurrent ? "100px" : "106px"}
                  padding={`${suggested || isCurrent ? "12px" : "20px"} 24px ${
                    suggested || isCurrent ? "0px 24px" : "24px 24px"
                  }`}
                  direction="vertical"
                  gap="4px"
                >
                  <Heading size="small">{plan.plan}</Heading>
                  <Box direction="horizontal" gap="8px">
                    <Box
                      verticalAlign="middle"
                      direction="horizontal"
                      gap="2px"
                      color="B10"
                    >
                      <Text size="small">{plan.credits_per_month}</Text>
                      <Icons.SparklesFilled size={16} />
                    </Box>
                    <Text size="small">
                      {plan.plan == "Basic" 
                        ? t('pricingPlanCard.credits', {defaultValue: "credits"})
                        : t('pricingPlanCard.creditsPerMonth', {defaultValue: "credits/month"})}
                    </Text>
                  </Box>
                  <Text size="tiny" secondary>
                    {plan.plan == "Basic"
                      ? t('pricingPlanCard.testingCredits', {defaultValue: "Testing Credits"})
                      : plan.monthly_price}{" "}
                    {plan.per_month_billed_yearly && (
                      <span>
                        {t('pricingPlanCard.orBilledYearly', {
                          defaultValue: "(or {{price}} billed yearly)",
                          price: plan.per_month_billed_yearly
                        })}
                      </span>
                    )}
                  </Text>
                </Box>
              </Cell>
            </Layout>
          </Box>
          {showUpgradeAction && (
            <Box padding="24px">
              <Button
                size="small"
                priority="secondary"
                disabled={isCurrent}
                skin="premium"
                onClick={
                  isCurrent
                    ? undefined
                    : isEnterprise
                    ? () => onContactClick && onContactClick(plan.plan)
                    : onUpgradeClick
                }
              >
                {isCurrent 
                  ? t('pricingPlanCard.current', {defaultValue: "Current"})
                  : isEnterprise 
                  ? t('pricingPlanCard.contact', {defaultValue: "Contact"})
                  : t('pricingPlanCard.upgrade', {defaultValue: "Upgrade"})}
              </Button>
            </Box>
          )}
        </Box>
      </Card>
    </div>
  );
};

export default PricingPlanCard;
