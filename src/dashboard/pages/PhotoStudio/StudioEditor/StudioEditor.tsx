import React, { useCallback, useState, useEffect, useRef } from "react";
import { Box } from "@wix/design-system";
import ErrorBoundary from "../ErrorBoundary";
import { ImageDropZone } from "./ImageUpload";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import PromptInput from "../EditorPromptInput";
import EditingMultiImages from "../EditorMultiImages";
import FooterNote from "./FooterNote";
import { useFluxEditHandlers } from "../../../hooks/useFluxEditHandlers";
import EditorCanvas from "../EditorCanvas";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";

const StudioEditor: React.FC = () => {
  const {
    confirmImages,
    selectedImages,
    editingImage,
    promptSettings,
    editorSettings,
    outputSettings,
    fileExplorerImages,
    addFileExplorerImage,
    updateFileExplorerImage,
    referenceImage,
    apiError,
    setLastApiRequest,
  } = usePhotoStudio();
  const { subscription, showUpgradeModal, deductCredits } = usePhotoStudio();
  const { addToast } = useStatusToast();

  // Use the new custom hook for API calls and canvas ref
  const { submitFluxEdit, submitFluxEditWithReferenceImage, canvasRef } =
    useFluxEditHandlers();

  const [promptInputState, setPromptInputState] = useState<{
    collapsed: boolean;
  }>({ collapsed: false });

  const studioEditorRef = useRef<HTMLDivElement>(null);
  const [studioEditorSize, setStudioEditorSize] = useState({
    width: 0,
    height: 0,
  });
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    function measure() {
      if (studioEditorRef.current) {
        const rect = studioEditorRef.current.getBoundingClientRect();
        setStudioEditorSize({ width: rect.width, height: rect.height });
      }
    }
    function handleResize() {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(measure, 1000);
    }
    measure();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleAddRectangle = useCallback(() => {
    canvasRef.current?.addRectangle();
  }, [canvasRef]);

  const handleAddCircle = useCallback(() => {
    canvasRef.current?.addCircle();
  }, [canvasRef]);

  // Multi-image and single-image edit handlers
  const handleFlexEditWithReferenceImage = async () => {
    if (!subscription) {
      addToast({
        content:
          "Subscription not available. Please refresh or contact support.",
        status: "error",
      });
      return;
    }
    if (!referenceImage || selectedImages.length === 0) return;
    const requiredCredits = selectedImages.length;
    if (subscription.creditsAvailable < requiredCredits) {
      showUpgradeModal();
      return;
    }
    // Optimistically deduct credits for UI
    deductCredits(requiredCredits);
    const newImageIds: string[] = Array.from(
      { length: selectedImages.length },
      () => `layer_${crypto.randomUUID()}`
    );
    await Promise.all(
      newImageIds.map((imageId, index) => {
        updateFileExplorerImage(selectedImages[index].id, {
          imageState: undefined,
        });
        addFileExplorerImage({
          ...selectedImages[index],
          id: imageId,
          imageState: "processing",
          isLiveImage: false,
          createdAt: Date.now(),
        });
        const isMultipleEdits =
          newImageIds.length > 1 || confirmImages?.length > 1;
        return submitFluxEditWithReferenceImage(
          { ...selectedImages[index] },
          imageId,
          isMultipleEdits
        );
      })
    );
  };

  const handleFluxEdit = async () => {
    if (!subscription) {
      addToast({
        content:
          "Subscription not available. Please refresh or contact support.",
        status: "error",
      });
      return;
    }
    const numberOfFlexEdits = outputSettings.batchSize || 1;
    if (!editingImage) return;
    const requiredCredits = numberOfFlexEdits;
    if (subscription.creditsAvailable < requiredCredits) {
      showUpgradeModal();
      return;
    }
    // Optimistically deduct credits for UI
    deductCredits(requiredCredits);
    setLastApiRequest({
      promptSettings,
      outputSettings,
      editingImage,
    });
    if (editingImage.id) {
      updateFileExplorerImage(editingImage.id, { imageState: undefined });
    }
    const newLayerIds: string[] = Array.from(
      { length: numberOfFlexEdits },
      () => `layer_${crypto.randomUUID()}`
    );
    newLayerIds.forEach((layerId) => {
      addFileExplorerImage({
        ...editingImage,
        id: layerId,
        imageState: "processing",
        isLiveImage: false,
        createdAt: Date.now(),
      });
      const isMultipleEdits =
        newLayerIds.length > 1 || confirmImages?.length > 1;
      submitFluxEdit({ ...editingImage }, layerId, isMultipleEdits);
    });
  };

  const noMoreSpaceFor2Col =
    studioEditorSize.width < 600 && editorSettings.isFileExplorerOpen;

  const isImageFileAvailable = !!(editingImage?.file || editingImage?.imageUrl);
  const isImageProcessing = fileExplorerImages.some(
    (img) =>
      typeof img.imageState === "string" &&
      ["processing", "deleting"].includes(img.imageState)
  );
  const isGenerating = fileExplorerImages.some(
    (img) => img.imageState === "processing"
  );
  const showMultiStack = fileExplorerImages.some(
    (img) =>
      typeof img.imageState === "string" &&
      ["processing", "confirm", "selected", "uploaded", "deleting"].includes(
        img.imageState
      )
  );
  const allProcessingImages = fileExplorerImages.filter(
    (img) =>
      typeof img.imageState === "string" &&
      ["processing", "confirm", "selected", "uploaded", "deleting"].includes(
        img.imageState
      )
  );
  const showInputPrompts =
    (isImageFileAvailable || referenceImage) && !isImageProcessing;
  const showCanvas = isImageFileAvailable && !showMultiStack;
  const showUploadZone =
    !isImageFileAvailable && !showMultiStack && !isGenerating;

  return (
    <ErrorBoundary>
      <Box
        ref={studioEditorRef}
        direction="vertical"
        height={"100%"}
        transition="transform 0.3s ease"
      >
        {apiError && (
          <Box color="R10" marginBottom={1}>
            {apiError}
          </Box>
        )}
        <Box
          verticalAlign="top"
          width="100%"
          overflow="auto"
          maxHeight="100%"
          align="center"
          flexGrow={1}
          className="StudioEditor"
        >
          <Box
            width="100%"
            height={"100%"}
            position="relative"
            transition="transform 0.3s ease"
            maxWidth="69vw"
            minHeight="60vh"
            paddingBottom={
              showInputPrompts && !promptInputState.collapsed
                ? "min(14vh , 150px)"
                : 0
            }
            verticalAlign={
              !showMultiStack ||
              (showMultiStack &&
                allProcessingImages.length <= 2 &&
                !noMoreSpaceFor2Col)
                ? "middle"
                : "top"
            }
          >
            {showUploadZone && <ImageDropZone />}
            {showMultiStack && (
              <EditingMultiImages
                aspectRatio={outputSettings.aspectRatio || "1/1"}
              />
            )}
            <EditorCanvas
              ref={canvasRef}
              canvasHeight="45vh"
              showAddRectangleButton={false}
              isCanvasActive={showCanvas}
            />
          </Box>
        </Box>
        {(isGenerating || showInputPrompts) && (
          <Box
            verticalAlign="middle"
            width="100%"
            align="center"
            transition="transform 0.3s ease"
            padding="SP4"
            paddingTop={0}
            minHeight={60}
            position="relative"
          >
            <div
              style={{
                background:
                  "linear-gradient(rgb(255 255 255 / 0%) 0%, rgb(236 239 243) 100%)",
                width: "calc(100% - 24px)",
                bottom: "58px",
                position: "absolute",
                height: promptInputState.collapsed ? "24px" : "200px",
                left: "12px",
                borderRadius: "12px",
                pointerEvents: "none",
              }}
            />
            {isGenerating && <FooterNote />}
            {showInputPrompts && (
              <PromptInput
                onAddRectangle={handleAddRectangle}
                onAddCircle={handleAddCircle}
                onGenerateClick={
                  referenceImage
                    ? handleFlexEditWithReferenceImage
                    : handleFluxEdit
                }
                promptInputState={promptInputState}
                setPromptInputState={setPromptInputState}
              />
            )}
          </Box>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default StudioEditor;
