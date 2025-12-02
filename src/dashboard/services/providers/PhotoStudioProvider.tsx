/**
 * PhotoStudioProvider
 *
 * This provider manages all state, API actions, and UI logic for the AI Product Images Photo Studio experience.
 *
 * Responsibilities:
 * - Centralizes all editor, image, subscription, and feedback state for the Photo Studio.
 * - Handles all API actions (publishing, deleting, refreshing, etc.) and loading/error states.
 * - Manages modal and navigation state for the studio UI.
 * - Exposes robust, always-fresh subscription and credit management.
 * - Centralizes feedback prompt logic for user reviews, making it accessible anywhere in the app.
 * - Provides a single source of truth for all Photo Studio context consumers.
 *
 * Usage:
 *   Wrap your app (or dashboard) with <PhotoStudioProvider>.
 *   Use the usePhotoStudio() hook to access all state and actions.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEditorActions } from "../../hooks/useEditorActions";
import PhotoStudio from "../../pages/PhotoStudio";
import * as generatedImagesApi from "../api/generated-images";
import {
  GeneratedImagePreview,
  PromptSettings,
  OutputSettings,
  PROCESS_STATES,
  GeneratedImage,
} from "../../../interfaces";
import { wixStoreProductsState } from "../../services/state";
import { useRecoilState } from "recoil";
import {
  NormalizedMediaItem,
  NormalizedProduct,
} from "../../utils/catalogNormalizer";
import { subscriptionState } from "../../services/state/subscriptionState";
import {
  useWixStoreProducts,
  QUERY_WIX_STORE_PRODUCTS_INFINITE,
} from "../../hooks/useWixStoreProducts";
import { fetchWixStoreProduct } from "../api/wix-store-products";

import { v4 as uuidv4 } from "uuid";
import { useStatusToast } from "./StatusToastProvider";
import { useProducts } from "../../hooks/useProductMedia";
import { useGeneratedImages } from "../../hooks/useGeneratedImages";
import { settingsState } from "../../services/state";
import { generatedImagesState } from "../state/generatedImagesState";
import { updateSettings } from "../api/settings";
import { sendWixBiImagePublishedEvent } from "../api/wix-bi-events";
import { wixSiteDataState } from "../state";

export interface PhotoStudioContextType {
  // State
  sortedFileExplorerImages: ReturnType<
    typeof useEditorActions
  >["sortedFileExplorerImages"];
  sortedLiveImages: GeneratedImagePreview[]; // Add sortedLiveImages to the context type
  sortedDraftImages: GeneratedImagePreview[]; // Add sortedDraftImages to the context type
  referenceImage: ReturnType<typeof useEditorActions>["referenceImage"];
  processingImages: ReturnType<typeof useEditorActions>["processingImages"];
  selectedImages: ReturnType<typeof useEditorActions>["selectedImages"];
  confirmImages: ReturnType<typeof useEditorActions>["confirmImages"];
  editingImage: ReturnType<typeof useEditorActions>["editingImage"];
  editorSettings: ReturnType<typeof useEditorActions>["editorSettings"];
  setEditorSettings: ReturnType<typeof useEditorActions>["setEditorSettings"];
  fileExplorerImages: ReturnType<typeof useEditorActions>["fileExplorerImages"];
  selectedImageId: ReturnType<typeof useEditorActions>["selectedImageId"];
  updateLayerState: ReturnType<typeof useEditorActions>["updateLayerState"];
  updateFileExplorerImage: ReturnType<
    typeof useEditorActions
  >["updateFileExplorerImage"];
  markGeneratedImageForCopyEdit: ReturnType<
    typeof useEditorActions
  >["markGeneratedImageForCopyEdit"];
  addFileExplorerImage: ReturnType<
    typeof useEditorActions
  >["addFileExplorerImage"];
  deleteFileExplorerImage: ReturnType<
    typeof useEditorActions
  >["deleteFileExplorerImage"];
  selectExplorerImageForEditing: ReturnType<
    typeof useEditorActions
  >["selectExplorerImageForEditing"];
  updateCanvasImage: ReturnType<typeof useEditorActions>["updateCanvasImage"];
  showImageDetails: ReturnType<typeof useEditorActions>["showImageDetails"];
  undo: ReturnType<typeof useEditorActions>["undo"];
  redo: ReturnType<typeof useEditorActions>["redo"];
  canUndo: boolean;
  canRedo: boolean;
  setEditingImage: ReturnType<typeof useEditorActions>["setEditingImage"];
  openPhotoStudio: (params: {
    type?: StudioTypes;
    productId?: string;
    initialImageId?: string;
    imageType?: "live" | "draft";
    preloadedProduct?: NormalizedProduct;
    isModalContext?: boolean; // Flag for single product modal with limited space
  }) => Promise<void>;
  closePhotoStudio: () => void;
  isPhotoStudioOpen: boolean;
  studioType: StudioTypes;
  productId?: string;
  initialSelectedImageId?: string;
  isModalContext: boolean; // For single product modal with limited space

  // API Actions
  publishImage: (
    image: GeneratedImagePreview,
    productId: string
  ) => Promise<void>;
  unpublishImage: (
    image: GeneratedImagePreview,
    productId: string
  ) => Promise<void>;
  deleteImage: (image: GeneratedImagePreview) => Promise<void>;

  // API Status
  setApiLoading: (val: boolean) => void;
  apiLoading: boolean;
  apiError: string | null;

  // Enhanced Error Management
  errorState: {
    api: string | null;
    images: string | null;
    subscription: string | null;
  };
  setError: (
    errorType: "api" | "images" | "subscription",
    error: string
  ) => void;
  clearError: (errorType: "api" | "images" | "subscription") => void;

  // Consolidated Loading State
  loadingState: {
    api: boolean;
    canvas: boolean;
    imagePreparing: boolean;
    images: boolean;
  };

  // Computed Loading States for Convenience
  isAnyLoading: boolean;

  // New state
  promptSettings: PromptSettings;
  setPromptSettings: React.Dispatch<React.SetStateAction<PromptSettings>>;
  outputSettings: OutputSettings;
  setOutputSettings: React.Dispatch<React.SetStateAction<OutputSettings>>;

  // New state
  isLoadingImages: boolean;
  imagesError: any;
  setImagesLoaded: () => void; // NEW: signal from canvas when images are fully loaded

  // NEW:
  isLoadingCanvas: boolean;
  setIsLoadingCanvas: (val: boolean) => void;

  // NEW:
  isApiImagePreparing: boolean;
  setApiImagePreparing: (val: boolean) => void;

  // Subscription data
  subscription:
  | import("../../../interfaces/custom/subscription").SubscriptionResponse
  | null
  | undefined;
  deductCredits: (amount: number) => void;

  // Upgrade modal state
  isUpgradeModalOpen: boolean;
  showUpgradeModal: () => void;
  hideUpgradeModal: () => void;
  // Unpublish modal state
  isUnpublishModalOpen: boolean;
  showUnpublishModal: () => void;
  hideUnpublishModal: () => void;
  // Refresh product images
  refreshProductImages: () => void;

  storeProducts: NormalizedProduct[]; // Expose store products for product selection

  // Change productId and refresh images
  changeProductId: (newProductId: string) => Promise<void>;

  // New: publishing state from mutation
  isPublishing: boolean;

  // The current product object for the selected productId
  currentProduct?: NormalizedProduct;

  // Feedback logic centralized here
  shouldShowFeedback: boolean;
  checkShouldShowFeedback: () => void; // Expose feedback check function
  handleFeedbackSkip: () => void;
  handleFeedbackSubmit: (onFeedbackSubmit?: () => void) => void;

  // Reference image selection/upload limit helpers
  getReferenceImageCount: () => number;
  canAddReferenceImage: () => boolean;

  // Add lastApiRequest to context
  lastApiRequest: {
    promptSettings: PromptSettings;
    outputSettings: OutputSettings;
    editingImage: GeneratedImagePreview | null;
  } | null;
  setLastApiRequest: React.Dispatch<
    React.SetStateAction<{
      promptSettings: PromptSettings;
      outputSettings: OutputSettings;
      editingImage: GeneratedImagePreview | null;
    } | null>
  >;
}

export type StudioTypes = "general" | "product";

const PhotoStudioContext = createContext<PhotoStudioContextType | undefined>(
  undefined
);

// Custom hook for modal state management with better memoization
const useModalState = () => {
  const [modalState, setModalState] = useState({
    isPhotoStudioOpen: false,
    studioType: "general" as StudioTypes,
    productId: undefined as string | undefined,
    initialSelectedImageId: "",
  });

  // Memoize the setter to prevent unnecessary re-renders
  const setModalStateMemo = useCallback(
    (
      updater:
        | typeof modalState
        | ((prev: typeof modalState) => typeof modalState)
    ) => {
      setModalState(updater);
    },
    []
  );

  return {
    modalState,
    setModalState: setModalStateMemo,
  };
};

export const PhotoStudioProvider: React.FC<{
  children: React.ReactNode;
  hidePhotoStudio?: boolean;
  photoStudioMode?: "modal" | "absolute";
  showCloseButton?: boolean;
  onCustomClose?: () => void;
}> = ({
  children,
  hidePhotoStudio = false,
  photoStudioMode = "modal",
  showCloseButton = true,
  onCustomClose,
}) => {
    const queryClient = useQueryClient();

    // --- Editor/Image State ---
    const { modalState, setModalState } = useModalState();
    const editorActions = useEditorActions();
    const {
      sortedFileExplorerImages,
      processingImages,
      referenceImage,
      selectedImages,
      confirmImages,
      editingImage,
      editorSettings,
      setEditorSettings,
      updateLayerState,
      fileExplorerImages,
      selectedImageId,
      updateFileExplorerImage,
      markGeneratedImageForCopyEdit,
      addFileExplorerImage,
      deleteFileExplorerImage,
      selectExplorerImageForEditing,
      updateCanvasImage,
      undo,
      redo,
      canUndo,
      canRedo,
      setEditingImage,
      showImageDetails,
    } = editorActions;

    // Modal context flag - true when opened in single product modal
    const [isModalContext, setIsModalContext] = useState(false);

    // Enhanced consolidated loading states to prevent unnecessary re-renders
    const [loadingState, setLoadingState] = useState({
      canvas: false,
      imagePreparing: false,
      images: false,
      api: false,
    });

    // Consolidated error state for better error management
    const [errorState, setErrorState] = useState({
      api: null as string | null,
      images: null as string | null,
      subscription: null as string | null,
    });

    // Memoized loading state updaters for better performance
    const updateLoadingState = useCallback(
      (key: keyof typeof loadingState, value: boolean) => {
        setLoadingState((prev) => ({ ...prev, [key]: value }));
      },
      []
    );

    const setIsLoadingCanvas = useCallback(
      (val: boolean) => updateLoadingState("canvas", val),
      [updateLoadingState]
    );
    const setApiImagePreparing = useCallback(
      (val: boolean) => updateLoadingState("imagePreparing", val),
      [updateLoadingState]
    );
    const setIsLoadingImages = useCallback(
      (val: boolean) => updateLoadingState("images", val),
      [updateLoadingState]
    );
    const setApiLoading = useCallback(
      (val: boolean) => updateLoadingState("api", val),
      [updateLoadingState]
    );

    // Memoized error state updaters
    const setError = useCallback(
      (errorType: keyof typeof errorState, error: string) => {
        setErrorState((prev) => ({ ...prev, [errorType]: error }));
      },
      []
    );

    const clearError = useCallback((errorType: keyof typeof errorState) => {
      setErrorState((prev) => ({ ...prev, [errorType]: null }));
    }, []);

    // Computed loading states for convenience and backwards compatibility
    const computedLoadingStates = useMemo(
      () => ({
        isAnyLoading: Object.values(loadingState).some(Boolean),
        isLoadingCanvas: loadingState.canvas,
        isApiImagePreparing: loadingState.imagePreparing,
        isLoadingImages: loadingState.images,
        apiLoading: loadingState.api,
      }),
      [loadingState]
    );

    const [currentProduct, setCurrentProduct] = useState<NormalizedProduct>();

    // --- API/Subscription State ---
    const [storeProducts] = useRecoilState(wixStoreProductsState);
    const [subscription, setSubscription] = useRecoilState(subscriptionState);
    const [settings, setSettings] = useRecoilState(settingsState);
    const [allGeneratedImages] = useRecoilState(generatedImagesState);
    const [wixSiteData] = useRecoilState(wixSiteDataState);
    // Only fetch ALL products in dashboard context, not in modal context
    const wixStoreProductsQuery = useWixStoreProducts({
      enabled: !hidePhotoStudio, // Disable ALL products fetch in modal context
    });
    const { addProductMedia } = useProducts();
    const { bulkDeleteGeneratedImages } = useGeneratedImages();
    const { addToast } = useStatusToast();

    // --- UI/Modal State ---
    const [apiError, setApiError] = useState<string | null>(null);
    const [imagesError, setImagesError] = useState<any>(null);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(
      subscription?.creditsAvailable !== undefined &&
      subscription.creditsAvailable <= 3
    );
    const [isUnpublishModalOpen, setUnpublishModalOpen] = useState(false);
    const showUnpublishModal = useCallback(() => setUnpublishModalOpen(true), []);
    const hideUnpublishModal = useCallback(
      () => setUnpublishModalOpen(false),
      []
    );
    const showUpgradeModal = useCallback(() => setUpgradeModalOpen(true), []);
    const hideUpgradeModal = useCallback(() => setUpgradeModalOpen(false), []);
    const isPublishing = !!addProductMedia.isLoading;

    // --- Prompt/Output State ---
    const [promptSettings, setPromptSettings] = useState<PromptSettings>({
      qualityTags: [],
      position: "original",
      background: "ai",
      prompt: "",
    });
    const [outputSettings, setOutputSettings] = useState<OutputSettings>({
      editingMode: "enhance",
      batchSize: 2,
      autoUpscaling: true,
      aspectRatio: "original",
    });

    // --- Last API Request State ---
    const [lastApiRequest, setLastApiRequest] = useState<{
      promptSettings: PromptSettings;
      outputSettings: OutputSettings;
      editingImage: GeneratedImagePreview | null;
    } | null>(null);

    // --- Utility: Mark images loaded (canvas ready) ---
    const setImagesLoaded = useCallback(() => {
      setIsLoadingImages(false);
      setIsLoadingCanvas(false);
    }, []);

    // --- Subscription/Credit Management ---
    const deductCredits = useCallback(
      (amount: number) => {
        setSubscription((prev) =>
          prev && typeof prev.creditsAvailable === "number"
            ? {
              ...prev,
              creditsAvailable: Math.max(0, prev.creditsAvailable - amount),
            }
            : prev
        );
      },
      [setSubscription]
    );

    // --- Image Fetch/Refresh Logic ---
    const fetchImages = useCallback(
      async (
        type: StudioTypes,
        productId?: string,
        preloadedProduct?: NormalizedProduct
      ) => {
        setIsLoadingImages(true);
        setIsLoadingCanvas(true);
        clearError("images");
        try {
          let rawImages = [];
          let images: GeneratedImagePreview[] = [];

          if (type === "product" && productId) {
            const data = await generatedImagesApi.getGeneratedImagesByProductId(
              productId
            );
            rawImages = data || [];
          } else {
            const data = await generatedImagesApi.getAllGeneratedImages();
            rawImages = data || [];
          }

          const convertMediaToGeneratedImages = (
            mediaItems: NormalizedMediaItem[]
          ): GeneratedImagePreview[] => {
            // Assign order based on index (preserve order from backend)
            return mediaItems.map((media, idx) => ({
              id: media.id || uuidv4(),
              parentTaskId: null,
              productId: productId,
              imageUrl: media.imageUrl || media.thumbnailUrl || "",
              isLiveImage: true,
              createdAt: Date.now(),
              order: idx, // assign order
            }));
          };

          const covertGenerateImagesToPreview = (
            generatedImages: GeneratedImage[]
          ): GeneratedImagePreview[] =>
            generatedImages.map((img) => ({
              ...img,
              imageState: PROCESS_STATES.NONE,
              customPrompt: "",
              seed: img.seed || null,
              isLiveImage: false,
              createdAt: img.createdAt || Date.now(),
            }));

          if (type === "product" && productId) {
            let selectedProduct = preloadedProduct;

            // Only search in storeProducts or fetch if we don't have a preloaded product
            if (!selectedProduct) {
              selectedProduct = storeProducts.find(
                (product) => product.id === productId
              );

              // If product not found in current storeProducts, fetch it specifically
              if (!selectedProduct) {
                try {
                  const fetchedProduct = await fetchWixStoreProduct(productId);
                  selectedProduct = fetchedProduct || undefined;
                } catch (error) {
                  console.error("Failed to fetch specific product:", error);
                }
              }
            }

            setCurrentProduct(selectedProduct);
            const selectedProductLiveImages = selectedProduct?.media
              ? [...(selectedProduct.media.items || [])]
              : [];

            const liveImages = convertMediaToGeneratedImages(
              selectedProductLiveImages
            );
            images = [...liveImages, ...covertGenerateImagesToPreview(rawImages)];
          }

          // Sort live images by order, then others by createdAt
          const live = images.filter((img) => img.isLiveImage);
          const drafts = images.filter((img) => !img.isLiveImage);
          live.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          drafts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          const sorted = [...live, ...drafts];

          setEditorSettings((prev) => ({
            ...prev,
            fileExplorerImages: sorted,
            selectedImageId: "",
          }));

          return sorted; // Return the images array for further use
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch images";
          setError("images", errorMessage);
          setImagesError(err);
          setIsLoadingImages(false);
          setIsLoadingCanvas(false);
          return []; // Return empty array on error
        }
      },
      [
        storeProducts,
        setEditorSettings,
        setIsLoadingImages,
        setIsLoadingCanvas,
        setImagesError,
      ]
    );

    const refreshProductImages = useCallback(async () => {
      setIsLoadingImages(true);
      setApiLoading(false);
      setApiError(null);
      setImagesError(null);
      try {
        await wixStoreProductsQuery.refetch();
        // Invalidate all store product queries to refresh table data
        await queryClient.invalidateQueries({
          queryKey: [QUERY_WIX_STORE_PRODUCTS_INFINITE],
        });
        await fetchImages(modalState.studioType, modalState.productId);
      } catch (err) {
        // fetchImages already sets error/loading state
      } finally {
        setIsLoadingImages(false);
      }
      setEditingImage(null);
      setPromptSettings((prev) => ({ ...prev, prompt: "" }));
      setEditorSettings((prev) => ({ ...prev, isFileExplorerOpen: true }));
      setOutputSettings((prev) => ({
        ...prev,
        editingMode: "enhance",
        autoUpscaling: true,
        aspectRatio: "original",
      }));
      setUpgradeModalOpen(false);
    }, [
      wixStoreProductsQuery,
      queryClient,
      fetchImages,
      modalState.studioType,
      modalState.productId,
      setEditingImage,
      setPromptSettings,
      setEditorSettings,
      setOutputSettings,
      setIsLoadingImages,
      setApiLoading,
      setApiError,
      setImagesError,
    ]);

    // --- API Actions: publish, unpublish, delete ---
    /**
     * Publishes a generated image to a product's media gallery.
     *
     * IMPORTANT: This is a BACKGROUND OPERATION that takes 10+ seconds to complete.
     * - Does NOT set API loading states to avoid blocking the UI
     * - Uses image state (PUBLISHING) to show progress in the UI
     * - Provides immediate feedback via toast notifications
     * - Runs asynchronously without blocking other user interactions
     *
     * @param image - The generated image to publish
     * @param productId - The ID of the product to publish to
     */
    const publishImage = useCallback(
      async (image: GeneratedImagePreview, productId: string) => {
        let uploadedId = ""; // Declare outside try block for error handling

        try {
          // Don't set API loading for publish - it's a background operation that takes 10+ seconds
          clearError("api");

          if (!productId || !image.imageUrl) {
            const errorMsg =
              "No product ID or image URL available for publishing.";
            setError("api", errorMsg);
            addToast({
              content: errorMsg,
              status: "error",
            });
            return;
          }

          // Check live image count before publishing
          const liveImagesCount = (
            editorSettings.fileExplorerImages || []
          ).filter((img) => img.isLiveImage).length;
          if (liveImagesCount >= 10) {
            addToast({
              content:
                "You can only publish up to 10 images per product. Please unpublish or delete an image before publishing a new one.",
              status: "warning",
            });
            return;
          }

          const isConfirmStateProduct =
            image.imageState === PROCESS_STATES.CONFIRM;
          if (isConfirmStateProduct) {
            updateFileExplorerImage(image.id, {
              imageState: undefined,
            });
          }

          // Find current max order among live images
          const currentLiveImages = (
            editorSettings.fileExplorerImages || []
          ).filter((img) => img.isLiveImage && typeof img.order === "number");
          const maxOrder = currentLiveImages.length
            ? Math.max(...currentLiveImages.map((img) => img.order ?? 0))
            : -1;

          uploadedId = "live_" + uuidv4(); // Use a unique ID for the live image
          addFileExplorerImage(
            {
              ...image,
              id: uploadedId,
              isLiveImage: true,
              imageState: PROCESS_STATES.PUBLISHING,
              order: maxOrder + 1, // assign next order
            },
            false
          );

          // Use TanStack Query mutation for publishing (safe for multiple sequential calls)
          await addProductMedia.mutateAsync({
            id: productId || image?.productId || "",
            data: {
              mediaUrl: image.imageUrl || "",
            },
          });
          updateFileExplorerImage(
            uploadedId,
            {
              imageUrl: image.imageUrl,
              parentTaskId: null,
              imageState: undefined,
            },
            false,
            false,
            false
          );

          // Refresh store products data to update the table with latest media
          try {
            await wixStoreProductsQuery.refetch();
            // Invalidate all store product queries to refresh table data
            await queryClient.invalidateQueries({
              queryKey: [QUERY_WIX_STORE_PRODUCTS_INFINITE],
            });
          } catch (refreshError) {
            console.warn(
              "Failed to refresh store products after publish:",
              refreshError
            );
          }

          // Send BI event for successful image publish
          // This tracks user engagement for Wix analytics as requested by the team
          // Event includes: MSID (instance ID), product GUID, and image connection status
          try {
            const instanceId = wixSiteData?.instanceId;
            if (instanceId) {
              await sendWixBiImagePublishedEvent(instanceId, productId);
            } else {
              console.warn("BI Event: Instance ID not available in Recoil state");
            }
          } catch (biError) {
            // BI events should not break the main flow
            console.warn("Failed to send BI event for image publish:", biError);
          }

          addToast({
            content: "Image published successfully.",
            status: "success",
          });
        } catch (err: any) {
          const errorMessage = err.message || "Failed to publish image";
          setError("api", errorMessage);
          if (uploadedId) {
            deleteFileExplorerImage(uploadedId);
          }
          addToast({
            content: "Failed to publish image.",
            status: "error",
          });
          throw err;
        }
      },
      [
        clearError,
        setError,
        modalState.productId,
        addProductMedia,
        addFileExplorerImage,
        updateFileExplorerImage,
        selectExplorerImageForEditing,
        deleteFileExplorerImage,
        addToast,
        editorSettings.fileExplorerImages,
        wixStoreProductsQuery,
        queryClient, // add this dependency for query invalidation
      ]
    );

    const unpublishImage = useCallback(
      async (image: GeneratedImagePreview, productId: string) => {
        setApiLoading(true);
        setApiError(null);
        try {
          // await photoStudioApi.unpublishImage(image, productId);
        } catch (err: any) {
          setApiError(err.message || "Failed to unpublish image");
          throw err;
        } finally {
          setApiLoading(false);
        }
      },
      []
    );

    const deleteImage = useCallback(
      async (image: GeneratedImagePreview) => {
        try {
          setApiLoading(true);
          clearError("api");

          if (!image.id) {
            const errorMsg = "No task ID found for this image.";
            setError("api", errorMsg);
            addToast({
              content: errorMsg,
              status: "error",
            });
            return;
          }

          updateFileExplorerImage(image.id, {
            imageState: PROCESS_STATES.DELETING,
          });
          const isCanvasImage = editingImage?.id === image.id;
          isCanvasImage && setEditingImage(null);

          await bulkDeleteGeneratedImages.mutate(
            {
              ids: [image.id],
            },
            {
              onSuccess: () => {
                addToast({
                  content: "Image deleted successfully.",
                  status: "success",
                });
                deleteFileExplorerImage(image.id);
              },
              onError: (error) => {
                const errorMsg = "Failed to delete image.";
                setError("api", errorMsg);
                addToast({
                  content: errorMsg,
                  status: "error",
                });
                updateFileExplorerImage(image.id, {
                  imageState: PROCESS_STATES.ERROR,
                });
                console.error("Failed to delete image:", error);
              },
            }
          );
        } catch (err: any) {
          const errorMessage = err.message || "Failed to delete image";
          setError("api", errorMessage);
          throw err;
        } finally {
          setApiLoading(false);
        }
      },
      [
        bulkDeleteGeneratedImages,
        updateFileExplorerImage,
        setEditingImage,
        deleteFileExplorerImage,
      ]
    );

    // Utility: Select initial image for canvas editing
    function selectInitialCanvasImage({
      images,
      initialImageId,
      imageType = "live",
      selectExplorerImageForEditing,
      setEditingImage,
      setIsLoadingImages,
      setIsLoadingCanvas,
    }: {
      images: GeneratedImagePreview[];
      initialImageId?: string;
      imageType?: "live" | "draft";
      selectExplorerImageForEditing: (id: string) => void;
      setEditingImage: (img: any) => void;
      setIsLoadingImages: (val: boolean) => void;
      setIsLoadingCanvas: (val: boolean) => void;
    }) {
      setEditingImage(null);
      const sortedImages = [...images].sort((a, b) => {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      const liveImages = sortedImages.filter(
        (img) => img.isLiveImage && img.imageState !== PROCESS_STATES.UPLOADED
      );
      const draftImages = sortedImages.filter(
        (img) => !img.isLiveImage && img.imageState !== PROCESS_STATES.UPLOADED
      );

      if (draftImages.length > 0 && initialImageId && imageType === "draft") {
        selectExplorerImageForEditing(initialImageId || "");
      } else if (
        liveImages.length > 0 &&
        initialImageId &&
        imageType === "live"
      ) {
        selectExplorerImageForEditing(initialImageId || "");
      } else if (liveImages.length > 0) {
        selectExplorerImageForEditing(liveImages[0].id);
      } else if (draftImages.length > 0) {
        selectExplorerImageForEditing(draftImages[0].id);
      } else {
        setIsLoadingImages(false);
        setIsLoadingCanvas(false);
      }
    }

    const openPhotoStudio = useCallback(
      async ({
        type = "general",
        productId,
        initialImageId,
        imageType = "live",
        preloadedProduct,
        isModalContext = false,
      }: {
        type?: StudioTypes;
        productId?: string;
        initialImageId?: string;
        imageType?: "live" | "draft";
        preloadedProduct?: NormalizedProduct;
        isModalContext?: boolean;
      }) => {
        setIsModalContext(isModalContext);
        setModalState((prev) => ({
          ...prev,
          isPhotoStudioOpen: true,
          studioType: type,
          productId: productId || undefined,
          initialSelectedImageId: initialImageId || "",
        }));

        const images =
          (await fetchImages(type, productId, preloadedProduct)) || [];

        selectInitialCanvasImage({
          images,
          initialImageId,
          imageType,
          selectExplorerImageForEditing,
          setEditingImage,
          setIsLoadingImages,
          setIsLoadingCanvas,
        });

        setPromptSettings((prev) => ({ ...prev, prompt: "" }));
        setEditorSettings((prev) => ({ ...prev, isFileExplorerOpen: true }));
        setOutputSettings((prev) => ({
          ...prev,
          editingMode: "enhance",
          autoUpscaling: true,
          aspectRatio: "original",
        }));
      },
      [
        setModalState,
        fetchImages,
        setEditingImage,
        setPromptSettings,
        setEditorSettings,
        setOutputSettings,
        selectExplorerImageForEditing,
      ]
    );

    const closePhotoStudio = useCallback(async () => {
      setModalState((prev) => ({
        ...prev,
        isPhotoStudioOpen: false,
        productId: undefined,
        initialSelectedImageId: "",
      }));
      setIsModalContext(false); // Reset modal context flag
      await new Promise((resolve) => setTimeout(resolve, 300));
      setEditorSettings((prev) => ({
        ...prev,
        fileExplorerImages: [],
        isModalImageDetailsOpen: false,
        selectedImageId: "",
      }));
      setUpgradeModalOpen(false);
      setEditingImage(null);
      setPromptSettings((prev) => ({ ...prev, prompt: "" }));
      setOutputSettings((prev) => ({
        ...prev,
        editingMode: "enhance",
        autoUpscaling: true,
        aspectRatio: "original",
      }));
      setApiLoading(false);
      setApiError(null);
      setIsLoadingImages(false);
      setImagesError(null);
    }, [
      setModalState,
      setEditorSettings,
      setEditingImage,
      setPromptSettings,
      setOutputSettings,
      setApiLoading,
      setApiError,
      setIsLoadingImages,
      setImagesError,
    ]);

    // --- Product Navigation ---
    const changeProductId = useCallback(
      async (newProductId: string) => {
        setApiLoading(true);
        setEditorSettings((prev) => ({
          ...prev,
          fileExplorerImages: [],
          isModalImageDetailsOpen: false,
          selectedImageId: "",
        }));
        setUpgradeModalOpen(false);
        setOutputSettings((prev) => ({
          ...prev,
          editingMode: "enhance",
          autoUpscaling: true,
          aspectRatio: "original",
        }));
        setApiError(null);
        setIsLoadingImages(false);
        setImagesError(null);
        setModalState((prev) => ({
          ...prev,
          productId: newProductId,
          initialSelectedImageId: "",
        }));
        try {
          const images =
            (await fetchImages(modalState.studioType, newProductId)) || [];
          selectInitialCanvasImage({
            images,
            selectExplorerImageForEditing,
            setEditingImage,
            setIsLoadingImages,
            setIsLoadingCanvas,
          });
        } catch (err) {
          // fetchImages already sets error/loading state
        } finally {
          setApiLoading(false);
        }
        setEditorSettings((prev) => ({ ...prev, isFileExplorerOpen: true }));
        setOutputSettings((prev) => ({
          ...prev,
          editingMode: "enhance",
          autoUpscaling: true,
          aspectRatio: "original",
        }));
        setUpgradeModalOpen(false);
      },
      [
        fetchImages,
        setModalState,
        setEditorSettings,
        setOutputSettings,
        setApiError,
        setIsLoadingImages,
        setImagesError,
        modalState.studioType,
      ]
    );

    // --- Feedback Prompt Logic ---
    // Only count generated images that are published (isLiveImage === true)
    // Only count generated images that are published (imageStatus === 'PUBLISHED')
    const publishedCount = allGeneratedImages.filter(
      (img) => (img as any).imageStatus === "PUBLISHED"
    ).length;
    const [shouldShowFeedback, setShouldShowFeedback] = useState(false);
    // Pure function for feedback check
    const pureShouldShowFeedback = useCallback(
      (reviewState = settings?.isUserReviewed, count = publishedCount) => {
        if (reviewState === true || reviewState === "never") return false;
        if ((reviewState === "none" || reviewState === false) && count >= 3)
          return true;
        if (reviewState === "1st-time-asked" && count >= 7) return true;
        if (reviewState === "2nd-time-asked" && count >= 15) return true;
        if (reviewState === "3rd-time-asked" && count >= 50) return true;
        return false;
      },
      [settings, publishedCount]
    );
    // Keep shouldShowFeedback in sync
    useEffect(() => {
      setShouldShowFeedback(pureShouldShowFeedback());
    }, [settings, publishedCount, pureShouldShowFeedback]);
    // Expose a function for imperative check (for consumers)
    const checkShouldShowFeedback = useCallback(() => {
      setShouldShowFeedback(pureShouldShowFeedback());
    }, [pureShouldShowFeedback]);
    // Feedback skip/submit logic
    const handleFeedbackSkip = () => {
      setShouldShowFeedback(false);
      let nextState: any = "none";
      if (
        settings?.isUserReviewed === "none" ||
        settings?.isUserReviewed === false
      )
        nextState = "1st-time-asked";
      else if (settings?.isUserReviewed === "1st-time-asked")
        nextState = "2nd-time-asked";
      else if (settings?.isUserReviewed === "2nd-time-asked")
        nextState = "3rd-time-asked";
      else if (settings?.isUserReviewed === "3rd-time-asked") nextState = "never";
      setSettings((prev) => ({ ...prev, isUserReviewed: nextState }));
      updateSettings({ isUserReviewed: nextState });
    };
    const handleFeedbackSubmit = async (onFeedbackSubmit?: () => void) => {
      handleFeedbackSkip();
      if (onFeedbackSubmit) onFeedbackSubmit();
    };

    // --- Reference Image Selection Limit Logic ---
    // Returns the number of reference-related images (selected + uploaded)
    const getReferenceImageCount = useCallback(() => {
      return sortedFileExplorerImages.filter(
        (img) => img.imageState === "selected" || img.imageState === "uploaded"
      ).length;
    }, [sortedFileExplorerImages]);

    // Returns true if you can add more reference images (limit is 6)
    const canAddReferenceImage = useCallback(() => {
      return getReferenceImageCount() < 6;
    }, [getReferenceImageCount]);

    // --- Context Value ---
    // Add sortedLiveImages and sortedDraftImages to context for consumers
    const sortedLiveImages = useMemo(() => {
      return (editorSettings.fileExplorerImages || [])
        .filter((img) => img.isLiveImage)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [editorSettings.fileExplorerImages]);

    const sortedDraftImages = useMemo(() => {
      return (editorSettings.fileExplorerImages || [])
        .filter((img) => !img.isLiveImage)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [editorSettings.fileExplorerImages]);

    // --- Context Value ---
    const contextValue = useMemo(
      () => ({
        sortedFileExplorerImages,
        processingImages,
        referenceImage,
        selectedImages,
        confirmImages,
        editingImage,
        editorSettings,
        setEditorSettings,
        updateLayerState,
        fileExplorerImages,
        selectedImageId,
        updateFileExplorerImage,
        markGeneratedImageForCopyEdit,
        addFileExplorerImage,
        deleteFileExplorerImage,
        selectExplorerImageForEditing,
        updateCanvasImage,
        showImageDetails,
        undo,
        redo,
        canUndo,
        canRedo,
        setEditingImage,
        openPhotoStudio,
        closePhotoStudio,
        isPhotoStudioOpen: modalState.isPhotoStudioOpen,
        studioType: modalState.studioType,
        productId: modalState.productId,
        initialSelectedImageId: modalState.initialSelectedImageId,
        isModalContext, // Flag for single product modal with limited space
        publishImage,
        unpublishImage,
        deleteImage,
        setApiLoading,
        apiLoading: computedLoadingStates.apiLoading,
        apiError,

        // Enhanced Error Management
        errorState,
        setError,
        clearError,

        // Consolidated Loading State
        loadingState,

        // Computed Loading States
        isAnyLoading: computedLoadingStates.isAnyLoading,

        promptSettings,
        setPromptSettings,
        outputSettings,
        setOutputSettings,
        isLoadingImages: computedLoadingStates.isLoadingImages,
        imagesError,
        setImagesLoaded,
        isLoadingCanvas: computedLoadingStates.isLoadingCanvas,
        setIsLoadingCanvas,
        isApiImagePreparing: computedLoadingStates.isApiImagePreparing,
        setApiImagePreparing,
        subscription,
        deductCredits,
        isUpgradeModalOpen,
        showUpgradeModal,
        hideUpgradeModal,
        isUnpublishModalOpen,
        showUnpublishModal,
        hideUnpublishModal,
        refreshProductImages,
        storeProducts,
        currentProduct,
        changeProductId,
        isPublishing,
        shouldShowFeedback,
        checkShouldShowFeedback,
        handleFeedbackSkip,
        handleFeedbackSubmit,
        getReferenceImageCount,
        canAddReferenceImage,
        lastApiRequest,
        setLastApiRequest,
        sortedLiveImages,
        sortedDraftImages,
      }),
      [
        sortedFileExplorerImages,
        processingImages,
        referenceImage,
        selectedImages,
        confirmImages,
        editingImage,
        editorSettings,
        setEditorSettings,
        updateLayerState,
        fileExplorerImages,
        selectedImageId,
        updateFileExplorerImage,
        markGeneratedImageForCopyEdit,
        addFileExplorerImage,
        deleteFileExplorerImage,
        selectExplorerImageForEditing,
        updateCanvasImage,
        showImageDetails,
        undo,
        redo,
        canUndo,
        canRedo,
        setEditingImage,
        openPhotoStudio,
        closePhotoStudio,
        modalState,
        isModalContext,
        publishImage,
        unpublishImage,
        deleteImage,
        setApiLoading,
        computedLoadingStates,
        loadingState,
        errorState,
        setError,
        clearError,
        apiError,
        promptSettings,
        setPromptSettings,
        outputSettings,
        setOutputSettings,
        imagesError,
        setImagesLoaded,
        setIsLoadingCanvas,
        setApiImagePreparing,
        subscription,
        deductCredits,
        isUpgradeModalOpen,
        showUpgradeModal,
        hideUpgradeModal,
        isUnpublishModalOpen,
        showUnpublishModal,
        hideUnpublishModal,
        refreshProductImages,
        storeProducts,
        currentProduct,
        changeProductId,
        isPublishing,
        shouldShowFeedback,
        checkShouldShowFeedback,
        handleFeedbackSkip,
        handleFeedbackSubmit,
        getReferenceImageCount,
        canAddReferenceImage,
        lastApiRequest,
        setLastApiRequest,
        sortedLiveImages,
        sortedDraftImages,
      ]
    );

    return (
      <PhotoStudioContext.Provider value={contextValue}>
        {!hidePhotoStudio && (
          <PhotoStudio
            mode={photoStudioMode}
            showCloseButton={showCloseButton}
            onCustomClose={onCustomClose}
          />
        )}
        {children}
      </PhotoStudioContext.Provider>
    );
  };

export const usePhotoStudio = () => {
  const context = useContext(PhotoStudioContext);
  if (!context) {
    throw new Error("usePhotoStudio must be used within a PhotoStudioProvider");
  }
  return context;
};
