import React from "react";
import { useTranslation } from "react-i18next";
import imageStateError from "../../../../assets/images/image_state-error.svg";
import { Box, EmptyState, Image, TextButton } from "@wix/design-system";

interface EmptyStateErrorProps {
  refreshActions?: () => void;
  title?: string;
  subtitle?: string;
}

const EmptyStateError: React.FC<EmptyStateErrorProps> = ({
  title,
  subtitle,
  refreshActions,
}) => {
  const { t } = useTranslation();
  const defaultTitle = t('errors.genericError.title', {defaultValue: "We couldn't load the data"});
  const defaultSubtitle = t('errors.genericError.subtitle', {defaultValue: "Looks like there was a technical issue on our end. Wait a few minutes and try again."});
  return (
    <EmptyState
      title={title ?? defaultTitle}
      subtitle={subtitle ?? defaultSubtitle}
      image={
        <Image height={120} width={120} src={imageStateError} transparent />
      }
      theme="page-no-border"
    >
      {refreshActions && (
        <Box direction="vertical" gap={1} align="center">
          <TextButton onClick={refreshActions} size="small">
            {t('common.refresh', {defaultValue: "Refresh"})}
          </TextButton>
        </Box>
      )}
    </EmptyState>
  );
};

export default EmptyStateError;
