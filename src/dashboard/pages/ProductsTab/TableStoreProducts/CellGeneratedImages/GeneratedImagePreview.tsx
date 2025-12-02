import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Box,
  Text,
  Tooltip,
  IconButton,
  CopyClipboard,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import classes from "./CellGeneratedImages.module.scss";
import { GeneratedImage } from "../../../../../interfaces";

const GeneratedImagePreview: React.FC<{
  image: GeneratedImage;
  onOpenCLick?: () => void;
  size?: number | string;
}> = ({
  image,
  onOpenCLick = () => {}, // Default no-op function if not provided
  size = 48,
}) => {
  const { t } = useTranslation();
  return (
    <Tooltip
      className={classes["cell-stack-product-tooltip"]}
      key={image.id}
      maxWidth={300}
      size="medium"
      content={
        <Box
          height={278}
          key={image.id}
          verticalAlign="middle"
          className={classes["cell-stack-product-tooltip-wrapper"]}
        >
          <Box
            className={classes["cell-stack-product-tooltip-content"]}
            align="center"
          >
            <Box
              className={classes["cell-stack-product-in-tooltip-image"]}
              align="center"
              verticalAlign="middle"
              minWidth={100}
              width="300px"
              height="300px"
              position="relative"
            >
              <Box
                position="absolute"
                bottom={0}
                right={0}
                padding={"SP1"}
                zIndex={2}
                className={classes["cell-stack-product-tooltip-prompt-box"]}
              >
                <CopyClipboard value={image.enhancedPrompt || ""}>
                  {({ isCopied, copyToClipboard, reset }) => (
                    <Tooltip
                      content={!isCopied ? t('common.copy', {defaultValue: "Copy"}) : t('common.copied', {defaultValue: "Copied!"})}
                      size="small"
                    >
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

              <Box
                className={classes["cell-stack-product-tooltip-prompt-box"]}
                verticalAlign="bottom"
                position="absolute"
                bottom={0}
                left={0}
                width={"calc(100% - 30px)"}
                paddingTop={"60px"}
                background="
                 linear-gradient(to bottom, rgba(0, 0, 0, 0.0), rgba(0, 0, 0, 0.8))
                "
                padding={"SP2"}
                paddingRight={"SP3"}
                borderRadius={8}
              >
                <Text size="tiny" maxLines={5} ellipsis light weight="normal">
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
          </Box>
        </Box>
      }
    >
      <Box width={size} className={classes["cell-stack-product-image-box"]}>
        <Image
          src={image?.thumbnails?.thumbnail60 || image?.imageUrl || ""}
          width={size}
          height={size}
          alt={image?.id || t('productsTab.generatedImageAlt', {defaultValue: "Generated Image"})}
          className={classes["cell-stack-product-image"]}
          onClick={onOpenCLick}
        />
      </Box>
    </Tooltip>
  );
};

export default GeneratedImagePreview;
