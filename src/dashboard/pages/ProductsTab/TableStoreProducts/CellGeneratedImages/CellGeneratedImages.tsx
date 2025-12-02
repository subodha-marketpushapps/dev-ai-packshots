import React, { useState } from "react";
import { Box, Text, Tooltip, Cell } from "@wix/design-system";

import classes from "./CellGeneratedImages.module.scss";
interface CellGeneratedImagesListProps {
  generatedImages: GeneratedImage[] | undefined;
  productId?: string;
}

import GeneratedImagePreview from "./GeneratedImagePreview";

import { GeneratedImage } from "../../../../../interfaces";
import { usePhotoStudio } from "../../../../services/providers/PhotoStudioProvider";

const CellGeneratedImages: React.FC<CellGeneratedImagesListProps> = ({
  generatedImages,
  productId,
}) => {
  const { openPhotoStudio } = usePhotoStudio();
  // Dynamically set max visible images based on window width
  const getMaxVisibleImages = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 1200) return 3;
    return 4;
  };
  const maxVisibleImages = getMaxVisibleImages();

  const generatedImageCount = (generatedImages && generatedImages?.length) || 0;

  const sortedGeneratedImages = generatedImages?.sort((a, b) => {
    // Sort by createdAt date in descending order
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (!generatedImageCount) return <Text>-</Text>;
  return (
    <Box verticalAlign="middle">
      {sortedGeneratedImages?.slice(0, maxVisibleImages).map((media) =>
        media ? (
          <GeneratedImagePreview
            image={media}
            key={media.id}
            onOpenCLick={() =>
              openPhotoStudio({
                type: "product",
                productId,
                initialImageId: media.id,
                imageType: "draft",
              })
            }
          />
        ) : null
      )}

      {generatedImageCount > maxVisibleImages && (
        <div
          onClick={() => {
            productId && openPhotoStudio({ type: "product", productId });
          }}
        >
          <Tooltip content="View all generated images" size="small">
            <Box
              align="center"
              verticalAlign="middle"
              className={classes["cell-stack-product-count"]}
              cursor="pointer"
              backgroundColor="D70"
            >
              <Text size="small" className={classes["product-count"]}>
                +{generatedImageCount - maxVisibleImages}
              </Text>
            </Box>
          </Tooltip>
        </div>
      )}
    </Box>
  );
};
export default CellGeneratedImages;
