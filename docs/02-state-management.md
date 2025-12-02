# State Management Architecture

## Recoil-Based State System

The PhotoStudio uses **Recoil** for global state management, providing atomic state updates and computed selectors for derived data. This approach ensures optimal performance and clear data flow.

## Atomic State Structure

### **Core Atoms**

#### `editorSettingsState`
**Purpose**: Primary UI state and image collection
```typescript
export const editorSettingsState = atom<EditorSettings>({
  key: "editorSettingsState",
  default: {
    activePromptToolbar: false,
    isFileExplorerOpen: true,
    fileExplorerImages: [],           // Main image array
    selectedImageId: null,
    isModalImageDetailsOpen: false,
    selectedImageDetails: null,
    imageDetailsMode: "detailed",
  },
});
```

**Key Properties**:
- `fileExplorerImages`: Array of all images in the system
- `selectedImageId`: Currently selected image for canvas
- `isFileExplorerOpen`: Side panel visibility
- `isModalImageDetailsOpen`: Image details modal state

#### `editingImageState`
**Purpose**: Current canvas image with editing context
```typescript
export const editingImageState = atom<Layer | null>({
  key: "editingImageState",
  default: null,
});
```

**Layer Interface**:
```typescript
export interface Layer extends GeneratedImagePreview {
  file: File | null;
  imageUrl: string | null;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}
```

#### `imageHistoryState`
**Purpose**: Undo/redo functionality
```typescript
export const imageHistoryState = atom<ImageHistoryState>({
  key: "imageHistoryState",
  default: {
    states: [],
    currentIndex: 0,
  },
});

export interface ImageHistoryState {
  states: Layer[];
  currentIndex: number;
}
```

**History Management**:
- Maximum 50 states (configurable)
- Circular buffer implementation
- Immutable state snapshots

## Computed Selectors

### **Image Filtering Selectors**

#### `sortedFileExplorerImagesState`
**Purpose**: Auto-sorted images by creation date
```typescript
export const sortedFileExplorerImagesState = selector<GeneratedImagePreview[]>({
  key: "sortedFileExplorerImagesState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return [...(editorSettings.fileExplorerImages || [])].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  },
});
```

#### `processingImagesState`
**Purpose**: Images currently being processed
```typescript
export const processingImagesState = selector<GeneratedImagePreview[]>({
  key: "processingImagesState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (editorSettings.fileExplorerImages || []).filter(
      (image) => image.imageState === "processing"
    );
  },
});
```

#### `selectedImagesState`
**Purpose**: Images selected for batch operations
```typescript
export const selectedImagesState = selector<GeneratedImagePreview[]>({
  key: "selectedImagesState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (editorSettings.fileExplorerImages || []).filter(
      (image) =>
        image.imageState === "selected" || image.imageState === "uploaded"
    );
  },
});
```

#### `confirmImagesState`
**Purpose**: Images awaiting user confirmation
```typescript
export const confirmImagesState = selector<GeneratedImagePreview[]>({
  key: "confirmImagesState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (editorSettings.fileExplorerImages || []).filter(
      (image) => image.imageState === "confirm"
    );
  },
});
```

#### `referenceImageState`
**Purpose**: Image used as reference for AI operations
```typescript
export const referenceImageState = selector<GeneratedImagePreview | null>({
  key: "referenceImageState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (
      (editorSettings.fileExplorerImages || []).find(
        (image) => image.imageState === "reference"
      ) || null
    );
  },
});
```

## State Update Patterns

### **Image Collection Updates**

#### **Update Single Image**
```typescript
const updateFileExplorerImage = useCallback(
  (
    layerId: string,
    updates: Partial<GeneratedImagePreview>,
    resetId: boolean = false,
    filterTempImages: boolean = true,
    avoidPublishingImages: boolean = true
  ) => {
    setEditorSettings((prev) => ({
      ...prev,
      fileExplorerImages: prev.fileExplorerImages
        .filter((img) =>
          filterTempImages
            ? img.imageState !== "uploaded"
            : true
        )
        .map((img) => {
          // Never update publishing images
          if (img.imageState === "publishing" && avoidPublishingImages)
            return img;
          if (img.id === layerId) {
            return { ...img, ...updates };
          }
          return img;
        }),
      selectedImageId: resetId ? "" : prev.selectedImageId,
    }));
  },
  [setEditorSettings]
);
```

#### **Add New Image**
```typescript
const addFileExplorerImage = useCallback(
  (newImage: GeneratedImagePreview, resetId: boolean = true) => {
    setEditorSettings((prev) => ({
      ...prev,
      fileExplorerImages: [newImage, ...prev.fileExplorerImages],
      selectedImageId: resetId ? "" : prev.selectedImageId,
    }));
  },
  [setEditorSettings]
);
```

#### **Delete Image**
```typescript
const deleteFileExplorerImage = useCallback(
  (layerId: string) => {
    setEditorSettings((prev) => ({
      ...prev,
      fileExplorerImages: prev.fileExplorerImages.filter(
        (img) => img.id !== layerId
      ),
    }));
  },
  [setEditorSettings]
);
```

### **Canvas Image Selection**

#### **Select for Editing (with History)**
```typescript
const selectExplorerImageForEditing = useRecoilCallback(
  ({ snapshot, set }) =>
    (
      imageId: string,
      updates?: Partial<GeneratedImagePreview>,
      filterTempImages: boolean = true
    ) => {
      const editorSettings = snapshot.getLoadable(editorSettingsState).contents;
      const selectedLayer = editorSettings.fileExplorerImages.find(
        (l) => l.id === imageId
      );
      
      // Prevent selecting publishing images
      if (!selectedLayer || selectedLayer.imageState === "publishing") {
        return;
      }
      
      const img = new window.Image();
      img.onload = () => {
        const newLayer: Layer = {
          file: null,
          width: img.naturalWidth,
          height: img.naturalHeight,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          productId: selectedLayer.productId || undefined,
          ...selectedLayer,
          ...updates,
        };
        
        // Update editing image
        set(editingImageState, newLayer);
        
        // Add to history
        const prevHistory = snapshot.getLoadable(imageHistoryState).contents;
        const newStates = [
          ...prevHistory.states.slice(0, prevHistory.currentIndex + 1),
          newLayer,
        ];
        let newIndex = prevHistory.currentIndex + 1;
        
        // Maintain history limit
        if (newStates.length > MAX_HISTORY_SIZE) {
          newStates.shift();
          newIndex--;
        }
        
        set(imageHistoryState, {
          states: newStates,
          currentIndex: newIndex,
        });
        
        // Update image states
        set(editorSettingsState, (prev) => ({
          ...prev,
          fileExplorerImages: prev.fileExplorerImages
            .filter((img) =>
              !(filterTempImages && img.imageState === "uploaded")
            )
            .map((img) => {
              if (img.imageState === "publishing") return img;
              if (img.id === imageId) {
                return {
                  ...img,
                  imageState: "edit",
                  ...updates,
                };
              }
              return { ...img, imageState: undefined };
            }),
          selectedImageId: updates?.id || imageId,
        }));
      };
      img.src = selectedLayer.imageUrl || "";
    },
  []
);
```

### **Reference Image Management**

#### **Mark as Reference**
```typescript
const markGeneratedImageForCopyEdit = useRecoilCallback(
  ({ snapshot, set }) =>
    (imageId: string) => {
      const editorSettings = snapshot.getLoadable(editorSettingsState).contents;
      const selectedLayer = editorSettings.fileExplorerImages.find(
        (l) => l.id === imageId
      );
      
      if (selectedLayer && selectedLayer.imageState !== "publishing") {
        set(editingImageState, null); // Clear current editing
        set(editorSettingsState, (prev) => ({
          ...prev,
          fileExplorerImages: prev.fileExplorerImages.map((img) =>
            img.id === imageId && img.imageState !== "publishing"
              ? { ...img, imageState: "reference" }
              : img.imageState === "publishing"
              ? img
              : { ...img, imageState: undefined }
          ),
          isFileExplorerOpen: true,
          selectedImageId: "",
        }));
      }
    },
  []
);
```

## History Management (Undo/Redo)

### **History Operations**
```typescript
// Undo
const undo = useCallback(() => {
  if (history.currentIndex > 0) {
    const prevIndex = history.currentIndex - 1;
    setEditingImage(history.states[prevIndex]);
    setHistory({ ...history, currentIndex: prevIndex });
  }
}, [history, setEditingImage, setHistory]);

// Redo
const redo = useCallback(() => {
  if (history.currentIndex < history.states.length - 1) {
    const nextIndex = history.currentIndex + 1;
    setEditingImage(history.states[nextIndex]);
    setHistory({ ...history, currentIndex: nextIndex });
  }
}, [history, setEditingImage, setHistory]);

// Check availability
const { canUndo, canRedo } = useMemo(
  () => ({
    canUndo: history.currentIndex > 0,
    canRedo: history.currentIndex < history.states.length - 1,
  }),
  [history.currentIndex, history.states.length]
);
```

## Image State Transitions

### **Process States**
```typescript
export const PROCESS_STATES = {
  EDIT: "edit",          // Currently being edited on canvas
  PROCESSING: "processing", // Being generated/processed by AI
  PUBLISHING: "publishing", // Being published to product
  CONFIRM: "confirm",    // Awaiting user confirmation (batch)
  SELECTED: "selected",  // Selected for batch operations
  REFERENCE: "reference", // Used as reference for AI
  ERROR: "error",        // Processing failed
  DELETING: "deleting",  // Being deleted
  UPLOADED: "uploaded",  // User-uploaded image
  NONE: "none",         // Default state
};
```

### **State Transition Rules**
```typescript
// Publishing images cannot be modified
if (img.imageState === "publishing" && avoidPublishingImages) {
  return img; // Keep unchanged
}

// Only one image can be in "edit" state
if (img.id === targetId) {
  return { ...img, imageState: "edit" };
} else {
  return { ...img, imageState: undefined };
}

// Reference images clear all other states
fileExplorerImages.map((img) =>
  img.id === referenceId
    ? { ...img, imageState: "reference" }
    : { ...img, imageState: undefined }
)
```

## Provider State Integration

### **Local State in Provider**
```typescript
// Consolidated loading states
const [loadingState, setLoadingState] = useState({
  canvas: false,
  imagePreparing: false,
  images: false,
  api: false,
});

// Structured error states
const [errorState, setErrorState] = useState({
  api: null,
  images: null,
  subscription: null,
});

// Prompt and output settings
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
```

### **Computed State from Provider**
```typescript
// Derived from fileExplorerImages with live/draft separation
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
```

## Performance Optimizations

### **Memoized Selectors**
- Recoil selectors automatically cache results
- Only recompute when dependencies change
- Prevent unnecessary component re-renders

### **Batched State Updates**
```typescript
// Single update instead of multiple
setEditorSettings((prev) => ({
  ...prev,
  fileExplorerImages: updatedImages,
  selectedImageId: newSelectedId,
  isFileExplorerOpen: true,
}));
```

### **Functional Updates**
```typescript
// Prevents race conditions and ensures latest state
setEditorSettings((prev) => {
  const updatedImages = prev.fileExplorerImages.map(img => 
    img.id === targetId ? { ...img, ...updates } : img
  );
  return { ...prev, fileExplorerImages: updatedImages };
});
```

## Best Practices

### **State Updates**
1. Always use functional updates for complex state
2. Batch related updates in a single call
3. Use Recoil callbacks for cross-atom updates
4. Maintain immutability

### **Selectors**
1. Keep selectors pure and side-effect free
2. Use specific keys for better debugging
3. Memoize expensive computations
4. Avoid deep nested selectors

### **History Management**
1. Limit history size to prevent memory leaks
2. Store minimal data in history states
3. Clean up history on modal close
4. Use immutable snapshots

### **Error Handling**
1. Structure errors by domain (api, images, etc.)
2. Provide clear error messages
3. Implement error boundaries
4. Clear errors on successful operations

This state management system provides a robust foundation for complex modal-based applications with sophisticated image editing workflows.
