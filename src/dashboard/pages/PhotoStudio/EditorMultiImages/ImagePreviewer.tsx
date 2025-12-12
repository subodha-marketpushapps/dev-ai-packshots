import React from "react";
import {
  Box,
  Loader,
  Image,
  Button,
  Text,
  Tooltip,
  IconButton,
} from "@wix/design-system";
import { useTranslation } from "react-i18next";
import EditingPhotoActions from "../EditorPhotoActions";
import * as Icons from "@wix/wix-ui-icons-common";

import { GeneratedImagePreview } from "../../../../interfaces";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

interface ImagePreviewerProps {
  image: GeneratedImagePreview;
  isSingleImage?: boolean; // made optional
  aspectRatio?: string; // made optional
  errorMessage?: string;
  onRetry?: () => void;
}

// Memoized image rendering function
const RenderImage: React.FC<{
  imageSrc: string;
  styles: React.CSSProperties;
}> = React.memo(({ imageSrc, styles }) => (
  <Image
    width="100%"
    height="auto"
    src={imageSrc}
    alt="AI generated preview"
    showBorder
    style={styles}
    fit="contain"
  />
));

const ImagePreviewer: React.FC<ImagePreviewerProps> = React.memo(
  ({
    image,
    isSingleImage = true,
    aspectRatio = "1/1",
    errorMessage,
    onRetry,
  }) => {
    const { t } = useTranslation();
    const { showImageDetails, deleteFileExplorerImage } = usePhotoStudio();
    const errorMessageText = errorMessage || t('imagePreviewer.unableToGenerateImage', {defaultValue: "Unable to generate image."});
    const imgSrc = image?.imageUrl || undefined;
    const state = image?.imageState || "confirm";
    const width = "auto"; //isSingleImage ? "auto" : "25vw";
    const height = isSingleImage ? "45vh" : "30vh";

    // Memoize style object for image
    const imgStyle = React.useMemo(() => {
      let style: React.CSSProperties = { aspectRatio };
      switch (state) {
        case "processing":
          style.filter = "blur(8px) grayscale(0.2)";
          break;
        case "deleting":
          style.filter = "blur(2px) grayscale(1)";
          break;
        case "error":
          style.filter = "grayscale(1)";
          break;
        default:
          break;
      }
      return style;
    }, [aspectRatio, state]);

    const handleOnCompare = async () => {
      if (!image?.imageUrl) return;
      showImageDetails(image, "compare");
    };

    // Common box props for image containers
    const imageBoxProps = {
      width: "100%",
      aspectRatio,
      height,
      position: "relative" as const,
    };

    return (
      <Box
        width={width}
        height="auto"
        minHeight={"30vh"}
        position="relative"
        gap="SP1"
        align="center"
        verticalAlign="middle"
        direction="vertical"
      >
        {state === "error" && (
          <Box
            width="100%"
            padding="SP2"
            gap="SP2"
            align="center"
            verticalAlign="middle"
            backgroundColor="D80"
            borderRadius={12}
            aspectRatio={aspectRatio}
            height={height}
          >
            <Text>{errorMessageText}</Text>
            {onRetry && (
              <Button size="small" onClick={onRetry} skin="standard">
                {t('imagePreviewer.retry', {defaultValue: "Retry"})}
              </Button>
            )}
          </Box>
        )}
        {state === "processing" && (
          <Box
            {...imageBoxProps}
            align="center"
            verticalAlign="middle"
            backgroundColor="D80"
            borderRadius={12}
          >
            {imgSrc && <RenderImage imageSrc={imgSrc} styles={imgStyle} />}
            <Box
              position="absolute"
              margin="auto"
              align="center"
              verticalAlign="middle"
              width="100%"
              height="100%"
              pointerEvents="none"
            >
              <Loader size="medium" />
            </Box>
          </Box>
        )}
        {state === "deleting" && (
          <Box
            {...imageBoxProps}
            align="center"
            verticalAlign="middle"
            backgroundColor="D80"
            borderRadius={12}
          >
            {imgSrc && <RenderImage imageSrc={imgSrc} styles={imgStyle} />}
            <Box
              position="absolute"
              margin="auto"
              align="center"
              verticalAlign="middle"
              width="100%"
              height="100%"
              pointerEvents="none"
              direction="vertical"
              gap="SP2"
            >
              <Loader size="large" color="white" />
              <Text light>{t('imagePreviewer.deleting', {defaultValue: "Deleting..."})}</Text>
            </Box>
          </Box>
        )}
        {state === "confirm" && imgSrc && (
          <>
            <Box {...imageBoxProps}>
              {imgSrc && <RenderImage imageSrc={imgSrc} styles={imgStyle} />}
              <Box position="absolute" top={0} right={0} padding="SP2" zIndex={99}>
                <Tooltip content={t('photoStudio.compareChanges', {defaultValue: "Compare Changes"})} placement="top" size="small">
                  <IconButton
                    priority="secondary"
                    size="tiny"
                    onClick={handleOnCompare}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Icons.LayoutTwoColumns />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <EditingPhotoActions mode="processing" imageObject={image} />
          </>
        )}
        {state === "selected" && (
          <Box {...imageBoxProps}>
            {imgSrc && <RenderImage imageSrc={imgSrc} styles={imgStyle} />}
          </Box>
        )}
        {state === "uploaded" && (
          <Box
            {...imageBoxProps}
            align="center"
            verticalAlign="middle"
            backgroundColor="D80"
            borderRadius={12}
          >
            {imgSrc && <RenderImage imageSrc={imgSrc} styles={imgStyle} />}
            <Box
              position="absolute"
              bottom={12}
              right={12}
              zIndex={1}
              display="flex"
              gap={1}
            >
              <Tooltip
                content={t('imagePreviewer.uploadedImage', {defaultValue: "Uploaded Image"})}
                appendTo="scrollParent"
                size="small"
              >
                <Box
                  backgroundColor="D80"
                  borderRadius={6}
                  padding="4px"
                  align="center"
                  verticalAlign="middle"
                >
                  <Icons.Document size={20} color="B10" />
                </Box>
              </Tooltip>
            </Box>
            <Box position="absolute" top={0} right={0} padding="SP2" zIndex={1}>
              <Tooltip
                content={t('imagePreviewer.removeImage', {defaultValue: "Remove Image"})}
                appendTo="scrollParent"
                size="small"
              >
                <IconButton
                  priority="secondary"
                  size="tiny"
                  onClick={() => deleteFileExplorerImage(image.id)}
                  aria-label={t('imagePreviewer.removeUploadedImage', {defaultValue: "Remove uploaded image"})}
                >
                  <Icons.DeleteSmall />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </Box>
    );
  }
);

export default ImagePreviewer;
