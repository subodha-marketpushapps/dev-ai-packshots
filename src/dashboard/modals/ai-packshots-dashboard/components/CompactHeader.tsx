import React from "react";
import { Box, Tooltip, IconButton, InfoIcon, Heading, Divider } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useTranslation } from "react-i18next";
import StudioSubscriptionInfo from "../../../pages/PhotoStudio/StudioHeader/StudioSubscriptionInfo";

interface CompactHeaderProps {
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

const CompactHeader: React.FC<CompactHeaderProps> = ({
  onClose,
  title,
  subtitle,
}) => {
  const { t } = useTranslation();
  
  const titleText = title || t('modals.aiPackshotsDashboard.title', {defaultValue: "AI Product Images"});
  const subtitleText = subtitle || t('modals.aiPackshotsDashboard.subtitle', {defaultValue: "Enhance and refine your product images effortlessly with AI-powered tools."});
  
  return (
    <Box
      padding="SP2"
      paddingLeft="SP4"
      flexGrow={1}
      align="space-between"
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor="D60"
      height={"54px"}
      boxSizing="border-box"
      position="absolute"
      top={0}
      right={0}
      width={"100vw"}
      backgroundColor="D80"
      zIndex={99}
    >
      <Box
        direction="horizontal"
        gap="SP1"
        verticalAlign="middle"
        align="space-between"
        width={"100%"}
        marginRight={"SP2"}
      >
        <Box gap="SP1">
          <Heading size="medium">{titleText}</Heading>
          <InfoIcon content={subtitleText} />
        </Box>

        <Box align="right" flexGrow={1}>
          <StudioSubscriptionInfo
            context={"dashboard"}
          />
        </Box>

        <Divider direction="vertical" />
      </Box>
      <Box>
        <Tooltip content={t('modals.aiPackshotsDashboard.dismiss', {defaultValue: "Dismiss"})} size="small" enterDelay={1000}>
          <IconButton
            size="small"
            skin="dark"
            priority="tertiary"
            onClick={onClose}
          >
            <Icons.Dismiss />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default CompactHeader;