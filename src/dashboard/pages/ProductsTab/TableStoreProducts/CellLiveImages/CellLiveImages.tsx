import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Text, Tooltip, Cell } from "@wix/design-system";

import classes from "./CellLiveImages.module.scss";


interface CellLiveImagesListProps {
  liveImages: NormalizedMediaItem[] | undefined; // Now using normalized media URLs
  productId?: string;
}

import LiveImagePreview from "./LiveImagePreview";

import { usePhotoStudio } from "../../../../services/providers/PhotoStudioProvider";
import { NormalizedMediaItem } from "../../../../utils/catalogNormalizer";

const CellLiveImages: React.FC<CellLiveImagesListProps> = ({
  liveImages,
  productId,
}) => {
  const { t } = useTranslation();
  const { openPhotoStudio } = usePhotoStudio();
  // Dynamically set max visible images based on window width
  const getMaxVisibleImages = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 1200) return 3;
    return 4;
  };
  const maxVisibleImages = getMaxVisibleImages();

  const liveImageCount = (liveImages && liveImages?.length) || 0;

  if (!liveImageCount) return <Text>-</Text>;
  return (
    <Box verticalAlign="middle">
      {liveImages?.slice(0, maxVisibleImages).map((media, index) =>
        media ? (
          <LiveImagePreview
            image={media}
            key={media.id || media.imageUrl || media.thumbnailUrl || `image-${index}`}
            onOpenCLick={() =>
              openPhotoStudio({
                type: "product",
                productId,
                initialImageId: media.id,
                imageType: "live",
              })
            }
          />
        ) : null
      )}

      {liveImageCount > maxVisibleImages && (
        <div
          onClick={() => {
            productId && openPhotoStudio({ type: "product", productId });
          }}
        >
          <Tooltip content={t('productsTab.viewAllLiveProductImages', {defaultValue: "View all live Product images"})} size="small">
            <Box
              align="center"
              verticalAlign="middle"
              className={classes["cell-stack-product-count"]}
              cursor="pointer"
              backgroundColor="D70"
            >
              <Text size="small" className={classes["product-count"]}>
                +{liveImageCount - maxVisibleImages}
              </Text>
            </Box>
          </Tooltip>
        </div>
      )}
    </Box>
  );
};
export default CellLiveImages;
