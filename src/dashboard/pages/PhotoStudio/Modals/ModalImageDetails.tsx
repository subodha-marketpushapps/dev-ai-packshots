import React, { useState, useEffect, useCallback } from "react";
import StudioModalBase from "./StudioModalBase";
import {
  Box,
  Image,
  Divider,
  IconButton,
  Tooltip,
  Heading,
  Loader,
  Text,
  Badge,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useTranslation } from "react-i18next";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { ImageDetailsMode } from "../../../../interfaces";

const MODES: Record<"DETAILED" | "FULLSCREEN" | "COMPARE", ImageDetailsMode> = {
  DETAILED: "detailed",
  FULLSCREEN: "fullscreen",
  COMPARE: "compare",
};

// Memoized loading spinner
const LoadingSpinner: React.FC = React.memo(() => (
  <Box
    align="center"
    verticalAlign="middle"
    height={"100%"}
    width="100%"
    borderRadius={8}
    backgroundColor="rgba(223, 229, 235, 0.8)"
  >
    <Loader size="small" />
  </Box>
));

const ModalImageDetails: React.FC<{ studioMode?: "modal" | "absolute" }> =
  React.memo(({ studioMode = "modal" }) => {
    const { t } = useTranslation();
    const { editorSettings, setEditorSettings } = usePhotoStudio();
    const image = editorSettings.selectedImageDetails;
    const isModalOpened = editorSettings.isModalImageDetailsOpen;
    const initialMode = editorSettings.imageDetailsMode || MODES.DETAILED;

    // Local state for mode and details panel
    const [mode, setMode] = useState<ImageDetailsMode>(
      initialMode as ImageDetailsMode
    );
    const [showDetails, setShowDetails] = useState(
      initialMode === MODES.DETAILED
    );

    // Loading state for input image
    const [inputImageLoading, setInputImageLoading] = useState(false);

    // Set loading to true when modal opens or input image changes
    useEffect(() => {
      if (isModalOpened && image?.inputImageUrl) {
        setInputImageLoading(true);
      }
    }, [isModalOpened, image?.inputImageUrl]);

    // Sync local mode/showDetails with editorSettings.imageDetailsMode
    useEffect(() => {
      setMode(editorSettings.imageDetailsMode || MODES.DETAILED);
      setShowDetails(
        (editorSettings.imageDetailsMode || MODES.DETAILED) === MODES.DETAILED
      );
    }, [editorSettings.imageDetailsMode]);

    const handleOnClose = useCallback(() => {
      setEditorSettings((prev) => ({
        ...prev,
        selectedImageDetails: null,
        isModalImageDetailsOpen: false,
        imageDetailsMode: mode as ImageDetailsMode, // Save the last mode
      }));
    }, [setEditorSettings, mode]);

    // Close modal on Escape key
    useEffect(() => {
      if (!isModalOpened) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleOnClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpened, handleOnClose]);

    // Memoized details panel (must be before any return)
    const detailsPanel = React.useMemo(
      () => (
        <Box
          borderRadius={8}
          backgroundColor="D80"
          minWidth="320px"
          width="320px"
          maxHeight="100%"
          direction="vertical"
        >
          <Box padding="18px 24px" width="100%">
            <Heading size="medium">{t('photoStudio.generateInfo', {defaultValue: "Generate info"})}</Heading>
          </Box>
          <Divider />
          <Box
            padding="18px 24px"
            gap={2}
            width={"100%"}
            maxHeight={"100%"}
            overflow="auto"
            direction="vertical"
          >
            <Box height={200} position="relative">
              {inputImageLoading && <LoadingSpinner />}
              <Image
                src={image?.inputImageUrl || ""}
                alt={image?.id || "Image Preview"}
                width={"100%"}
                height={"200px"}
                fit="contain"
                onLoad={() => setInputImageLoading(false)}
                onError={() => setInputImageLoading(false)}
                onClick={() => setMode(MODES.COMPARE)}
                style={inputImageLoading ? { display: "none" } : {}}
              />
            </Box>
            <Box direction="vertical">
              <Heading size="tiny">{t('modals.imageDetails.prompt', {defaultValue: "Prompt"})}</Heading>
              <Text size="small" secondary>
                {image?.enhancedPrompt ? image.enhancedPrompt : t('modals.imageDetails.notAvailable', {defaultValue: "N/A"})}
              </Text>
            </Box>
            <Box direction="vertical">
              <Heading size="tiny">{t('modals.imageDetails.generateId', {defaultValue: "Generate Id"})}</Heading>
              <Text size="small" secondary>
                {image?.seed}
              </Text>
            </Box>
            <Box direction="vertical">
              <Heading size="tiny">{t('modals.imageDetails.createdAt', {defaultValue: "Created at"})}</Heading>
              <Text size="small" secondary>
                {image?.createdAt
                  ? new Date(image.createdAt).toLocaleString()
                  : t('modals.imageDetails.notAvailable', {defaultValue: "N/A"})}
              </Text>
            </Box>
          </Box>
        </Box>
      ),
      [image, inputImageLoading]
    );

    if (!isModalOpened || !image) return null;
    const isLiveImage = image.isLiveImage || false;

    console.log("image data", image);
    return (
      <StudioModalBase isOpen={isModalOpened} mode={studioMode}>
        <Box
          padding="SP5"
          gap="SP6"
          position="relative"
          width="100%"
          align="center"
        >
          <Box
            width="100%"
            height="100%"
            display="flex"
            direction="horizontal"
            gap="SP4"
          >
            {mode === MODES.COMPARE && (
              <Box flexGrow={1} width="100%" height="100%" position="relative">
                {inputImageLoading && <LoadingSpinner />}
                <Image
                  src={image?.inputImageUrl || ""}
                  alt={image.id || "Image Preview Input"}
                  width="100%"
                  height="auto"
                  fit="contain"
                  onLoad={() => setInputImageLoading(false)}
                  onError={() => setInputImageLoading(false)}
                  style={inputImageLoading ? { display: "none" } : {}}
                />
                <Box position="absolute" bottom={0} left={0} padding="SP2">
                  <Badge>{t('modals.imageDetails.initialImage', {defaultValue: "Initial Image"})}</Badge>
                </Box>
              </Box>
            )}
            <Box flexGrow={1} width="100%" height="100%" position="relative">
              <Image
                src={image?.imageUrl || ""}
                alt={image.id || "Image Preview"}
                width="100%"
                height="auto"
                fit="contain"
              />
              <Box position="absolute" bottom={0} left={0} padding="SP2">
                <Badge prefixIcon={<Icons.SparklesFilledSmall />}>
                  {t('modals.imageDetails.generatedImage', {defaultValue: "Generated Image"})}
                </Badge>
              </Box>
            </Box>
            {/* Show details panel only in detailed mode */}
            {!isLiveImage &&
              mode === MODES.DETAILED &&
              showDetails &&
              detailsPanel}
          </Box>

          {/* Top left: Close/back button */}
          <Box position="absolute" top={0} left={0} padding="SP2">
            <Tooltip
              content={t('photoStudio.goBack', {defaultValue: "Go back (Esc)"})}
              placement="bottom"
              size="small"
              appendTo="window"
              zIndex={9999999}
            >
              <IconButton
                skin="transparent"
                priority="primary"
                onClick={handleOnClose}
              >
                <Icons.ArrowLeft />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Top right: Mode switchers */}
          {!isLiveImage && (
            <Box position="absolute" top={0} right={0} padding="SP2" gap="SP2">
              <Tooltip
                content={t('photoStudio.fullscreen', {defaultValue: "Fullscreen"})}
                placement="bottom"
                size="small"
                appendTo="window"
                zIndex={9999999}
              >
                <IconButton
                  skin={mode === MODES.FULLSCREEN ? "standard" : "transparent"}
                  priority="primary"
                  onClick={() => {
                    setMode(MODES.FULLSCREEN);
                    setShowDetails(false);
                  }}
                >
                  <Icons.FullScreen />
                </IconButton>
              </Tooltip>
              <Tooltip
                content={t('photoStudio.compare', {defaultValue: "Compare"})}
                placement="bottom"
                size="small"
                appendTo="window"
                zIndex={9999999}
              >
                <IconButton
                  skin={mode === MODES.COMPARE ? "standard" : "transparent"}
                  priority="primary"
                  onClick={() => {
                    setMode(MODES.COMPARE);
                    setShowDetails(false);
                  }}
                >
                  <Icons.LayoutTwoColumns />
                </IconButton>
              </Tooltip>
              <Tooltip
                content={t('photoStudio.details', {defaultValue: "Details"})}
                placement="bottom"
                size="small"
                appendTo="window"
                zIndex={9999999}
              >
                <IconButton
                  skin={mode === MODES.DETAILED ? "standard" : "transparent"}
                  priority="primary"
                  onClick={() => {
                    setMode(MODES.DETAILED);
                    setShowDetails(true);
                  }}
                >
                  <Icons.ShortText />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </StudioModalBase>
    );
  });

export default ModalImageDetails;
