import React, { useMemo } from "react";
import { Box, Modal } from "@wix/design-system";

import StudioHeader from "../../../pages/PhotoStudio/StudioHeader";
import PanelImageExplorer from "../../../pages/PhotoStudio/StudioImageExplorer";
import StudioEditor from "../../../pages/PhotoStudio/StudioEditor";
import {
  EmptyStateError,
  EmptyStateLoading,
} from "../../../components/ui/PageLoadingStatus";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import ModalImageDetails from "../../../pages/PhotoStudio/Modals/ModalImageDetails";
import ModalRequestUpgrade from "../../../pages/PhotoStudio/Modals/ModalRequestUpgrade";
import ModalRequestUnpublish from "../../../pages/PhotoStudio/Modals/ModalRequestUnpublish";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";

interface PhotoStudioSingleProps {
  onRequestClose?: () => void;
}

const PhotoStudio: React.FC<PhotoStudioSingleProps> = ({ onRequestClose }) => {
  const {
    apiLoading,
    isPhotoStudioOpen,
    closePhotoStudio,
    isLoadingImages,
    imagesError,
    editorSettings,
  } = usePhotoStudio();
  const { addToast } = useStatusToast();

  // Memoize loading/error states to prevent unnecessary re-renders
  const showLoadingOverlay = useMemo(
    () => isLoadingImages || imagesError,
    [isLoadingImages, imagesError]
  );
  const overlayOpacity = useMemo(
    () => (!isLoadingImages && !imagesError ? 1 : 0),
    [isLoadingImages, imagesError]
  );

  const handleOnRequestClose = () => {
    if (editorSettings.isModalImageDetailsOpen) return;
    if (apiLoading) {
      addToast({
        content: "Please wait for the current operation to finish.",
        status: "warning",
      });
      return;
    }

    // Use the passed onRequestClose prop to close the dashboard modal
    if (onRequestClose) {
      onRequestClose();
    }
  };

  return (
    <Box
      height="100dvh"
      width="100dvw"
      gap={0}
      direction="vertical"
      backgroundColor="D80"
      borderRadius={8}
      position="relative"
      boxSizing="border-box"
    >
      <ModalImageDetails />
      <ModalRequestUpgrade />
      <ModalRequestUnpublish />
      <StudioHeader onClose={handleOnRequestClose} showDashboardButton={true} />
      {showLoadingOverlay && (
        <Box
          align="center"
          verticalAlign="middle"
          backgroundColor="D70"
          width="100%"
          height="calc(100% - 55px)"
          padding={"SP4"}
          position="absolute"
          top={0}
          left={0}
          zIndex={99}
          borderRadius="0 0 8px 8px"
          transform="translateY(55px)"
        >
          {isLoadingImages && (
            <EmptyStateLoading loadingText="Loading images..." />
          )}
          {imagesError && (
            <EmptyStateError
              title="We couldn't load your images"
              subtitle="There was a problem fetching your generated images. Please try again later."
              refreshActions={closePhotoStudio}
            />
          )}
        </Box>
      )}
      <Box
        align="center"
        verticalAlign="middle"
        backgroundColor="D70"
        width="100%"
        height="calc(100% - 55px)"
        borderRadius="0 0 8px 8px"
        opacity={overlayOpacity}
        transition="transform 0.3s ease"
      >
        <Box
          padding={"SP4"}
          height="100%"
          maxHeight={"100%"}
          position={editorSettings.isFileExplorerOpen ? "relative" : "absolute"}
          top={editorSettings.isFileExplorerOpen ? 0 : 54}
          left={0}
          transition="transform 0.3s ease"
        >
          <PanelImageExplorer hideProductNavigator={true} />
        </Box>

        <Box
          flexGrow={1}
          width="100%"
          direction="vertical"
          maxHeight={"100%"}
          height={"100%"}
          transition="transform 0.3s ease"
          overflow="hidden"
        >
          <StudioEditor />
        </Box>
      </Box>
    </Box>
  );
};

export default PhotoStudio;
