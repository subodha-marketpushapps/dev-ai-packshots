import React from "react";
import { Box, Image, Text, IconButton, Tooltip } from "@wix/design-system";
import { useTranslation } from "react-i18next";
import { GeneratedImagePreview } from "../../../../interfaces";
import * as Icons from "@wix/wix-ui-icons-common";

interface ReferencePreviewProps {
  image: GeneratedImagePreview;
  onDismiss: (image: GeneratedImagePreview) => void;
}

const ReferencePreview: React.FC<ReferencePreviewProps> = ({
  image,
  onDismiss,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      border="1px solid"
      borderColor="B50"
      borderRadius={12}
      padding="SP2"
      position="relative"
      gap="SP2"
      height={136}
    >
      <Box position="absolute" top={4} right={4}>
        <Tooltip content={t('photoStudio.cancelCopyEdit', {defaultValue: "Cancel Copy Edit"})}>
          <IconButton
            onClick={() => onDismiss(image)}
            skin="dark"
            priority="tertiary"
            size="small"
          >
            <Icons.Dismiss />
          </IconButton>
        </Tooltip>
      </Box>
      <Box align="center" verticalAlign="middle" width={112} minWidth={112}>
        <Image
          src={image.imageUrl || ""}
          alt={image.id || "Reference Image"}
          height="112px"
        />
      </Box>

      <Box
        gap="SP1"
        flexGrow={1}
        direction="vertical"
        verticalAlign="space-between"
      >
        <Box flexGrow={1} marginRight={"SP4"} height={"100px"}>
          <Text
            size="small"
            maxLines={4}
            disabled={!!image?.enhancedPrompt}
            ellipsis
          >
            {image?.enhancedPrompt || t('editorPromptInput.referencePreview.noPrompt', {defaultValue: "no prompt"})}
          </Text>
        </Box>
        <Box
          backgroundColor="B60"
          padding="SP1"
          borderRadius={8}
          gap="SP1"
          marginTop={"SP1"}
          color="B10"
        >
          <Icons.SparklesFilled size="14px" />
          <Text size="tiny">
            {t('editorPromptInput.referencePreview.matchReference', {defaultValue: "Generates results that closely match this reference image"})}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default ReferencePreview;
