import React, { useRef, useMemo, useEffect } from "react";
import { Box, Text } from "@wix/design-system";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import ImagePreviewer from "./ImagePreviewer";
import { PROCESS_STATES } from "../../../../interfaces/custom/image-editor";
import { GeneratedImagePreview } from "../../../../interfaces";

interface EditorMultiImagesProps {
  aspectRatio?: string; // Optional aspect ratio prop
}

const EditorMultiImages: React.FC<EditorMultiImagesProps> = ({
  aspectRatio = "1/1", // Default aspect ratio
}) => {
  const { referenceImage, sortedFileExplorerImages, confirmImages } =
    usePhotoStudio();

  const allProcessingImages = sortedFileExplorerImages.filter(
    (image) =>
      image.imageState === PROCESS_STATES.PROCESSING ||
      image.imageState === PROCESS_STATES.CONFIRM ||
      image.imageState === PROCESS_STATES.SELECTED ||
      image.imageState === PROCESS_STATES.DELETING ||
      image.imageState === PROCESS_STATES.UPLOADED
  );

  const isMulti = allProcessingImages.length > 1;

  // --- Scroll to newest/changed element logic (like StudioImageExplorer) ---
  const prevImagesRef = useRef<GeneratedImagePreview[]>(allProcessingImages);
  const highlightImageId = useMemo(() => {
    const prevImages = prevImagesRef.current;
    let changedId: string | undefined;
    // 1. Highlight if a new image is added
    for (const img of allProcessingImages) {
      if (!prevImages.find((p) => p.id === img.id)) {
        changedId = img.id;
        break;
      }
    }
    // 2. Highlight if image state changed to PROCESSING or CONFIRM
    if (!changedId) {
      for (const img of allProcessingImages) {
        const prev = prevImages.find((p) => p.id === img.id);
        if (
          prev &&
          prev.imageState !== img.imageState &&
          (img.imageState === PROCESS_STATES.PROCESSING ||
            img.imageState === PROCESS_STATES.CONFIRM)
        ) {
          changedId = img.id;
          break;
        }
      }
    }
    return changedId;
  }, [allProcessingImages]);
  useEffect(() => {
    prevImagesRef.current = allProcessingImages;
  }, [allProcessingImages]);

  const highlightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlightRef.current) {
      let parent = highlightRef.current.parentElement;
      while (parent && !parent.classList.contains("StudioEditor")) {
        parent = parent.parentElement;
      }
      if (parent) {
        highlightRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [highlightImageId]);

  return (
    <Box direction="vertical" gap="SP4" width="100%">
      <Box
        direction="horizontal"
        gap="SP5"
        width="100%"
        flexWrap="wrap"
        align="center"
        verticalAlign="top"
        paddingTop={"SP4"}
        paddingBottom={referenceImage || confirmImages ? "160px" : "100px"}
      >
        {allProcessingImages.map((image, idx) => (
          <Box
            key={image.id || idx}
            ref={image.id === highlightImageId ? highlightRef : undefined}
          >
            <ImagePreviewer
              image={image}
              isSingleImage={isMulti ? false : true}
              aspectRatio={aspectRatio.split(":").join("/")}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default EditorMultiImages;
