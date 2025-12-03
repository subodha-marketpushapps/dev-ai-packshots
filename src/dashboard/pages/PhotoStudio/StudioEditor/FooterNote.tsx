import React from "react";
import { Box, Text } from "@wix/design-system";
import { useTranslation } from "react-i18next";

const FooterNote: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box
      width={"100%"}
      align="center"
      verticalAlign="middle"
      transform="translateY(-6px)"
      pointerEvents="none"
    >
      <Text
        size="small"
        skin="disabled"
        style={{ textAlign: "center", marginTop: 24 }}
      >
        {t('studioEditor.footerNote', {defaultValue: "AI can make mistakes, please review your images carefully."})}
      </Text>
    </Box>
  );
};

export default FooterNote;
