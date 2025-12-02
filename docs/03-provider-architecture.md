# Provider Architecture

## Overview

The PhotoStudio system uses a **centralized provider pattern** that consolidates all state, API actions, and UI logic into a single context. This approach provides a single source of truth while maintaining excellent performance through strategic memoization.

## PhotoStudioProvider Architecture

### **Core Responsibilities**

1. **State Management**: Orchestrates Recoil state and local React state
2. **API Actions**: Handles all CRUD operations with optimistic updates
3. **Modal Lifecycle**: Manages opening, closing, and navigation
4. **Error Handling**: Provides structured error states and recovery
5. **Loading States**: Coordinates multiple loading indicators
6. **Subscription Management**: Tracks credits and plan limits

### **Provider Structure**

```tsx
export const PhotoStudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --- State Management ---
  const { modalState, setModalState } = useModalState();
  const editorActions = useEditorActions();
  
  // --- Consolidated Loading States ---
  const [loadingState, setLoadingState] = useState({
    canvas: false,
    imagePreparing: false,
    images: false,
    api: false,
  });
  
  // --- Error State Management ---
  const [errorState, setErrorState] = useState({
    api: null as string | null,
    images: null as string | null,
    subscription: null as string | null,
  });
  
  // --- API Integration ---
  const queryClient = useQueryClient();
  const { addProductMedia } = useProducts();
  const { bulkDeleteGeneratedImages } = useGeneratedImages();
  
  // --- Context Value ---
  const contextValue = useMemo(() => ({
    // 100+ properties and methods
  }), [dependencies]);

  return (
    <PhotoStudioContext.Provider value={contextValue}>
      <PhotoStudio />  {/* Modal renders here */}
      {children}
    </PhotoStudioContext.Provider>
  );
};
```

## Context Interface

### **Complete Context Type**

```typescript
export interface PhotoStudioContextType {
  // --- State ---
  sortedFileExplorerImages: GeneratedImagePreview[];
  sortedLiveImages: GeneratedImagePreview[];
  sortedDraftImages: GeneratedImagePreview[];
  editingImage: Layer | null;
  editorSettings: EditorSettings;
  
  // --- Image Actions ---
  updateFileExplorerImage: (id: string, updates: Partial<GeneratedImagePreview>) => void;
  addFileExplorerImage: (image: GeneratedImagePreview, resetId?: boolean) => void;
  deleteFileExplorerImage: (id: string) => void;
  selectExplorerImageForEditing: (id: string) => void;
  markGeneratedImageForCopyEdit: (id: string) => void;
  
  // --- Canvas Actions ---
  updateLayerState: (updates: Partial<Layer>) => void;
  updateCanvasImage: (image: GeneratedImagePreview) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // --- Modal Management ---
  openPhotoStudio: (params: OpenStudioParams) => Promise<void>;
  closePhotoStudio: () => void;
  isPhotoStudioOpen: boolean;
  studioType: StudioTypes;
  productId?: string;
  
  // --- API Actions ---
  publishImage: (image: GeneratedImagePreview, productId: string) => Promise<void>;
  unpublishImage: (image: GeneratedImagePreview, productId: string) => Promise<void>;
  deleteImage: (image: GeneratedImagePreview) => Promise<void>;
  refreshProductImages: () => void;
  changeProductId: (productId: string) => Promise<void>;
  
  // --- Loading States ---
  loadingState: {
    api: boolean;
    canvas: boolean;
    imagePreparing: boolean;
    images: boolean;
  };
  isAnyLoading: boolean;
  isLoadingImages: boolean;
  isLoadingCanvas: boolean;
  isApiImagePreparing: boolean;
  apiLoading: boolean;
  
  // --- Error Management ---
  errorState: {
    api: string | null;
    images: string | null;
    subscription: string | null;
  };
  setError: (type: ErrorType, error: string) => void;
  clearError: (type: ErrorType) => void;
  
  // --- Settings ---
  promptSettings: PromptSettings;
  setPromptSettings: Dispatch<SetStateAction<PromptSettings>>;
  outputSettings: OutputSettings;
  setOutputSettings: Dispatch<SetStateAction<OutputSettings>>;
  
  // --- Subscription ---
  subscription: SubscriptionResponse | null;
  deductCredits: (amount: number) => void;
  
  // --- Modal States ---
  isUpgradeModalOpen: boolean;
  showUpgradeModal: () => void;
  hideUpgradeModal: () => void;
  isUnpublishModalOpen: boolean;
  showUnpublishModal: () => void;
  hideUnpublishModal: () => void;
  
  // ... 50+ more properties
}
```

## State Management Patterns

### **Modal State Management**

```typescript
const useModalState = () => {
  const [modalState, setModalState] = useState({
    isPhotoStudioOpen: false,
    studioType: "general" as StudioTypes,
    productId: undefined as string | undefined,
    initialSelectedImageId: "",
  });

  // Memoized setter to prevent unnecessary re-renders
  const setModalStateMemo = useCallback(
    (updater: typeof modalState | ((prev: typeof modalState) => typeof modalState)) => {
      setModalState(updater);
    },
    []
  );

  return {
    modalState,
    setModalState: setModalStateMemo,
  };
};
```

### **Consolidated Loading States**

```typescript
// Single loading state object prevents excessive re-renders
const [loadingState, setLoadingState] = useState({
  canvas: false,
  imagePreparing: false,
  images: false,
  api: false,
});

// Memoized loading state updaters
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

// Computed convenience properties
const computedLoadingStates = useMemo(
  () => ({
    isAnyLoading: Object.values(loadingState).some(Boolean),
    isLoadingCanvas: loadingState.canvas,
    apiLoading: loadingState.api,
  }),
  [loadingState]
);
```

### **Error State Management**

```typescript
// Structured error state
const [errorState, setErrorState] = useState({
  api: null as string | null,
  images: null as string | null,
  subscription: null as string | null,
});

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
```

## API Action Patterns

### **Background Operations (Publishing)**

```typescript
/**
 * Publishing is a BACKGROUND OPERATION that takes 10+ seconds.
 * - Does NOT set API loading states to avoid blocking UI
 * - Uses image state for progress indication
 * - Provides immediate feedback via toast notifications
 */
const publishImage = useCallback(
  async (image: GeneratedImagePreview, productId: string) => {
    let uploadedId = "";

    try {
      clearError("api");

      // Validation
      if (!productId || !image.imageUrl) {
        const errorMsg = "No product ID or image URL available for publishing.";
        setError("api", errorMsg);
        addToast({ content: errorMsg, status: "error" });
        return;
      }

      // Check live image count limit
      const liveImagesCount = (editorSettings.fileExplorerImages || [])
        .filter((img) => img.isLiveImage).length;
      if (liveImagesCount >= 10) {
        addToast({
          content: "You can only publish up to 10 images per product.",
          status: "warning",
        });
        return;
      }

      // Optimistic UI update
      const maxOrder = Math.max(
        ...currentLiveImages.map((img) => img.order ?? 0),
        -1
      );
      
      uploadedId = "live_" + uuidv4();
      addFileExplorerImage({
        ...image,
        id: uploadedId,
        isLiveImage: true,
        imageState: "publishing",
        order: maxOrder + 1,
      }, false);

      // Background API call (TanStack Query mutation)
      await addProductMedia.mutateAsync({
        id: productId,
        data: { mediaUrl: image.imageUrl },
      });

      // Success state update
      updateFileExplorerImage(uploadedId, {
        imageUrl: image.imageUrl,
        parentTaskId: null,
        imageState: undefined,
      });

      // Refresh store products data
      await wixStoreProductsQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: [QUERY_WIX_STORE_PRODUCTS_INFINITE],
      });

      addToast({
        content: "Image published successfully.",
        status: "success",
      });
    } catch (err: any) {
      // Error rollback
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
  [dependencies]
);
```

### **Foreground Operations (Deletion)**

```typescript
/**
 * Deletion is a FOREGROUND OPERATION with loading states.
 * - Sets API loading states to block interactions
 * - Shows progress in UI
 * - Handles rollback on failure
 */
const deleteImage = useCallback(
  async (image: GeneratedImagePreview) => {
    try {
      setApiLoading(true);
      clearError("api");

      if (!image.id) {
        const errorMsg = "No task ID found for this image.";
        setError("api", errorMsg);
        addToast({ content: errorMsg, status: "error" });
        return;
      }

      // Optimistic UI update
      updateFileExplorerImage(image.id, {
        imageState: "deleting",
      });
      
      // Clear canvas if this image is being edited
      const isCanvasImage = editingImage?.id === image.id;
      if (isCanvasImage) setEditingImage(null);

      // API call with mutation handlers
      await bulkDeleteGeneratedImages.mutate(
        { ids: [image.id] },
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
            addToast({ content: errorMsg, status: "error" });
            updateFileExplorerImage(image.id, {
              imageState: "error",
            });
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
  [dependencies]
);
```

## Modal Lifecycle Management

### **Opening Modal**

```typescript
const openPhotoStudio = useCallback(
  async ({
    type = "general",
    productId,
    initialImageId,
    imageType = "live",
  }: OpenStudioParams) => {
    // 1. Set modal state
    setModalState((prev) => ({
      ...prev,
      isPhotoStudioOpen: true,
      studioType: type,
      productId: productId || undefined,
      initialSelectedImageId: initialImageId || "",
    }));

    // 2. Fetch images for context
    const images = (await fetchImages(type, productId)) || [];
    
    // 3. Select initial canvas image
    selectInitialCanvasImage({
      images,
      initialImageId,
      imageType,
      selectExplorerImageForEditing,
      setEditingImage,
      setIsLoadingImages,
      setIsLoadingCanvas,
    });

    // 4. Reset UI states
    setPromptSettings((prev) => ({ ...prev, prompt: "" }));
    setEditorSettings((prev) => ({ ...prev, isFileExplorerOpen: true }));
    setOutputSettings((prev) => ({
      ...prev,
      editingMode: "enhance",
      autoUpscaling: true,
      aspectRatio: "original",
    }));
  },
  [dependencies]
);
```

### **Closing Modal**

```typescript
const closePhotoStudio = useCallback(async () => {
  // 1. Close modal immediately
  setModalState((prev) => ({
    ...prev,
    isPhotoStudioOpen: false,
    productId: undefined,
    initialSelectedImageId: "",
  }));
  
  // 2. Wait for animation to complete
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // 3. Cleanup state
  setEditorSettings((prev) => ({
    ...prev,
    fileExplorerImages: [],
    isModalImageDetailsOpen: false,
    selectedImageId: "",
  }));
  
  // 4. Reset all UI states
  setUpgradeModalOpen(false);
  setEditingImage(null);
  setPromptSettings((prev) => ({ ...prev, prompt: "" }));
  setOutputSettings((prev) => ({
    ...prev,
    editingMode: "enhance",
    autoUpscaling: true,
    aspectRatio: "original",
  }));
  
  // 5. Clear errors and loading
  setApiLoading(false);
  setApiError(null);
  setIsLoadingImages(false);
  setImagesError(null);
}, [dependencies]);
```

### **Product Navigation**

```typescript
const changeProductId = useCallback(
  async (newProductId: string) => {
    setApiLoading(true);
    
    // Clear current state
    setEditorSettings((prev) => ({
      ...prev,
      fileExplorerImages: [],
      isModalImageDetailsOpen: false,
      selectedImageId: "",
    }));
    
    // Update modal state
    setModalState((prev) => ({
      ...prev,
      productId: newProductId,
      initialSelectedImageId: "",
    }));
    
    try {
      // Fetch new product images
      const images = (await fetchImages(modalState.studioType, newProductId)) || [];
      
      // Select initial image
      selectInitialCanvasImage({
        images,
        selectExplorerImageForEditing,
        setEditingImage,
        setIsLoadingImages,
        setIsLoadingCanvas,
      });
    } catch (err) {
      // fetchImages handles error state
    } finally {
      setApiLoading(false);
    }
    
    // Reset UI
    setEditorSettings((prev) => ({ ...prev, isFileExplorerOpen: true }));
    setOutputSettings((prev) => ({
      ...prev,
      editingMode: "enhance",
      autoUpscaling: true,
      aspectRatio: "original",
    }));
  },
  [dependencies]
);
```

## Image Fetching and Processing

### **Image Fetch Logic**

```typescript
const fetchImages = useCallback(
  async (type: StudioTypes, productId?: string) => {
    setIsLoadingImages(true);
    setIsLoadingCanvas(true);
    clearError("images");
    
    try {
      let rawImages = [];
      
      // Fetch based on type
      if (type === "product" && productId) {
        const data = await generatedImagesApi.getGeneratedImagesByProductId(productId);
        rawImages = data || [];
      } else {
        const data = await generatedImagesApi.getAllGeneratedImages();
        rawImages = data || [];
      }
      
      // Process images
      let images: GeneratedImagePreview[] = [];
      
      if (type === "product" && productId) {
        // Get product data
        let selectedProduct = storeProducts.find(p => p._id === productId);
        if (!selectedProduct) {
          const fetchedProducts = await fetchWixStoreProducts([productId]);
          selectedProduct = fetchedProducts?.[0];
        }
        
        setCurrentProduct(selectedProduct);
        
        // Convert live images
        const liveImages = convertMediaToGeneratedImages(
          selectedProduct?.media?.items || []
        );
        
        // Combine live and draft images
        images = [...liveImages, ...convertGeneratedImagesToPreview(rawImages)];
      }
      
      // Sort images
      const live = images.filter(img => img.isLiveImage);
      const drafts = images.filter(img => !img.isLiveImage);
      live.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      drafts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const sorted = [...live, ...drafts];
      
      // Update state
      setEditorSettings((prev) => ({
        ...prev,
        fileExplorerImages: sorted,
        selectedImageId: "",
      }));
      
      return sorted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch images";
      setError("images", errorMessage);
      setImagesError(err);
      setIsLoadingImages(false);
      setIsLoadingCanvas(false);
      return [];
    }
  },
  [dependencies]
);
```

## Performance Optimizations

### **Context Value Memoization**

```typescript
// Comprehensive context value with memoization
const contextValue = useMemo(
  () => ({
    // State
    sortedFileExplorerImages,
    sortedLiveImages,
    sortedDraftImages,
    editingImage,
    editorSettings,
    
    // Actions
    updateFileExplorerImage,
    addFileExplorerImage,
    deleteFileExplorerImage,
    selectExplorerImageForEditing,
    
    // API
    publishImage,
    deleteImage,
    
    // Loading/Error
    loadingState,
    errorState,
    isAnyLoading: computedLoadingStates.isAnyLoading,
    
    // Modal
    openPhotoStudio,
    closePhotoStudio,
    isPhotoStudioOpen: modalState.isPhotoStudioOpen,
    
    // Settings
    promptSettings,
    setPromptSettings,
    outputSettings,
    setOutputSettings,
    
    // All other properties...
  }),
  [
    // Dependencies for all included values
    sortedFileExplorerImages,
    sortedLiveImages,
    sortedDraftImages,
    editingImage,
    editorSettings,
    updateFileExplorerImage,
    // ... all dependencies
  ]
);
```

### **Custom Hook Usage**

```typescript
export const usePhotoStudio = () => {
  const context = useContext(PhotoStudioContext);
  if (!context) {
    throw new Error("usePhotoStudio must be used within a PhotoStudioProvider");
  }
  return context;
};

// Usage in components
const MyComponent = () => {
  const {
    editingImage,
    updateFileExplorerImage,
    isLoadingImages,
    publishImage
  } = usePhotoStudio();
  
  // Component logic...
};
```

## Advanced Features

### **Feedback Management**

```typescript
// Centralized feedback logic
const publishedCount = allGeneratedImages.filter(
  (img) => img.imageStatus === "PUBLISHED"
).length;

const [shouldShowFeedback, setShouldShowFeedback] = useState(false);

const checkShouldShowFeedback = useCallback(() => {
  const reviewState = settings?.isUserReviewed;
  
  if (reviewState === true || reviewState === "never") return false;
  if ((reviewState === "none" || reviewState === false) && publishedCount >= 3) return true;
  if (reviewState === "1st-time-asked" && publishedCount >= 7) return true;
  if (reviewState === "2nd-time-asked" && publishedCount >= 15) return true;
  if (reviewState === "3rd-time-asked" && publishedCount >= 50) return true;
  
  return false;
}, [settings, publishedCount]);
```

### **Reference Image Limits**

```typescript
const getReferenceImageCount = useCallback(() => {
  return sortedFileExplorerImages.filter(
    (img) => img.imageState === "selected" || img.imageState === "uploaded"
  ).length;
}, [sortedFileExplorerImages]);

const canAddReferenceImage = useCallback(() => {
  return getReferenceImageCount() < 6;
}, [getReferenceImageCount]);
```

This provider architecture ensures scalable, maintainable, and performant state management for complex modal-based applications.
