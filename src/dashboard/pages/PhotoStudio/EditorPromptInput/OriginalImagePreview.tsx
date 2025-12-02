import React from "react";
import { Box, Image, Text, IconButton, Tooltip } from "@wix/design-system";
import { GeneratedImagePreview } from "../../../../interfaces";
import * as Icons from "@wix/wix-ui-icons-common";
import classes from "./EditorPromptInput.module.scss";

interface ReferencePreviewProps {
  lastEditImage: GeneratedImagePreview;
  onDismiss: (image: GeneratedImagePreview) => void;
}

const OriginalPreview: React.FC<ReferencePreviewProps> = ({
  lastEditImage: image,
  onDismiss,
}) => {
  return (
    <Box
      border="1px solid"
      borderColor="B50"
      borderRadius={12}
      position="relative"
      gap="SP2"
      height={48}
      className={classes["box-original-preview"]}
    >
      <Box
        position="absolute"
        width={48}
        height={48}
        align="center"
        verticalAlign="middle"
        top={0}
        right={0}
        className={classes["original-preview-dismiss"]}
        zIndex={999999}
      >
        <Tooltip content="Go Back to Original">
          <IconButton onClick={() => onDismiss(image)} skin="transparent">
            <Icons.Dismiss />
          </IconButton>
        </Tooltip>
      </Box>
      <Box align="center" verticalAlign="middle" width={48} minWidth={48}>
        <Image
          src={image.imageUrl || ""}
          alt={image.id || "Reference Image"}
          height="112px"
        />
      </Box>
    </Box>
  );
};

export default OriginalPreview;
