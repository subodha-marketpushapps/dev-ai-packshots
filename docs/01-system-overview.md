# System Overview

## Architecture Philosophy

The PhotoStudio system follows a **Modal-Centric Architecture** with sophisticated state management, designed for complex image editing workflows. The system emphasizes:

- **Centralized State Management** using Recoil
- **Provider Pattern** for context distribution
- **Imperative Canvas API** for image manipulation
- **Background API Operations** for performance
- **Optimistic UI Updates** for responsiveness

## Core Design Patterns

### 1. **Modal Container Pattern**
```tsx
<Modal screen="full" isOpen={isOpen} onRequestClose={handleClose}>
  <Box 
    height="calc(100dvh - 120px)" 
    width="calc(100dvw - 120px)"
    position="relative"
  >
    {/* Modals stack on top */}
    <ModalImageDetails />
    <ModalRequestUpgrade />
    
    {/* Main content */}
    <StudioHeader />
    
    {/* Loading overlay */}
    {showLoadingOverlay && <LoadingOverlay />}
    
    {/* Split layout */}
    <Box direction="horizontal">
      <SidePanel />
      <MainEditor />
    </Box>
  </Box>
</Modal>
```

### 2. **Centralized Provider Pattern**
```tsx
// Single provider managing all state
<PhotoStudioProvider>
  <PhotoStudio />  {/* Modal renders here */}
  {children}       {/* App continues */}
</PhotoStudioProvider>

// Context provides 100+ properties
const {
  // State
  editingImage, editorSettings, fileExplorerImages,
  // Actions  
  updateFileExplorerImage, selectExplorerImageForEditing,
  // API
  publishImage, deleteImage, 
  // UI State
  isLoading, errors, modals
} = usePhotoStudio();
```

### 3. **Recoil State Architecture**
```tsx
// Atoms (Source of Truth)
editorSettingsState → UI state and image arrays
editingImageState   → Current canvas image  
imageHistoryState   → Undo/redo functionality

// Selectors (Computed State)
sortedFileExplorerImagesState → Auto-sorted by date
processingImagesState         → Filtered by state
selectedImagesState          → Multi-selection
referenceImageState          → Reference image for AI
```

## System Workflow

### **Modal Lifecycle**
```
1. openPhotoStudio(params)
   ├── Set modal state (open, type, productId)
   ├── Fetch images for context
   ├── Select initial canvas image
   └── Reset UI states

2. Operating Phase
   ├── User interactions update Recoil state
   ├── Selectors compute derived state
   ├── Components re-render efficiently
   └── Background API operations

3. closePhotoStudio()
   ├── Close modal with animation
   ├── Cleanup state after delay
   ├── Reset all UI states
   └── Clear errors/loading
```

### **Image State Transitions**
```
Image Lifecycle States:

NONE → SELECTED → PROCESSING → CONFIRM → PUBLISHED
  ↓       ↓         ↓          ↓         ↓
UPLOADED → EDIT → REFERENCE → ERROR → DELETING

State Descriptions:
- NONE: Default state, no special processing
- SELECTED: Chosen for batch operations
- PROCESSING: Being generated/edited by AI
- CONFIRM: Awaiting user confirmation (multi-batch)
- EDIT: Currently on canvas for editing
- REFERENCE: Used as reference for AI operations
- PUBLISHED: Live image in product gallery
- UPLOADED: User-uploaded image
- ERROR: Processing failed
- DELETING: Being removed
```

### **API Integration Pattern**
```tsx
// Background operations (no loading states)
const publishImage = async (image, productId) => {
  // Optimistic UI update
  updateFileExplorerImage(image.id, { 
    imageState: "publishing" 
  });
  
  try {
    // Background API call
    await addProductMedia.mutateAsync({...});
    
    // Success update
    updateFileExplorerImage(image.id, { 
      imageState: undefined 
    });
  } catch (err) {
    // Error rollback
    deleteFileExplorerImage(image.id);
  }
};

// Foreground operations (with loading states)
const deleteImage = async (image) => {
  setApiLoading(true);
  updateFileExplorerImage(image.id, { 
    imageState: "deleting" 
  });
  
  await bulkDeleteGeneratedImages.mutate({...});
  setApiLoading(false);
};
```

## Component Architecture

### **Hierarchical Structure**
```
PhotoStudio (Root Modal)
├── ModalImageDetails (Overlay Modal)
├── ModalRequestUpgrade (Overlay Modal) 
├── ModalRequestUnpublish (Overlay Modal)
├── StudioHeader (Fixed Header)
│   ├── Navigation Controls
│   ├── Product Selector
│   └── Subscription Info
├── LoadingOverlay (Conditional)
└── MainContent (Split Layout)
    ├── StudioImageExplorer (Side Panel)
    │   ├── Live Images Section
    │   ├── Draft Images Section
    │   └── Upload Controls
    └── StudioEditor (Main Area)
        ├── EditorCanvas (Fabric.js)
        ├── EditorPromptInput (AI Controls)
        ├── EditorMultiImages (Batch View)
        └── EditorPhotoActions (Action Buttons)
```

### **Responsibility Separation**

#### **PhotoStudio.tsx** - Modal Container
- Modal lifecycle management
- Loading overlay orchestration  
- Responsive layout calculations
- Close handlers with validation

#### **PhotoStudioProvider.tsx** - State Management
- Centralized context provider
- API action handlers
- Error/loading state management
- Modal state coordination

#### **useEditorActions.ts** - Image Operations
- Image CRUD operations
- State transitions
- History management (undo/redo)
- Canvas integration helpers

#### **editorState.ts** - Recoil State
- Atomic state definitions
- Computed selectors
- Type safety

## Data Flow Patterns

### **Unidirectional Data Flow**
```
User Action → Custom Hook → Recoil State → Selector → Component Re-render

Example:
User clicks image → handleSelectingImage() → updateFileExplorerImage() 
→ editorSettingsState updates → sortedFileExplorerImagesState recomputes
→ StudioImageExplorer re-renders
```

### **State Update Pattern**
```tsx
// Functional updates for batching
setEditorSettings(prev => ({
  ...prev,
  fileExplorerImages: prev.fileExplorerImages.map(img =>
    img.id === targetId ? { ...img, ...updates } : img
  ),
  selectedImageId: resetId ? "" : prev.selectedImageId
}));
```

### **Memoization Strategy**
```tsx
// Computed values
const showLoadingOverlay = useMemo(
  () => isLoadingImages || imagesError,
  [isLoadingImages, imagesError]
);

// Event handlers  
const handleSelectingImage = useCallback(
  (imageObj) => { /* logic */ },
  [dependencies]
);

// Expensive operations
const contextValue = useMemo(() => ({
  ...allPropsAndMethods
}), [dependencies]);
```

## Performance Characteristics

### **Loading State Management**
```tsx
// Consolidated loading object (prevents excessive re-renders)
const [loadingState, setLoadingState] = useState({
  canvas: false,
  imagePreparing: false, 
  images: false,
  api: false
});

// Computed convenience properties
const { isAnyLoading, apiLoading } = useMemo(
  () => ({
    isAnyLoading: Object.values(loadingState).some(Boolean),
    apiLoading: loadingState.api
  }),
  [loadingState]
);
```

### **Error Handling Strategy**
```tsx
// Structured error state
const [errorState, setErrorState] = useState({
  api: null,
  images: null, 
  subscription: null
});

// Typed error management
const setError = (type: 'api' | 'images' | 'subscription', error: string) => {
  setErrorState(prev => ({ ...prev, [type]: error }));
};
```

## Key Benefits

### **Scalability**
- Modular component architecture
- Centralized state management
- Type-safe interfaces
- Reusable patterns

### **Performance**
- Memoized computations
- Batch state updates
- Background operations
- Selective re-renders

### **Developer Experience**
- TypeScript throughout
- Comprehensive error handling
- Clear separation of concerns
- Extensive documentation

### **User Experience**
- Optimistic updates
- Smooth animations
- Progressive loading
- Error recovery

## Technology Stack

- **React 18**: Concurrent features, Suspense
- **TypeScript**: Type safety, IntelliSense
- **Recoil**: Atomic state management
- **TanStack Query**: Server state, caching
- **Fabric.js**: Canvas manipulation
- **Wix Design System**: UI components
- **CSS-in-JS**: Styled components

## Next Steps

1. Study the [`state-management.md`](./02-state-management.md) for Recoil patterns
2. Review [`provider-architecture.md`](./03-provider-architecture.md) for context patterns  
3. Examine [`component-structure.md`](./04-component-structure.md) for UI organization
4. Follow [`implementation-guide.md`](./06-implementation-guide.md) for step-by-step build instructions
