import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Image, Box, Text, TextButton } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";

import APP_LIST from "./recommendedAppList";

const RecommendedApps: React.FC = () => {
  const { t } = useTranslation();
  
  function handleUrlClick(url: string) {
    window.open(url, "_blank", "noopener");
  }

  const lastElementId = APP_LIST[APP_LIST.length - 1].id;
  return (
    <Card>
      <Card.Header title={t('recommendedApps.title', {defaultValue: "Recommended Apps"})} />
      <Card.Divider />
      <Card.Content>
        <Box gap={3} direction="vertical">
          {APP_LIST.map((app) => (
            <Box
              key={app.id}
              borderBottom={
                app.id != lastElementId ? "1px solid #f0f0f0" : undefined
              }
              paddingBottom={app.id != lastElementId ? 2 : undefined}
              gap={2}
            >
              <Box minWidth={48} height={48} overflow="hidden" marginTop="2px">
                <Image
                  src={app.icon}
                  alt={app.name}
                  width={48}
                  height={48}
                  borderRadius={6}
                />
              </Box>

              <Box direction="vertical" gap="4px">
                <Text size="small" weight="normal">
                  {app.name}
                </Text>
                <Text size="tiny" weight="thin" secondary>
                  {app.description}
                </Text>
                <TextButton
                  size="tiny"
                  onClick={() => handleUrlClick(app.url)}
                  suffixIcon={<Icons.ExternalLink />}
                >
                  {t('recommendedApps.learnMore', {defaultValue: "Learn More"})}
                </TextButton>
              </Box>
            </Box>
          ))}
        </Box>
      </Card.Content>
    </Card>
  );
};

export default RecommendedApps;
