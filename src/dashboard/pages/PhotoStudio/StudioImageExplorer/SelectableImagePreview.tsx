import React, { useState, useEffect } from "react";
import {
  Tooltip,
  Box,
  Thumbnail,
  Loader,
  SkeletonGroup,
  Layout,
  SkeletonRectangle,
  Cell,
  Image,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { GeneratedImagePreview, PROCESS_STATES } from "../../../../interfaces";

interface SelectableImagePreviewProps {
  imageObj: GeneratedImagePreview;
  height?: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: (image?: GeneratedImagePreview) => void;
}

interface ImagePreviewProps {
  imageUrl: string;
  imageId: string;
  height: number;
}

const ImageLoadingSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <SkeletonGroup skin="light" backgroundColor="white">
    <Layout>
      <Cell>
        <SkeletonRectangle height={height + "px"} width={height + "px"} />
      </Cell>
    </Layout>
  </SkeletonGroup>
);

// Memoized ImagePreview moved outside to avoid re-creation on each render
const ImagePreview: React.FC<ImagePreviewProps> = React.memo(
  ({ imageUrl, imageId, height }) => {
    const [loading, setLoading] = React.useState(true);
    const prevUrl = React.useRef(imageUrl);

    React.useEffect(() => {
      if (prevUrl.current !== imageUrl) {
        setLoading(true);
        prevUrl.current = imageUrl;
      }
    }, [imageUrl]);

    return (
      <>
        {loading && <ImageLoadingSkeleton height={height} />}
        <Image
          height="100%"
          src={imageUrl || ""}
          alt={imageId || "Image Preview"}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          style={loading ? { display: "none" } : {}}
        />
      </>
    );
  },
  (prevProps, nextProps) =>
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.imageId === nextProps.imageId &&
    prevProps.height === nextProps.height
);

const SelectableImagePreview: React.FC<SelectableImagePreviewProps> = ({
  height = 100,
  selected = false,
  disabled = false,
  onClick,
  imageObj,
}) => {
  // Overlay icons for special states
  const overlayIcon = (() => {
    if (imageObj?.comments && imageObj.comments.length > 0) {
      return (
        <Tooltip
          content={imageObj.comments}
          appendTo="scrollParent"
          size="small"
        >
          <Box
            backgroundColor="D80"
            borderRadius={4}
            padding="4px"
            align="center"
            verticalAlign="middle"
          >
            <Icons.ThumbsDown size={14} color="B10" />
          </Box>
        </Tooltip>
      );
    }
    if (imageObj?.imageState === PROCESS_STATES.REFERENCE) {
      return (
        <Tooltip
          content={"Reference Image"}
          appendTo="scrollParent"
          size="small"
        >
          <Box
            backgroundColor="D80"
            borderRadius={4}
            padding="4px"
            align="center"
            verticalAlign="middle"
          >
            <Icons.Attachment size={14} color="B10" />
          </Box>
        </Tooltip>
      );
    }
    if (imageObj?.imageState === PROCESS_STATES.PUBLISHING) {
      return (
        <Tooltip
          content={"Publishing..."}
          appendTo="scrollParent"
          size="small"
          disabled={false}
        >
          <Box
            backgroundColor="D80"
            borderRadius={4}
            padding="4px"
            align="center"
            verticalAlign="middle"
          >
            <Icons.GetStarted size={14} color="B10" />
          </Box>
        </Tooltip>
      );
    }
    if (
      imageObj?.imageState === PROCESS_STATES.ERROR ||
      imageObj?.generationStatus == "FAILED"
    ) {
      return (
        <Tooltip content={"Failed Image"} appendTo="scrollParent" size="small">
          <Box
            backgroundColor="D80"
            borderRadius={4}
            padding="4px"
            align="center"
            verticalAlign="middle"
          >
            <Icons.StatusWarning size={14} color="B10" />
          </Box>
        </Tooltip>
      );
    }
    return null;
  })();

  // Main Thumbnail rendering
  return (
    <Box height={height} position="relative">
      {overlayIcon && (
        <Box position="absolute" bottom={8} right={8} zIndex={1}>
          {overlayIcon}
        </Box>
      )}
      <Thumbnail
        width="100%"
        height={height}
        selected={selected}
        disabled={
          disabled ||
          imageObj.imageState === PROCESS_STATES.REFERENCE ||
          imageObj.imageState === PROCESS_STATES.PROCESSING ||
          imageObj.imageState === PROCESS_STATES.PUBLISHING ||
          imageObj.imageState === PROCESS_STATES.DELETING
        }
        onClick={
          disabled ||
          imageObj.imageState === PROCESS_STATES.EDIT ||
          imageObj.imageState === PROCESS_STATES.PUBLISHING
            ? undefined
            : () => onClick?.(imageObj)
        }
        dataHook={`selectable-image-preview-${imageObj.id}`}
        image={
          <ImagePreview
            imageUrl={
              imageObj?.thumbnails?.thumbnail100 || imageObj.imageUrl || ""
            }
            imageId={imageObj.id || ""}
            height={height}
          />
        }
        textPosition="outside"
      />
      {/* Loader overlay for processing/deleting/publishing */}
      {(imageObj.imageState === PROCESS_STATES.PROCESSING ||
        imageObj.imageState === PROCESS_STATES.PUBLISHING ||
        imageObj.imageState === PROCESS_STATES.DELETING) && (
        <Box
          width="100%"
          height="100%"
          position="absolute"
          align="center"
          verticalAlign="middle"
          left={0}
          top={0}
          zIndex={2}
          backgroundColor="rgba(0,0,0,0.08)"
          pointerEvents="none"
        >
          <Loader size="small" />
        </Box>
      )}
    </Box>
  );
};

export default SelectableImagePreview;
