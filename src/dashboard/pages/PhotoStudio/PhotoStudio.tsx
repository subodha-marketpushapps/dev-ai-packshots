import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Modal } from "@wix/design-system";

import StudioHeader from "./StudioHeader";
import PanelImageExplorer from "./StudioImageExplorer";
import StudioEditor from "./StudioEditor";
import {
  EmptyStateError,
  EmptyStateLoading,
} from "../../components/ui/PageLoadingStatus";
import { usePhotoStudio } from "../../services/providers/PhotoStudioProvider";
import ModalImageDetails from "./Modals/ModalImageDetails";
import ModalRequestUpgrade from "./Modals/ModalRequestUpgrade";
import ModalRequestUnpublish from "./Modals/ModalRequestUnpublish";
import { useStatusToast } from "../../services/providers/StatusToastProvider";

interface PhotoStudioProps {
  mode?: "modal" | "absolute";
  showCloseButton?: boolean;
  onCustomClose?: () => void;
}

const PhotoStudio: React.FC<PhotoStudioProps> = ({
  mode = "modal",
  showCloseButton = true,
  onCustomClose,
}) => {
  const { t } = useTranslation();
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

    if (mode === "absolute" && onCustomClose) {
      onCustomClose();
    } else {
      closePhotoStudio();
    }
  };

  // Common studio content following WDS patterns
  const studioContent = (
    <>
      <ModalImageDetails studioMode={mode} />
      <ModalRequestUpgrade studioMode={mode} />
      <ModalRequestUnpublish studioMode={mode} />
      {mode !== "absolute" && (
        <StudioHeader
          showCloseButton={showCloseButton}
          onClose={handleOnRequestClose}
        />
      )}
      {showLoadingOverlay && (
        <Box
          align="center"
          verticalAlign="middle"
          backgroundColor="D70"
          width="100%"
          height={mode === "absolute" ? "100%" : "calc(100% - 54px)"}
          padding="SP4"
          position="absolute"
          top={0}
          left={0}
          zIndex={99}
          borderRadius="0 0 8px 8px"
          transform={mode === "absolute" ? "translateY(0)" : "translateY(54px)"}
        >
          {isLoadingImages && (
            <EmptyStateLoading loadingText={t('loading.loadingImages', {defaultValue: "Loading images..."})} />
          )}
          {imagesError && (
            <EmptyStateError
              title={t('errors.imagesLoadError.title', {defaultValue: "We couldn't load your images"})}
              subtitle={t('errors.imagesLoadError.subtitle', {defaultValue: "There was a problem fetching your generated images. Please try again later."})}
              refreshActions={mode === "absolute" && onCustomClose ? onCustomClose : closePhotoStudio}
            />
          )}
        </Box>
      )}
      <Box
        align="center"
        verticalAlign="middle"
        backgroundColor="D70"
        width="100%"
        height={mode === "absolute" ? "100%" : "calc(100% - 54px)"}
        borderRadius="0 0 8px 8px"
        opacity={overlayOpacity}
        transition="transform 0.3s ease"
      >
        <Box
          padding="SP4"
          height="100%"
          maxHeight="100%"
          position={
            editorSettings.isFileExplorerOpen ? "relative" : "absolute"
          }
          top={editorSettings.isFileExplorerOpen ? 0 : (mode === "absolute" ? 0 : 54)}
          left={0}
          transition="transform 0.3s ease"
        >
          <PanelImageExplorer
            showBackButton={mode === "absolute"}
            onBackClick={handleOnRequestClose}
          />
        </Box>

        <Box
          flexGrow={1}
          width="100%"
          direction="vertical"
          maxHeight="100%"
          height="100%"
          transition="transform 0.3s ease"
          overflow="hidden"
        >
          <StudioEditor />
        </Box>
      </Box>
    </>
  );

  // Absolute positioning mode - custom positioned container
  if (mode === "absolute") {
    // Don't render if not open in absolute mode
    if (!isPhotoStudioOpen) return null;

    return (
      <Box
        position="fixed"
        top={"54px"}
        left={0}
        right={0}
        bottom={0}
        width={"100%"}
        height={"calc(100% - 54px)"}
        zIndex={1000}
        gap={0}
        direction="vertical"
        backgroundColor="D80"
        borderRadius={8}
        className="modal-box-sizing"
      >
        {studioContent}
      </Box>
    );
  }

  // Default modal mode - using WDS Modal component
  return (
    <Modal
      screen="full"
      isOpen={isPhotoStudioOpen}
      onRequestClose={handleOnRequestClose}
    >
      <Box
        height={
          window.innerHeight < 900
            ? "calc(100dvh - 24px)"
            : "calc(100dvh - 120px)"
        }
        width={
          window.innerWidth < 900
            ? "calc(100dvw - 100px)"
            : "calc(100dvw - 120px)"
        }
        gap={0}
        direction="vertical"
        backgroundColor="D80"
        borderRadius={8}
        position="relative"
      >
        {studioContent}
      </Box>
    </Modal>
  );
};

export default PhotoStudio;
