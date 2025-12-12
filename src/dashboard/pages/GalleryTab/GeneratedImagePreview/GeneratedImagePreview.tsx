import React from "react";
import {
  Image,
  Box,
  Text,
  Tooltip,
  IconButton,
  CopyClipboard,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useTranslation } from "react-i18next";
import classes from "./GeneratedImagePreview.module.scss";
import { GeneratedImage } from "../../../../interfaces";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

const GeneratedImagePreview: React.FC<{
  image: GeneratedImage;
  onOpenCLick?: () => void;
  size?: number | string;
}> = ({
  image,
  onOpenCLick = () => {}, // Default no-op function if not provided
  size = "30vh",
}) => {
  const imageEditor = usePhotoStudio();
  const { t } = useTranslation();
  // Function to handle adding products
  const handleOnPhotoEditClick = (product: GeneratedImage) => {
    try {
      imageEditor.openPhotoStudio({
        type: "product",
        productId: product.productId || "",
        initialImageId: product.id,
        imageType: "draft",
      });
    } catch (error) {
      console.error("Failed to handle live preview click:", error);
      // Assuming you have a toast notification system in place
    }
  };
  return (
    <Box
      key={image.id}
      width="100%"
      height={size}
      verticalAlign="middle"
      align="center"
      position="relative"
      minWidth={100}
      className={classes["gallery-product"]}
    >
      <Box
        position="absolute"
        bottom={0}
        right={0}
        padding={"SP1"}
        zIndex={3}
        className={classes["gallery-product-prompt-preview"]}
      >
        <CopyClipboard value={image.enhancedPrompt || ""}>
          {({ isCopied, copyToClipboard, reset }) => (
            <Tooltip content={!isCopied ? t('common.copy', {defaultValue: "Copy"}) : t('common.copied', {defaultValue: "Copied!"})} size="small">
              <IconButton
                skin="transparent"
                priority="primary"
                size="small"
                onClick={() => (isCopied ? reset() : copyToClipboard())}
              >
                <Icons.Duplicate />
              </IconButton>
            </Tooltip>
          )}
        </CopyClipboard>
      </Box>
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          cursor: "pointer",
          zIndex: 2,
        }}
        onClick={() => handleOnPhotoEditClick(image)}
      ></div>

      <Box
        className={classes["gallery-product-prompt-preview"]}
        verticalAlign="bottom"
        position="absolute"
        bottom={0}
        left={0}
        width={"calc(100% - 30px)"}
        paddingTop={"100px"}
        background="
                 linear-gradient(to bottom, rgba(0, 0, 0, 0.0), rgba(0, 0, 0, 0.9))
                "
        padding={"SP2"}
        paddingRight={"SP3"}
        borderRadius={8}
      >
        <Text size="small" maxLines={5} ellipsis light weight="normal">
          {image.enhancedPrompt}
        </Text>
      </Box>
      <Image
        width="100%"
        height="100%"
        src={image?.imageUrl || ""}
        fit="contain"
      />
    </Box>
  );
};

export default GeneratedImagePreview;
