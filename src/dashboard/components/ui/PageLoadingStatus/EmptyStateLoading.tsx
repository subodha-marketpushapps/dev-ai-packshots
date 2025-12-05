import React from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, Loader, Box } from "@wix/design-system";

interface EmptyStateLoadingErrorProps {
  loadingText?: string;
}

const EmptyStateLoadingError: React.FC<EmptyStateLoadingErrorProps> = ({
  loadingText,
}) => {
  const { t } = useTranslation();
  const defaultLoadingText = t('loading.loadingData', {defaultValue: "Loading data..."});
  return (
    <EmptyState theme="page-no-border">
      <Box height="200px" verticalAlign="middle" align="center">
        <Loader text={loadingText ?? defaultLoadingText} />
      </Box>
    </EmptyState>
  );
};

export default EmptyStateLoadingError;
