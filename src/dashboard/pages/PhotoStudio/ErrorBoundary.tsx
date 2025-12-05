import React, { Component, ReactNode } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { Box, Text } from "@wix/design-system";

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches rendering errors and displays a fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <Box padding="SP4" backgroundColor="R60" borderRadius={8}>
          <Text skin="error">
            {t('errors.errorBoundary.message', {defaultValue: "Something went wrong. Please try again."})}
          </Text>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
