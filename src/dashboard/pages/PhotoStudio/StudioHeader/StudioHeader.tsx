import React from "react";
import {
  Box,
  Heading,
  IconButton,
  InfoIcon,
  Divider,
  Tooltip,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";

import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";
import StudioSubscriptionInfo from "./StudioSubscriptionInfo";
import { openDashboardPage } from "../../../utils/helpers";

interface PhotoStudioHeaderProps {
  onClose?: () => void;
  showDashboardButton?: boolean;
  showCloseButton?: boolean;
}

const PhotoStudioHeader: React.FC<PhotoStudioHeaderProps> = ({
  onClose,
  showDashboardButton = false,
  showCloseButton = true,
}) => {
  const { closePhotoStudio, apiLoading } = usePhotoStudio();
  const { addToast } = useStatusToast();

  const handleDismiss = () => {
    if (!apiLoading) {
      // Use the passed onClose prop if available, otherwise use closePhotoStudio
      if (onClose) {
        onClose();
      } else {
        closePhotoStudio();
      }
    } else {
      addToast({
        content: "Please wait for the current operation to finish.",
        status: "warning",
      });
    }
  };

  const handleOpenDashboard = async () => {
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
  };

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
          <Heading size="medium">AI Product Images</Heading>
          {/* <InfoIcon content="Enhance and refine your product images effortlessly with AI-powered tools." /> */}
        </Box>

        <Box align="right" flexGrow={1}>
          <StudioSubscriptionInfo
            context={showDashboardButton ? "modal" : "dashboard"}
          />
        </Box>

        <Divider direction="vertical" />
      </Box>
      <Box>
        {showDashboardButton && (
          <Tooltip content="Open AI Product Images Dashboard" size="small">
            <IconButton
              size="small"
              skin="dark"
              priority="tertiary"
              onClick={handleOpenDashboard}
            >
              <Icons.ExternalLink />
            </IconButton>
          </Tooltip>
        )}
        {showCloseButton && (
          <Tooltip content="Dismiss" size="small" enterDelay={1000}>
            <IconButton
              size="small"
              skin="dark"
              priority="tertiary"
              onClick={handleDismiss}
            >
              <Icons.Dismiss />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default PhotoStudioHeader;
