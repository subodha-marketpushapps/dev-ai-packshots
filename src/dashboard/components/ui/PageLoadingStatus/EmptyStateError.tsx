import React from "react";
import imageStateError from "../../../../assets/images/image_state-error.svg";
import { Box, EmptyState, Image, TextButton } from "@wix/design-system";

interface EmptyStateErrorProps {
  refreshActions?: () => void;
  title?: string;
  subtitle?: string;
}

const EmptyStateError: React.FC<EmptyStateErrorProps> = ({
  title = "We couldn't load the data",
  subtitle = "Looks like there was a technical issue on our end. Wait a few minutes and try again.",
  refreshActions,
}) => {
  return (
    <EmptyState
      title={title}
      subtitle={subtitle}
      image={
        <Image height={120} width={120} src={imageStateError} transparent />
      }
      theme="page-no-border"
    >
      {refreshActions && (
        <Box direction="vertical" gap={1} align="center">
          <TextButton onClick={refreshActions} size="small">
            Refresh
          </TextButton>
        </Box>
      )}
    </EmptyState>
  );
};

export default EmptyStateError;
