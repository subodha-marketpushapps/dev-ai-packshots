import React from "react";
import { EmptyState, Loader, Box } from "@wix/design-system";

interface EmptyStateLoadingErrorProps {
  loadingText?: string;
}

const EmptyStateLoadingError: React.FC<EmptyStateLoadingErrorProps> = ({
  loadingText = "Loading data...",
}) => {
  return (
    <EmptyState theme="page-no-border">
      <Box height="200px" verticalAlign="middle" align="center">
        <Loader text={loadingText} />
      </Box>
    </EmptyState>
  );
};

export default EmptyStateLoadingError;
