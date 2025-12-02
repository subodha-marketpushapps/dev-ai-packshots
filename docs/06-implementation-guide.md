# Implementation Guide

This guide provides step-by-step instructions for building a similar modal-based editing system from scratch.

## Phase 1: Project Setup

### **1.1 Initialize Project**

```bash
# Create new React project with TypeScript
npx create-react-app my-editor --template typescript
cd my-editor

# Install core dependencies
npm install recoil @tanstack/react-query fabric uuid
npm install @types/uuid @types/fabric --save-dev

# Install UI library (choose one)
npm install @wix/design-system  # or your preferred UI library
# npm install @mui/material
# npm install antd
```

### **1.2 Project Structure**

```
src/
├── state/
│   ├── editorState.ts          # Recoil atoms & selectors
│   ├── modalState.ts           # Modal state atoms
│   └── index.ts                # Export all state
├── providers/
│   ├── EditorProvider.tsx      # Main context provider
│   ├── ToastProvider.tsx       # Toast notifications
│   └── index.ts                # Export providers
├── hooks/
│   ├── useEditorActions.ts     # Core editing logic
│   ├── useApiHandlers.ts       # API integration
│   ├── useModalState.ts        # Modal management
│   └── index.ts                # Export hooks
├── components/
│   ├── MainModal/              # Modal container
│   ├── Editor/                 # Editing interface
│   ├── Sidebar/                # File explorer
│   ├── Canvas/                 # Drawing canvas
│   └── common/                 # Shared components
├── interfaces/
│   ├── editor.ts               # Editor interfaces
│   ├── api.ts                  # API types
│   └── index.ts                # Export types
├── services/
│   ├── api/                    # API client
│   └── utils/                  # Utilities
└── App.tsx                     # Root component
```

### **1.3 Basic App Setup**

```tsx
// src/App.tsx
import React from 'react';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditorProvider } from './providers';
import { ToastProvider } from './providers';
import MainApp from './MainApp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <ToastProvider>
          <EditorProvider>
            <MainApp />
          </EditorProvider>
        </ToastProvider>
      </RecoilRoot>
    </QueryClientProvider>
  );
}

export default App;
```

## Phase 2: State Management Setup

### **2.1 Define Core Interfaces**

```typescript
// src/interfaces/editor.ts
export type ProcessState =
  | "edit"
  | "processing"
  | "confirm"
  | "selected"
  | "reference"
  | "error"
  | "deleting"
  | "uploaded"
  | "none";

export interface ImagePreview {
  id: string;
  imageUrl: string;
  createdAt?: number;
  imageState?: ProcessState;
  isLiveImage?: boolean;
  order?: number;
  productId?: string;
  enhancedPrompt?: string;
}

export interface Layer extends ImagePreview {
  file: File | null;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface EditorSettings {
  activePromptToolbar: boolean;
  isFileExplorerOpen: boolean;
  fileExplorerImages: ImagePreview[];
  selectedImageId: string | null;
  isModalImageDetailsOpen: boolean;
  selectedImageDetails: ImagePreview | null;
}

export interface ImageHistoryState {
  states: Layer[];
  currentIndex: number;
}

export const PROCESS_STATES = {
  EDIT: "edit" as ProcessState,
  PROCESSING: "processing" as ProcessState,
  CONFIRM: "confirm" as ProcessState,
  SELECTED: "selected" as ProcessState,
  REFERENCE: "reference" as ProcessState,
  ERROR: "error" as ProcessState,
  DELETING: "deleting" as ProcessState,
  UPLOADED: "uploaded" as ProcessState,
  NONE: "none" as ProcessState,
};
```

### **2.2 Create Recoil Atoms**

```typescript
// src/state/editorState.ts
import { atom, selector } from 'recoil';
import { EditorSettings, Layer, ImageHistoryState, ImagePreview } from '../interfaces';

export const editorSettingsState = atom<EditorSettings>({
  key: 'editorSettingsState',
  default: {
    activePromptToolbar: false,
    isFileExplorerOpen: true,
    fileExplorerImages: [],
    selectedImageId: null,
    isModalImageDetailsOpen: false,
    selectedImageDetails: null,
  },
});

export const editingImageState = atom<Layer | null>({
  key: 'editingImageState',
  default: null,
});

export const imageHistoryState = atom<ImageHistoryState>({
  key: 'imageHistoryState',
  default: {
    states: [],
    currentIndex: 0,
  },
});

// Computed selectors
export const sortedFileExplorerImagesState = selector<ImagePreview[]>({
  key: 'sortedFileExplorerImagesState',
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return [...(editorSettings.fileExplorerImages || [])].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  },
});

export const processingImagesState = selector<ImagePreview[]>({
  key: 'processingImagesState',
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (editorSettings.fileExplorerImages || []).filter(
      (image) => image.imageState === 'processing'
    );
  },
});

export const selectedImagesState = selector<ImagePreview[]>({
  key: 'selectedImagesState',
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (editorSettings.fileExplorerImages || []).filter(
      (image) => image.imageState === 'selected' || image.imageState === 'uploaded'
    );
  },
});

export const referenceImageState = selector<ImagePreview | null>({
  key: 'referenceImageState',
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (
      (editorSettings.fileExplorerImages || []).find(
        (image) => image.imageState === 'reference'
      ) || null
    );
  },
});
```

### **2.3 Create Modal State**

```typescript
// src/state/modalState.ts
import { atom } from 'recoil';

export type StudioTypes = 'general' | 'product';

export interface ModalState {
  isEditorOpen: boolean;
  studioType: StudioTypes;
  productId?: string;
  initialSelectedImageId?: string;
}

export const modalState = atom<ModalState>({
  key: 'modalState',
  default: {
    isEditorOpen: false,
    studioType: 'general',
    productId: undefined,
    initialSelectedImageId: undefined,
  },
});
```

## Phase 3: Custom Hooks

### **3.1 Editor Actions Hook**

```typescript
// src/hooks/useEditorActions.ts
import { useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue, useRecoilCallback } from 'recoil';
import {
  editingImageState,
  editorSettingsState,
  imageHistoryState,
  sortedFileExplorerImagesState,
  processingImagesState,
  selectedImagesState,
  referenceImageState,
} from '../state/editorState';
import { ImagePreview, Layer } from '../interfaces';

const MAX_HISTORY_SIZE = 50;

export const useEditorActions = () => {
  const [editingImage, setEditingImage] = useRecoilState(editingImageState);
  const [editorSettings, setEditorSettings] = useRecoilState(editorSettingsState);
  const [history, setHistory] = useRecoilState(imageHistoryState);

  const sortedFileExplorerImages = useRecoilValue(sortedFileExplorerImagesState);
  const processingImages = useRecoilValue(processingImagesState);
  const selectedImages = useRecoilValue(selectedImagesState);
  const referenceImage = useRecoilValue(referenceImageState);

  // Undo/redo state
  const { canUndo, canRedo } = useMemo(
    () => ({
      canUndo: history.currentIndex > 0,
      canRedo: history.currentIndex < history.states.length - 1,
    }),
    [history.currentIndex, history.states.length]
  );

  // Update current editing image
  const updateLayerState = useCallback(
    (updates: Partial<Layer>) => {
      setEditingImage((prev) => (prev ? { ...prev, ...updates } : prev));
    },
    [setEditingImage]
  );

  // Update image in explorer
  const updateFileExplorerImage = useCallback(
    (
      imageId: string,
      updates: Partial<ImagePreview>,
      resetId: boolean = false
    ) => {
      setEditorSettings((prev) => ({
        ...prev,
        fileExplorerImages: prev.fileExplorerImages.map((img) =>
          img.id === imageId ? { ...img, ...updates } : img
        ),
        selectedImageId: resetId ? null : prev.selectedImageId,
      }));
    },
    [setEditorSettings]
  );

  // Add new image
  const addFileExplorerImage = useCallback(
    (newImage: ImagePreview, resetId: boolean = true) => {
      setEditorSettings((prev) => ({
        ...prev,
        fileExplorerImages: [newImage, ...prev.fileExplorerImages],
        selectedImageId: resetId ? null : prev.selectedImageId,
      }));
    },
    [setEditorSettings]
  );

  // Delete image
  const deleteFileExplorerImage = useCallback(
    (imageId: string) => {
      setEditorSettings((prev) => ({
        ...prev,
        fileExplorerImages: prev.fileExplorerImages.filter(
          (img) => img.id !== imageId
        ),
      }));
    },
    [setEditorSettings]
  );

  // Select image for editing with history
  const selectExplorerImageForEditing = useRecoilCallback(
    ({ snapshot, set }) =>
      (imageId: string, updates?: Partial<ImagePreview>) => {
        const editorSettings = snapshot.getLoadable(editorSettingsState).contents;
        const selectedLayer = editorSettings.fileExplorerImages.find(
          (img) => img.id === imageId
        );

        if (!selectedLayer) return;

        const img = new window.Image();
        img.onload = () => {
          const newLayer: Layer = {
            file: null,
            width: img.naturalWidth,
            height: img.naturalHeight,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            ...selectedLayer,
            ...updates,
          };

          set(editingImageState, newLayer);

          // Add to history
          const prevHistory = snapshot.getLoadable(imageHistoryState).contents;
          const newStates = [
            ...prevHistory.states.slice(0, prevHistory.currentIndex + 1),
            newLayer,
          ];
          let newIndex = prevHistory.currentIndex + 1;

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
            fileExplorerImages: prev.fileExplorerImages.map((img) => {
              if (img.id === imageId) {
                return { ...img, imageState: 'edit', ...updates };
              }
              return { ...img, imageState: undefined };
            }),
            selectedImageId: imageId,
          }));
        };
        img.src = selectedLayer.imageUrl;
      },
    []
  );

  // Undo/redo
  const undo = useCallback(() => {
    if (history.currentIndex > 0) {
      const prevIndex = history.currentIndex - 1;
      setEditingImage(history.states[prevIndex]);
      setHistory({ ...history, currentIndex: prevIndex });
    }
  }, [history, setEditingImage, setHistory]);

  const redo = useCallback(() => {
    if (history.currentIndex < history.states.length - 1) {
      const nextIndex = history.currentIndex + 1;
      setEditingImage(history.states[nextIndex]);
      setHistory({ ...history, currentIndex: nextIndex });
    }
  }, [history, setEditingImage, setHistory]);

  return {
    // State
    editingImage,
    editorSettings,
    sortedFileExplorerImages,
    processingImages,
    selectedImages,
    referenceImage,
    
    // Actions
    setEditorSettings,
    updateLayerState,
    updateFileExplorerImage,
    addFileExplorerImage,
    deleteFileExplorerImage,
    selectExplorerImageForEditing,
    
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    setEditingImage,
  };
};
```

### **3.2 Modal State Hook**

```typescript
// src/hooks/useModalState.ts
import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { modalState, StudioTypes } from '../state/modalState';

interface OpenEditorParams {
  type?: StudioTypes;
  productId?: string;
  initialImageId?: string;
}

export const useModalState = () => {
  const [modal, setModal] = useRecoilState(modalState);

  const openEditor = useCallback(
    ({ type = 'general', productId, initialImageId }: OpenEditorParams = {}) => {
      setModal({
        isEditorOpen: true,
        studioType: type,
        productId,
        initialSelectedImageId: initialImageId,
      });
    },
    [setModal]
  );

  const closeEditor = useCallback(() => {
    setModal((prev) => ({
      ...prev,
      isEditorOpen: false,
    }));
  }, [setModal]);

  return {
    modal,
    openEditor,
    closeEditor,
    isOpen: modal.isEditorOpen,
  };
};
```

## Phase 4: Provider Implementation

### **4.1 Main Editor Provider**

```typescript
// src/providers/EditorProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEditorActions } from '../hooks/useEditorActions';
import { useModalState } from '../hooks/useModalState';
import { ImagePreview } from '../interfaces';
import MainModal from '../components/MainModal';

interface EditorContextType {
  // State from hooks
  editingImage: ReturnType<typeof useEditorActions>['editingImage'];
  editorSettings: ReturnType<typeof useEditorActions>['editorSettings'];
  sortedFileExplorerImages: ReturnType<typeof useEditorActions>['sortedFileExplorerImages'];
  
  // Actions
  updateFileExplorerImage: ReturnType<typeof useEditorActions>['updateFileExplorerImage'];
  addFileExplorerImage: ReturnType<typeof useEditorActions>['addFileExplorerImage'];
  deleteFileExplorerImage: ReturnType<typeof useEditorActions>['deleteFileExplorerImage'];
  selectExplorerImageForEditing: ReturnType<typeof useEditorActions>['selectExplorerImageForEditing'];
  
  // Modal
  openEditor: ReturnType<typeof useModalState>['openEditor'];
  closeEditor: ReturnType<typeof useModalState>['closeEditor'];
  isEditorOpen: ReturnType<typeof useModalState>['isOpen'];
  
  // Loading states
  loadingState: {
    api: boolean;
    canvas: boolean;
    images: boolean;
  };
  setApiLoading: (loading: boolean) => void;
  setCanvasLoading: (loading: boolean) => void;
  setImagesLoading: (loading: boolean) => void;
  
  // Error states
  errorState: {
    api: string | null;
    images: string | null;
  };
  setError: (type: 'api' | 'images', error: string) => void;
  clearError: (type: 'api' | 'images') => void;
  
  // API actions
  publishImage: (image: ImagePreview, productId: string) => Promise<void>;
  deleteImage: (image: ImagePreview) => Promise<void>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const editorActions = useEditorActions();
  const modalActions = useModalState();

  // Loading states
  const [loadingState, setLoadingState] = useState({
    api: false,
    canvas: false,
    images: false,
  });

  // Error states
  const [errorState, setErrorState] = useState({
    api: null as string | null,
    images: null as string | null,
  });

  // Loading state updaters
  const setApiLoading = useCallback(
    (loading: boolean) => setLoadingState((prev) => ({ ...prev, api: loading })),
    []
  );

  const setCanvasLoading = useCallback(
    (loading: boolean) => setLoadingState((prev) => ({ ...prev, canvas: loading })),
    []
  );

  const setImagesLoading = useCallback(
    (loading: boolean) => setLoadingState((prev) => ({ ...prev, images: loading })),
    []
  );

  // Error state updaters
  const setError = useCallback(
    (type: 'api' | 'images', error: string) => {
      setErrorState((prev) => ({ ...prev, [type]: error }));
    },
    []
  );

  const clearError = useCallback(
    (type: 'api' | 'images') => {
      setErrorState((prev) => ({ ...prev, [type]: null }));
    },
    []
  );

  // API actions
  const publishImage = useCallback(
    async (image: ImagePreview, productId: string) => {
      try {
        setApiLoading(true);
        clearError('api');

        // Optimistic update
        editorActions.updateFileExplorerImage(image.id, {
          imageState: 'processing',
        });

        // API call (implement your API here)
        // await apiClient.publishImage(image, productId);

        // Success update
        editorActions.updateFileExplorerImage(image.id, {
          imageState: undefined,
          isLiveImage: true,
        });
      } catch (err: any) {
        setError('api', err.message || 'Failed to publish image');
        // Rollback on error
        editorActions.updateFileExplorerImage(image.id, {
          imageState: 'error',
        });
        throw err;
      } finally {
        setApiLoading(false);
      }
    },
    [editorActions, setApiLoading, clearError, setError]
  );

  const deleteImage = useCallback(
    async (image: ImagePreview) => {
      try {
        setApiLoading(true);
        clearError('api');

        // Optimistic update
        editorActions.updateFileExplorerImage(image.id, {
          imageState: 'deleting',
        });

        // API call (implement your API here)
        // await apiClient.deleteImage(image.id);

        // Remove from state
        editorActions.deleteFileExplorerImage(image.id);
      } catch (err: any) {
        setError('api', err.message || 'Failed to delete image');
        // Rollback on error
        editorActions.updateFileExplorerImage(image.id, {
          imageState: 'error',
        });
        throw err;
      } finally {
        setApiLoading(false);
      }
    },
    [editorActions, setApiLoading, clearError, setError]
  );

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      // State
      editingImage: editorActions.editingImage,
      editorSettings: editorActions.editorSettings,
      sortedFileExplorerImages: editorActions.sortedFileExplorerImages,
      
      // Actions
      updateFileExplorerImage: editorActions.updateFileExplorerImage,
      addFileExplorerImage: editorActions.addFileExplorerImage,
      deleteFileExplorerImage: editorActions.deleteFileExplorerImage,
      selectExplorerImageForEditing: editorActions.selectExplorerImageForEditing,
      
      // Modal
      openEditor: modalActions.openEditor,
      closeEditor: modalActions.closeEditor,
      isEditorOpen: modalActions.isOpen,
      
      // Loading
      loadingState,
      setApiLoading,
      setCanvasLoading,
      setImagesLoading,
      
      // Errors
      errorState,
      setError,
      clearError,
      
      // API
      publishImage,
      deleteImage,
    }),
    [
      editorActions,
      modalActions,
      loadingState,
      errorState,
      publishImage,
      deleteImage,
    ]
  );

  return (
    <EditorContext.Provider value={contextValue}>
      <MainModal />
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
```

## Phase 5: Component Implementation

### **5.1 Main Modal Component**

```tsx
// src/components/MainModal/MainModal.tsx
import React, { useMemo } from 'react';
import { useEditor } from '../../providers/EditorProvider';
import { Modal, Box } from '@wix/design-system'; // or your UI library
import LoadingOverlay from './LoadingOverlay';
import EditorHeader from './EditorHeader';
import EditorSidebar from './EditorSidebar';
import EditorCanvas from './EditorCanvas';

const MainModal: React.FC = () => {
  const {
    isEditorOpen,
    closeEditor,
    loadingState,
    errorState,
  } = useEditor();

  // Memoize loading state
  const showLoadingOverlay = useMemo(
    () => loadingState.images || !!errorState.images,
    [loadingState.images, errorState.images]
  );

  const overlayOpacity = useMemo(
    () => (!loadingState.images && !errorState.images ? 1 : 0),
    [loadingState.images, errorState.images]
  );

  const handleClose = () => {
    if (loadingState.api) {
      // Prevent closing during API operations
      return;
    }
    closeEditor();
  };

  if (!isEditorOpen) return null;

  return (
    <Modal
      isOpen={isEditorOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={false}
    >
      <Box
        height="calc(100vh - 120px)"
        width="calc(100vw - 120px)"
        position="relative"
        backgroundColor="white"
        borderRadius={8}
      >
        <EditorHeader />
        
        {/* Loading overlay */}
        {showLoadingOverlay && (
          <LoadingOverlay
            isLoading={loadingState.images}
            error={errorState.images}
            onRetry={() => {/* implement retry logic */}}
          />
        )}
        
        {/* Main content */}
        <Box
          direction="horizontal"
          height="calc(100% - 60px)"
          opacity={overlayOpacity}
          transition="opacity 0.3s ease"
        >
          <EditorSidebar />
          <EditorCanvas />
        </Box>
      </Box>
    </Modal>
  );
};

export default MainModal;
```

### **5.2 Loading Overlay Component**

```tsx
// src/components/MainModal/LoadingOverlay.tsx
import React from 'react';
import { Box, Loader, Text, Button } from '@wix/design-system';

interface LoadingOverlayProps {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  error,
  onRetry,
}) => {
  return (
    <Box
      position="absolute"
      top={60}
      left={0}
      width="100%"
      height="calc(100% - 60px)"
      backgroundColor="rgba(255, 255, 255, 0.95)"
      align="center"
      verticalAlign="middle"
      zIndex={99}
    >
      {isLoading && (
        <Box direction="vertical" gap="16px" align="center">
          <Loader size="medium" />
          <Text>Loading images...</Text>
        </Box>
      )}
      
      {error && (
        <Box direction="vertical" gap="16px" align="center" maxWidth="400px">
          <Text size="large" weight="bold">
            Failed to load images
          </Text>
          <Text align="center">
            There was a problem loading your images. Please try again.
          </Text>
          <Button onClick={onRetry}>
            Retry
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default LoadingOverlay;
```

### **5.3 Editor Sidebar Component**

```tsx
// src/components/MainModal/EditorSidebar.tsx
import React from 'react';
import { Box, SidePanel, Text } from '@wix/design-system';
import { useEditor } from '../../providers/EditorProvider';
import ImageThumbnail from './ImageThumbnail';

const EditorSidebar: React.FC = () => {
  const {
    editorSettings,
    sortedFileExplorerImages,
    selectExplorerImageForEditing,
    loadingState,
  } = useEditor();

  if (!editorSettings.isFileExplorerOpen) {
    return (
      <Box width="60px" height="100%" backgroundColor="lightgray">
        {/* Collapsed sidebar toggle */}
      </Box>
    );
  }

  const liveImages = sortedFileExplorerImages.filter(img => img.isLiveImage);
  const draftImages = sortedFileExplorerImages.filter(img => !img.isLiveImage);

  return (
    <SidePanel width="300px">
      <SidePanel.Header>
        <Text size="large" weight="bold">
          Images
        </Text>
      </SidePanel.Header>
      
      <SidePanel.Content>
        {/* Live Images Section */}
        <Box padding="16px">
          <Text size="medium" weight="bold" marginBottom="12px">
            Live Images ({liveImages.length})
          </Text>
          
          {liveImages.length > 0 ? (
            <Box direction="vertical" gap="8px">
              {liveImages.map((image) => (
                <ImageThumbnail
                  key={image.id}
                  image={image}
                  selected={editorSettings.selectedImageId === image.id}
                  onClick={() => selectExplorerImageForEditing(image.id)}
                />
              ))}
            </Box>
          ) : (
            <Text size="small" secondary>
              No live images
            </Text>
          )}
        </Box>
        
        {/* Draft Images Section */}
        <Box padding="16px">
          <Text size="medium" weight="bold" marginBottom="12px">
            Draft Images ({draftImages.length})
          </Text>
          
          {draftImages.length > 0 ? (
            <Box direction="vertical" gap="8px">
              {draftImages.map((image) => (
                <ImageThumbnail
                  key={image.id}
                  image={image}
                  selected={editorSettings.selectedImageId === image.id}
                  onClick={() => selectExplorerImageForEditing(image.id)}
                />
              ))}
            </Box>
          ) : (
            <Text size="small" secondary>
              No draft images
            </Text>
          )}
        </Box>
      </SidePanel.Content>
    </SidePanel>
  );
};

export default EditorSidebar;
```

## Phase 6: Canvas Integration (Optional)

### **6.1 Fabric.js Canvas Component**

```tsx
// src/components/MainModal/EditorCanvas.tsx
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import { Box } from '@wix/design-system';
import { useEditor } from '../../providers/EditorProvider';

export interface CanvasHandle {
  addRectangle: () => void;
  addCircle: () => void;
  downloadCanvas: () => string;
  clearCanvas: () => void;
}

const EditorCanvas = forwardRef<CanvasHandle>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const { editingImage, setCanvasLoading } = useEditor();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: 'white',
    });

    fabricCanvasRef.current = canvas;

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  // Load image when editingImage changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !editingImage?.imageUrl) return;

    setCanvasLoading(true);
    
    fabric.Image.fromURL(editingImage.imageUrl, (img) => {
      if (!fabricCanvasRef.current) return;

      // Clear existing objects
      fabricCanvasRef.current.clear();
      
      // Scale image to fit canvas
      const canvas = fabricCanvasRef.current;
      const scaleX = canvas.width! / img.width!;
      const scaleY = canvas.height! / img.height!;
      const scale = Math.min(scaleX, scaleY);
      
      img.scale(scale);
      img.center();
      
      // Add image to canvas
      canvas.add(img);
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      
      setCanvasLoading(false);
    });
  }, [editingImage, setCanvasLoading]);

  // Expose canvas methods
  useImperativeHandle(ref, () => ({
    addRectangle: () => {
      if (!fabricCanvasRef.current) return;
      
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: 'rgba(255, 0, 0, 0.5)',
        stroke: 'red',
        strokeWidth: 2,
      });
      
      fabricCanvasRef.current.add(rect);
    },
    
    addCircle: () => {
      if (!fabricCanvasRef.current) return;
      
      const circle = new fabric.Circle({
        left: 150,
        top: 150,
        radius: 50,
        fill: 'rgba(0, 255, 0, 0.5)',
        stroke: 'green',
        strokeWidth: 2,
      });
      
      fabricCanvasRef.current.add(circle);
    },
    
    downloadCanvas: () => {
      if (!fabricCanvasRef.current) return '';
      return fabricCanvasRef.current.toDataURL('image/png');
    },
    
    clearCanvas: () => {
      if (!fabricCanvasRef.current) return;
      fabricCanvasRef.current.clear();
    },
  }));

  return (
    <Box flexGrow={1} height="100%" align="center" verticalAlign="middle">
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }} />
    </Box>
  );
});

export default EditorCanvas;
```

## Phase 7: Testing and Refinement

### **7.1 Basic Usage Test**

```tsx
// src/MainApp.tsx
import React, { useRef } from 'react';
import { Box, Button } from '@wix/design-system';
import { useEditor } from './providers/EditorProvider';
import { CanvasHandle } from './components/MainModal/EditorCanvas';

const MainApp: React.FC = () => {
  const { openEditor, isEditorOpen } = useEditor();
  const canvasRef = useRef<CanvasHandle>(null);

  const handleOpenEditor = () => {
    openEditor({
      type: 'general',
    });
  };

  return (
    <Box padding="24px">
      <h1>My Editor App</h1>
      
      <Button onClick={handleOpenEditor} disabled={isEditorOpen}>
        Open Editor
      </Button>
      
      {/* Your main app content */}
    </Box>
  );
};

export default MainApp;
```

### **7.2 Error Boundary**

```tsx
// src/components/common/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Phase 8: Next Steps

### **8.1 Additional Features to Implement**

1. **File Upload**: Add drag-and-drop image upload
2. **API Integration**: Connect to your backend services
3. **Advanced Canvas Tools**: Drawing, text, filters
4. **Keyboard Shortcuts**: Undo/redo, save, etc.
5. **Responsive Design**: Mobile and tablet support
6. **Theme Support**: Dark/light mode
7. **Persistence**: Save work locally
8. **Collaboration**: Real-time editing

### **8.2 Performance Optimizations**

1. **Virtual Scrolling**: For large image lists
2. **Image Lazy Loading**: Load images as needed
3. **Canvas Optimization**: Debounce canvas operations
4. **Memory Management**: Clean up unused resources

### **8.3 Testing Strategy**

1. **Unit Tests**: Test hooks and utilities
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete workflows
4. **Performance Tests**: Canvas and large dataset handling

This implementation guide provides a solid foundation for building a sophisticated modal-based editor. Adapt the patterns and components to match your specific requirements and design system.
