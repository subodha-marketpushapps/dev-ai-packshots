import React, { Component, ReactNode } from "react";
import { Box, Text } from "@wix/design-system";

interface Props {
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
      return (
        <Box padding="SP4" backgroundColor="R60" borderRadius={8}>
          <Text skin="error">Something went wrong. Please try again.</Text>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
