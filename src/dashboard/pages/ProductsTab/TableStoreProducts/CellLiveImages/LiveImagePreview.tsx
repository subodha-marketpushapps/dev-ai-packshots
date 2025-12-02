import React from "react";
import { useTranslation } from "react-i18next";
import { Image, Box, Tooltip } from "@wix/design-system";

import classes from "./CellLiveImages.module.scss";

import { NormalizedMediaItem } from "../../../../utils/catalogNormalizer";

const LiveImagePreview: React.FC<{
  image: NormalizedMediaItem;
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
      key={image.id || image.imageUrl || 'image'}
      maxWidth={300}
      size="medium"
      content={
        <Box
          height={278}
          key={image.id || image.imageUrl || 'image'}
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
          src={image?.thumbnailUrl || image?.imageUrl || ""}
          width={size}
          height={size}
          alt={image?.altText || image?.id || t('productsTab.liveImageAlt', {defaultValue: "Live Image"})}
          className={classes["cell-stack-product-image"]}
          onClick={onOpenCLick}
        />
      </Box>
    </Tooltip>
  );
};

export default LiveImagePreview;
