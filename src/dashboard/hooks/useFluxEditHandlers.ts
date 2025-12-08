/**
 * useFluxEditHandlers
 *
 * This custom React hook encapsulates all logic for handling image editing API calls
 * in the AI Product Images Photo Studio. It provides imperative handlers for both single-image
 * and reference-image editing, manages loading and error states, and ensures UI feedback
 * and state updates are handled consistently.
 *
 * Responsibilities:
 * - Prepare and upload images from the canvas for editing via the Flux API.
 * - Handle both direct canvas edits and reference-image-based edits.
 * - Manage loading overlays and error toasts for user feedback.
 * - Update the file explorer and editor state with new or failed image generations.
 *
 * Usage:
 *   const { submitFluxEdit, submitFluxEditWithReferenceImage, canvasRef } = useFluxEditHandlers();
 *   // Use submitFluxEdit or submitFluxEditWithReferenceImage as needed in your UI logic.
 */
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePhotoStudio } from "../services/providers/PhotoStudioProvider";
import { useStatusToast } from "../services/providers/StatusToastProvider";
import {
  useFluxEditApi,
  useFluxEnhanceApi,
} from "../pages/PhotoStudio/StudioEditor/fluxEditApi";
import { v4 as uuidv4 } from "uuid";
import {
  PROCESS_STATES,
  Layer,
  FluxImageEditorRequest,
  FluxImageEditorResponse,
  GeneratedImagePreview,
} from "../../interfaces";
import type { EditorCanvasHandle } from "../pages/PhotoStudio/EditorCanvas/EditorCanvas";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_ALL_GENERATED_IMAGES } from "./useGeneratedImages";
import { useSubscription } from "./useSubscription";
import type { TFunction } from "i18next";

/**
 * Helper to show an error toast.
 */
function showErrorToast(
  addToast: (args: { content: string; status: "error" | "warning" }) => void,
  message: string,
  status: "error" | "warning" = "error"
) {
  addToast({ content: message, status });
}

/**
 * Helper to expand error messages for better user feedback.
 * This is used to provide more user-friendly error messages based on specific error patterns.
 */
function expandErrorMessage(error: string, t: TFunction): string {
  // Expand error message if it contains specific patterns
  if (error.includes("Content Moderated (Safety Filter)")) {
    return t("fluxEditHandlers.contentModerated", {
      defaultValue:
        "Your image was moderated by our safety filter. Please try a different AI prompt instruction or image.",
    });
  }
  return error;
}

/**
 * Helper to extract an image from the canvas with upscaling/aspect ratio.
 */
async function extractCanvasImage(
  canvasRef: React.RefObject<EditorCanvasHandle>,
  imageLayer: Layer,
  autoUpscaling: boolean,
  stringAspectRatio: string
): Promise<File | null> {
  const applyUpscaling =
    autoUpscaling && (imageLayer.width < 1000 || imageLayer.height < 1000);
  const aspectRatio =
    stringAspectRatio === "original"
      ? undefined
      : stringAspectRatio
          .split(":")
          .map(Number)
          .reduce((w, h) => w / h);
  
  const targetWidth = applyUpscaling ? imageLayer.width * 2 : imageLayer.width;
  
  return (
    canvasRef.current?.getCanvasAsFile({
      width: targetWidth,
      aspectRatio,
    }) ?? null
  );
}

/**
 * Helper to extract an image from a URL with upscaling/aspect ratio.
 */
async function extractImageFromUrl(
  canvasRef: React.RefObject<EditorCanvasHandle>,
  imageUrl: string,
  width: number,
  height: number,
  autoUpscaling: boolean,
  stringAspectRatio: string
): Promise<File | null> {
  const applyUpscaling = autoUpscaling && (width < 1000 || height < 1000);
  const aspectRatio =
    stringAspectRatio === "original"
      ? undefined
      : stringAspectRatio
          .split(":")
          .map(Number)
          .reduce((w, h) => w / h);
  
  const targetWidth = applyUpscaling ? width * 2 : width;
  
  return await (canvasRef.current?.getImageUrlAsFile(imageUrl, {
    width: targetWidth,
    aspectRatio,
  }) ?? null);
}

export const useFluxEditHandlers = () => {
  // Context/state hooks
  const {
    outputSettings,
    promptSettings,
    updateFileExplorerImage,
    selectExplorerImageForEditing,
    setApiLoading,
    referenceImage,
    setApiImagePreparing,
    checkShouldShowFeedback,
  } = usePhotoStudio();
  const { addToast } = useStatusToast();
  const { t } = useTranslation();
  const { mutate: fluxEditApiMutate } = useFluxEditApi();
  const { mutate: fluxEnhanceApiMutate } = useFluxEnhanceApi();
  const { refetch: refetchSubscription } = useSubscription();
  // Ref to the canvas component, used for extracting image data
  const canvasRef = useRef<EditorCanvasHandle | null>(null);
  const queryClient = useQueryClient();

  /**
   * Handles the process of preparing the current canvas image and sending it to the Flux API for editing.
   * This is used for direct canvas edits (not reference-image-based).
   */
  const submitFluxEdit = useCallback(
    async (
      imageLayer: Layer,
      layerId: string,
      isMultiBatch = false
    ): Promise<void> => {
      const { autoUpscaling, aspectRatio: stringAspectRatio } = outputSettings;
      setApiImagePreparing(true);
      let canvasImage: File | null = null;
      try {
        canvasImage = await extractCanvasImage(
          canvasRef,
          imageLayer,
          autoUpscaling,
          stringAspectRatio
        );
      } finally {
        setApiImagePreparing(false);
      }
      if (!canvasImage) {
        showErrorToast(
          addToast,
          t("fluxEditHandlers.noImageSelected", {
            defaultValue: "No image selected for processing.",
          })
        );
        updateFileExplorerImage(layerId, { imageState: PROCESS_STATES.ERROR });
        return;
      }
      const requestBody: FluxImageEditorRequest = {
        image: canvasImage,
        task: "change-bg",
        prompt: promptSettings.prompt,
        outputFormat: "png",
        productId: imageLayer?.productId || "",
        parentTaskId: imageLayer?.parentTaskId || uuidv4(),
        qualityTags: promptSettings?.qualityTags,
        background: promptSettings?.background,
        position: promptSettings?.position,
      };
      setApiLoading(true);
      try {
        let response: FluxImageEditorResponse;
        if (outputSettings.editingMode === "enhance") {
          response = await fluxEnhanceApiMutate(requestBody);
        } else {
          response = await fluxEditApiMutate(requestBody);
        }
        if (response.generationStatus === "COMPLETED") {
          const img = new window.Image();
          img.onload = () => {
            const updatedLayerData: Layer = {
              ...response,
              id: response.id,
              file: null,
              imageUrl: response.imageUrl || "",
              width: img.naturalWidth,
              height: img.naturalHeight,
              originalWidth: img.naturalWidth,
              originalHeight: img.naturalHeight,
              productId: response.productId || undefined,
              parentTaskId: response.parentTaskId,
              comments: response.comments || "",
              enhancedPrompt: response.enhancedPrompt || undefined,
              imageState: isMultiBatch ? "confirm" : "edit",
            };
            if (isMultiBatch) {
              updatedLayerData.isLiveImage = false;
              updateFileExplorerImage(layerId, updatedLayerData);
            } else {
              selectExplorerImageForEditing(layerId, updatedLayerData);
            }
            // Invalidate and refetch all generated images after successful edit
            queryClient.invalidateQueries({
              queryKey: [QUERY_ALL_GENERATED_IMAGES],
            });
            refetchSubscription(); // Refetch subscription after successful edit
            checkShouldShowFeedback();
          };
          img.onerror = () => {
            updateFileExplorerImage(layerId, {
              imageState: PROCESS_STATES.ERROR,
            });
            showErrorToast(
              addToast,
              t("fluxEditHandlers.generatedImageFailedToLoad", {
                defaultValue: "Generated image failed to load.",
              }),
              "warning"
            );
          };
          setApiLoading(false);
          img.src = response.imageUrl || "";
        } else {
          updateFileExplorerImage(layerId, {
            imageState: PROCESS_STATES.ERROR,
          });
          showErrorToast(
            addToast,
            t("fluxEditHandlers.failedToGenerateImage", {
              defaultValue: "Failed to generate image{{errorDetails}}",
              errorDetails:  "",
            })
          );
          setApiLoading(false);
        }
      } catch (error: any) {
        updateFileExplorerImage(layerId, { imageState: PROCESS_STATES.ERROR });
        showErrorToast(
          addToast,
          error.message ||
            t("fluxEditHandlers.errorGeneratingImage", {
              defaultValue: "Error generating image",
            })
        );
        setApiLoading(false);
      }
    },
    [
      fluxEditApiMutate,
      fluxEnhanceApiMutate,
      addToast,
      outputSettings,
      promptSettings,
      updateFileExplorerImage,
      selectExplorerImageForEditing,
      setApiLoading,
      setApiImagePreparing,
      queryClient,
      refetchSubscription,
      checkShouldShowFeedback,
      t,
    ]
  );

  /**
   * Handles the process of preparing an image using a reference image and sending it to the Flux API.
   * This is used for reference-image-based edits (e.g., style transfer or prompt chaining).
   */
  const submitFluxEditWithReferenceImage = useCallback(
    async (
      imageLayer: GeneratedImagePreview,
      layerId: string,
      isMultiBatch = false
    ): Promise<void> => {
      if (!referenceImage) {
        showErrorToast(
          addToast,
          t("fluxEditHandlers.noReferenceImageSelected", {
            defaultValue: "No reference image selected for processing.",
          })
        );
        return;
      }
      setApiImagePreparing(true);
      if (!imageLayer.imageUrl || typeof imageLayer.imageUrl !== "string") {
        showErrorToast(
          addToast,
          t("fluxEditHandlers.invalidImageUrl", {
            defaultValue: "Image URL is missing or invalid.",
          })
        );
        updateFileExplorerImage(layerId, { imageState: PROCESS_STATES.ERROR });
        setApiImagePreparing(false);
        return;
      }
      // Load image to get dimensions
      let width = 0;
      let height = 0;
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            resolve();
          };
          img.onerror = reject;
          img.src = imageLayer.imageUrl || "";
        });
      } catch {
        showErrorToast(
          addToast,
          t("fluxEditHandlers.unknownImageSize", {
            defaultValue: "Could not determine image size.",
          })
        );
        updateFileExplorerImage(layerId, { imageState: PROCESS_STATES.ERROR });
        setApiImagePreparing(false);
        return;
      }
      // Extract image as file from URL
      const { autoUpscaling, aspectRatio: stringAspectRatio } = outputSettings;
      let canvasImage: File | null = null;
      try {
        canvasImage = await extractImageFromUrl(
          canvasRef,
          imageLayer.imageUrl,
          width,
          height,
          autoUpscaling,
          stringAspectRatio
        );
      } finally {
        setApiImagePreparing(false);
      }
      if (!canvasImage) {
        showErrorToast(
          addToast,
          t("fluxEditHandlers.noImageSelected", {
            defaultValue: "No image selected for processing.",
          })
        );
        updateFileExplorerImage(layerId, { imageState: PROCESS_STATES.ERROR });
        return;
      }
      // Build API request (combine prompts)
      const prompt = `${referenceImage.enhancedPrompt || ""}${
        imageLayer.customPrompt || ""
      }`;
      let requestBody: FluxImageEditorRequest = {
        image: canvasImage,
        task: "change-bg",
        prompt,
        outputFormat: "png",
        productId: imageLayer?.productId || "",
        parentTaskId: imageLayer?.parentTaskId || uuidv4(),
        qualityTags: referenceImage.qualityTags || promptSettings?.qualityTags,
        background: referenceImage.background || promptSettings?.background,
        position: referenceImage.position || promptSettings?.position,
        seed: referenceImage?.seed ? String(referenceImage.seed) : undefined,
      };
      setApiLoading(true);
      updateFileExplorerImage(referenceImage.id, { imageState: undefined });
      try {
        let response: FluxImageEditorResponse;
        if (outputSettings.editingMode === "enhance") {
          response = await fluxEnhanceApiMutate(requestBody);
        } else {
          response = await fluxEditApiMutate(requestBody);
        }
        if (response.generationStatus === "COMPLETED") {
          const img = new window.Image();
          img.onload = () => {
            const updatedLayerData: Layer = {
              ...response,
              id: response.id,
              file: null,
              imageUrl: response.imageUrl || "",
              width: img.naturalWidth,
              height: img.naturalHeight,
              originalWidth: img.naturalWidth,
              originalHeight: img.naturalHeight,
              productId: response.productId || undefined,
              parentTaskId: response.parentTaskId,
              comments: response.comments || "",
              enhancedPrompt: response.enhancedPrompt || undefined,
              imageState: isMultiBatch ? "confirm" : "edit",
            };
            if (isMultiBatch) {
              updatedLayerData.isLiveImage = false;
              updateFileExplorerImage(layerId, updatedLayerData);
            } else {
              selectExplorerImageForEditing(layerId, updatedLayerData);
            }
            // Invalidate and refetch all generated images after successful edit
            queryClient.invalidateQueries({
              queryKey: [QUERY_ALL_GENERATED_IMAGES],
            });
            refetchSubscription(); // Refetch subscription after successful edit
            checkShouldShowFeedback();
          };
          img.onerror = () => {
            updateFileExplorerImage(layerId, {
              imageState: PROCESS_STATES.ERROR,
            });
            showErrorToast(
              addToast,
              t("fluxEditHandlers.generatedImageFailedToLoad", {
                defaultValue: "Generated image failed to load.",
              }),
              "warning"
            );
          };
          img.src = response.imageUrl || "";
          setApiLoading(false);
        } else {
          updateFileExplorerImage(layerId, {
            imageState: PROCESS_STATES.ERROR,
          });
          showErrorToast(
            addToast,
            t("fluxEditHandlers.failedToGenerateImage", {
              defaultValue: "Failed to generate image{{errorDetails}}",
              errorDetails: "",
            })
          );
          setApiLoading(false);
        }
      } catch (error: any) {
        updateFileExplorerImage(layerId, { imageState: PROCESS_STATES.ERROR });
        showErrorToast(
          addToast,
          error.message ||
            t("fluxEditHandlers.errorGeneratingImage", {
              defaultValue: "Error generating image",
            })
        );
        setApiLoading(false);
      }
    },
    [
      fluxEditApiMutate,
      fluxEnhanceApiMutate,
      addToast,
      outputSettings,
      promptSettings,
      updateFileExplorerImage,
      selectExplorerImageForEditing,
      setApiLoading,
      setApiImagePreparing,
      referenceImage,
      queryClient,
      refetchSubscription,
      checkShouldShowFeedback,
      t,
    ]
  );

  // Expose handlers and canvas ref for use in StudioEditor
  return {
    submitFluxEdit,
    submitFluxEditWithReferenceImage,
    canvasRef,
  };
};

// Export helpers for testing
export { extractCanvasImage, extractImageFromUrl, showErrorToast };
