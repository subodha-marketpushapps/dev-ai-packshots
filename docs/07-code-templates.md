# Code Templates

This document provides ready-to-use code templates for implementing the PhotoStudio-style system in new projects.

## Project Setup Templates

### **Package.json Dependencies**

```json
{
  "dependencies": {
    "@wix/design-system": "^11.0.0",
    "@tanstack/react-query": "^4.29.0",
    "recoil": "^0.7.7",
    "fabric": "^5.3.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/fabric": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### **Recoil Root Setup**

```tsx
// App.tsx
import React from 'react';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WixDesignSystemProvider } from '@wix/design-system';
import { PhotoStudioProvider } from './providers/PhotoStudioProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <WixDesignSystemProvider>
          <PhotoStudioProvider>
            <YourMainApp />
          </PhotoStudioProvider>
        </WixDesignSystemProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
};

export default App;
```

## Provider Template

### **PhotoStudioProvider Implementation**

```tsx
// providers/PhotoStudioProvider.tsx
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  editorSettingsState,
  editingImageState,
  imageHistoryState,
  sortedLiveImagesSelector,
  sortedDraftImagesSelector,
  sortedFileExplorerImagesSelector,
} from '../state/editorState';
import { useEditorActions } from '../hooks/useEditorActions';
import type { PhotoStudioContextType, GeneratedImagePreview } from '../interfaces';

const PhotoStudioContext = createContext<PhotoStudioContextType | null>(null);

export const PhotoStudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  
  // Recoil state
  const [editorSettings, setEditorSettings] = useRecoilState(editorSettingsState);
  const [editingImage, setEditingImage] = useRecoilState(editingImageState);
  const [imageHistory, setImageHistory] = useRecoilState(imageHistoryState);
  
  // Computed selectors
  const sortedLiveImages = useRecoilValue(sortedLiveImagesSelector);
  const sortedDraftImages = useRecoilValue(sortedDraftImagesSelector);
  const sortedFileExplorerImages = useRecoilValue(sortedFileExplorerImagesSelector);
  
  // Custom hooks
  const editorActions = useEditorActions();
  
  // API queries
  const {
    data: productImages,
    isLoading: isLoadingImages,
    error: imagesError,
    refetch: refetchImages,
  } = useQuery({
    queryKey: ['product-images', editorSettings.productId],
    queryFn: () => fetchProductImages(editorSettings.productId),
    enabled: !!editorSettings.productId,
  });
  
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
  });
  
  // Mutations
  const publishImageMutation = useMutation({
    mutationFn: publishImage,
    onSuccess: () => {
      queryClient.invalidateQueries(['product-images']);
      // Handle success
    },
    onError: (error) => {
      // Handle error
    },
  });
  
  const deleteImageMutation = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries(['product-images']);
      // Handle success
    },
  });
  
  // Modal lifecycle handlers
  const openPhotoStudio = useCallback((options: {
    productId?: string;
    studioType?: 'product' | 'upload';
  } = {}) => {
    setEditorSettings(prev => ({
      ...prev,
      isPhotoStudioOpen: true,
      productId: options.productId || prev.productId,
      studioType: options.studioType || 'product',
    }));
  }, [setEditorSettings]);
  
  const closePhotoStudio = useCallback(() => {
    setEditorSettings(prev => ({
      ...prev,
      isPhotoStudioOpen: false,
      isFileExplorerOpen: true,
    }));
    
    // Clear editing state
    setEditingImage(null);
    setImageHistory([]);
    
    // Clear any pending operations
    queryClient.cancelQueries(['product-images']);
  }, [setEditorSettings, setEditingImage, setImageHistory, queryClient]);
  
  // Image operations
  const publishImage = useCallback(async (imageId: string) => {
    try {
      await publishImageMutation.mutateAsync(imageId);
    } catch (error) {
      console.error('Failed to publish image:', error);
    }
  }, [publishImageMutation]);
  
  const deleteImage = useCallback(async (imageId: string) => {
    try {
      await deleteImageMutation.mutateAsync(imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }, [deleteImageMutation]);
  
  // Computed loading states
  const apiLoading = useMemo(() => 
    publishImageMutation.isLoading || 
    deleteImageMutation.isLoading ||
    isLoadingSubscription,
    [publishImageMutation.isLoading, deleteImageMutation.isLoading, isLoadingSubscription]
  );
  
  // Context value
  const contextValue = useMemo<PhotoStudioContextType>(() => ({
    // State
    editorSettings,
    setEditorSettings,
    editingImage,
    setEditingImage,
    imageHistory,
    setImageHistory,
    
    // Computed data
    sortedLiveImages,
    sortedDraftImages,
    sortedFileExplorerImages,
    productImages,
    subscription,
    
    // Loading states
    isLoadingImages,
    isLoadingSubscription,
    apiLoading,
    imagesError,
    
    // Actions
    openPhotoStudio,
    closePhotoStudio,
    publishImage,
    deleteImage,
    refetchImages,
    
    // Editor actions
    ...editorActions,
  }), [
    editorSettings,
    setEditorSettings,
    editingImage,
    setEditingImage,
    imageHistory,
    setImageHistory,
    sortedLiveImages,
    sortedDraftImages,
    sortedFileExplorerImages,
    productImages,
    subscription,
    isLoadingImages,
    isLoadingSubscription,
    apiLoading,
    imagesError,
    openPhotoStudio,
    closePhotoStudio,
    publishImage,
    deleteImage,
    refetchImages,
    editorActions,
  ]);
  
  return (
    <PhotoStudioContext.Provider value={contextValue}>
      {children}
    </PhotoStudioContext.Provider>
  );
};

export const usePhotoStudio = (): PhotoStudioContextType => {
  const context = useContext(PhotoStudioContext);
  if (!context) {
    throw new Error('usePhotoStudio must be used within PhotoStudioProvider');
  }
  return context;
};
```

## State Templates

### **Recoil Atoms and Selectors**

```typescript
// state/editorState.ts
import { atom, selector } from 'recoil';
import type { 
  EditorSettings, 
  GeneratedImagePreview, 
  ImageHistoryEntry 
} from '../interfaces';

// Atoms
export const editorSettingsState = atom<EditorSettings>({
  key: 'editorSettingsState',
  default: {
    isPhotoStudioOpen: false,
    isFileExplorerOpen: true,
    isModalImageDetailsOpen: false,
    selectedImageDetails: null,
    studioType: 'product',
    productId: '',
    promptSettings: {
      prompt: '',
      negativePrompt: '',
      mode: 'enhance',
      qualityTags: [],
    },
    outputSettings: {
      aspectRatio: '1:1',
      batchSize: 1,
      autoUpscale: false,
    },
  },
});

export const editingImageState = atom<GeneratedImagePreview | null>({
  key: 'editingImageState',
  default: null,
});

export const imageHistoryState = atom<ImageHistoryEntry[]>({
  key: 'imageHistoryState',
  default: [],
});

export const fileExplorerImagesState = atom<GeneratedImagePreview[]>({
  key: 'fileExplorerImagesState',
  default: [],
});

// Selectors
export const sortedLiveImagesSelector = selector({
  key: 'sortedLiveImagesSelector',
  get: ({ get }) => {
    const images = get(fileExplorerImagesState);
    return images
      .filter(img => img.isLive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

export const sortedDraftImagesSelector = selector({
  key: 'sortedDraftImagesSelector',
  get: ({ get }) => {
    const images = get(fileExplorerImagesState);
    return images
      .filter(img => !img.isLive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

export const sortedFileExplorerImagesSelector = selector({
  key: 'sortedFileExplorerImagesSelector',
  get: ({ get }) => {
    const images = get(fileExplorerImagesState);
    return images.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});

export const canUndoSelector = selector({
  key: 'canUndoSelector',
  get: ({ get }) => {
    const history = get(imageHistoryState);
    return history.length > 0;
  },
});

export const canRedoSelector = selector({
  key: 'canRedoSelector',
  get: ({ get }) => {
    // Implement redo logic based on your history structure
    return false;
  },
});
```

## Hook Templates

### **Custom Editor Actions Hook**

```typescript
// hooks/useEditorActions.ts
import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { 
  fileExplorerImagesState,
  editingImageState,
  imageHistoryState,
} from '../state/editorState';
import type { GeneratedImagePreview } from '../interfaces';

export const useEditorActions = () => {
  const [fileExplorerImages, setFileExplorerImages] = useRecoilState(fileExplorerImagesState);
  const [editingImage, setEditingImage] = useRecoilState(editingImageState);
  const [imageHistory, setImageHistory] = useRecoilState(imageHistoryState);
  
  // Add or update image in file explorer
  const updateFileExplorerImage = useCallback((
    imageId: string, 
    updates: Partial<GeneratedImagePreview>
  ) => {
    setFileExplorerImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, ...updates } : img
      )
    );
  }, [setFileExplorerImages]);
  
  // Add new image to file explorer
  const addFileExplorerImage = useCallback((image: GeneratedImagePreview) => {
    setFileExplorerImages(prev => [image, ...prev]);
  }, [setFileExplorerImages]);
  
  // Remove image from file explorer
  const deleteFileExplorerImage = useCallback((imageId: string) => {
    setFileExplorerImages(prev => prev.filter(img => img.id !== imageId));
    
    // Clear editing image if it's the one being deleted
    setEditingImage(prev => prev?.id === imageId ? null : prev);
  }, [setFileExplorerImages, setEditingImage]);
  
  // Select image for editing
  const selectExplorerImageForEditing = useCallback((imageId: string) => {
    const image = fileExplorerImages.find(img => img.id === imageId);
    if (image) {
      setEditingImage(image);
      
      // Add to history
      setImageHistory(prev => [...prev, {
        action: 'select',
        imageId,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [fileExplorerImages, setEditingImage, setImageHistory]);
  
  // Mark image as reference for copy editing
  const markGeneratedImageForCopyEdit = useCallback((imageId: string) => {
    updateFileExplorerImage(imageId, {
      imageState: 'reference',
      isReference: true,
    });
  }, [updateFileExplorerImage]);
  
  // Undo last action
  const undo = useCallback(() => {
    if (imageHistory.length === 0) return;
    
    const lastAction = imageHistory[imageHistory.length - 1];
    setImageHistory(prev => prev.slice(0, -1));
    
    // Implement undo logic based on action type
    switch (lastAction.action) {
      case 'select':
        setEditingImage(null);
        break;
      case 'update':
        // Restore previous state
        break;
      case 'delete':
        // Restore deleted image
        break;
    }
  }, [imageHistory, setImageHistory, setEditingImage]);
  
  // Clear all images
  const clearAllImages = useCallback(() => {
    setFileExplorerImages([]);
    setEditingImage(null);
    setImageHistory([]);
  }, [setFileExplorerImages, setEditingImage, setImageHistory]);
  
  return {
    updateFileExplorerImage,
    addFileExplorerImage,
    deleteFileExplorerImage,
    selectExplorerImageForEditing,
    markGeneratedImageForCopyEdit,
    undo,
    clearAllImages,
  };
};
```

### **API Integration Hook**

```typescript
// hooks/useAPI.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { GeneratedImagePreview, PublishImageRequest } from '../interfaces';

export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => apiClient.getProductImages(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenerateImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: GenerateImageRequest) => 
      apiClient.generateImages(request),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['product-images', variables.productId]);
    },
  });
};

export const usePublishImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: PublishImageRequest) => 
      apiClient.publishImage(request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['product-images']);
    },
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (imageId: string) => 
      apiClient.deleteImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries(['product-images']);
    },
  });
};
```

## Component Templates

### **Modal Container Template**

```tsx
// components/PhotoStudio.tsx
import React, { useMemo } from 'react';
import { Modal, Box } from '@wix/design-system';
import { usePhotoStudio } from '../providers/PhotoStudioProvider';
import { StudioHeader } from './StudioHeader';
import { StudioImageExplorer } from './StudioImageExplorer';
import { StudioEditor } from './StudioEditor';
import { LoadingOverlay } from './LoadingOverlay';

export const PhotoStudio: React.FC = () => {
  const {
    editorSettings: { isPhotoStudioOpen },
    isLoadingImages,
    imagesError,
    apiLoading,
    closePhotoStudio,
  } = usePhotoStudio();
  
  // Computed states
  const showLoadingOverlay = useMemo(
    () => isLoadingImages || imagesError,
    [isLoadingImages, imagesError]
  );
  
  const overlayOpacity = useMemo(
    () => (!isLoadingImages && !imagesError ? 1 : 0),
    [isLoadingImages, imagesError]
  );
  
  const handleOnRequestClose = () => {
    if (apiLoading) {
      // Show warning toast
      return;
    }
    closePhotoStudio();
  };
  
  return (
    <Modal
      screen="full"
      isOpen={isPhotoStudioOpen}
      onRequestClose={handleOnRequestClose}
    >
      <Box
        height="calc(100dvh - 120px)"
        width="calc(100dvw - 120px)"
        position="relative"
        backgroundColor="D80"
        borderRadius={8}
      >
        <StudioHeader />
        
        {showLoadingOverlay && (
          <LoadingOverlay
            isLoading={isLoadingImages}
            error={imagesError}
            onRetry={closePhotoStudio}
          />
        )}
        
        <Box
          direction="horizontal"
          height="calc(100% - 55px)"
          opacity={overlayOpacity}
        >
          <StudioImageExplorer />
          <StudioEditor />
        </Box>
      </Box>
    </Modal>
  );
};
```

### **Image Grid Template**

```tsx
// components/ImageGrid.tsx
import React, { useCallback, useMemo } from 'react';
import { Box } from '@wix/design-system';
import { ImageThumbnail } from './ImageThumbnail';
import type { GeneratedImagePreview } from '../interfaces';

interface ImageGridProps {
  images: GeneratedImagePreview[];
  selectedImageId?: string;
  onImageSelect?: (image: GeneratedImagePreview) => void;
  emptyMessage?: string;
  highlightImageId?: string;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedImageId,
  onImageSelect,
  emptyMessage = "No images found",
  highlightImageId,
}) => {
  // Memoize event handler
  const handleImageClick = useCallback((image: GeneratedImagePreview) => {
    onImageSelect?.(image);
  }, [onImageSelect]);
  
  // Memoize grid items
  const gridItems = useMemo(() => 
    images.map((image) => (
      <ImageThumbnail
        key={image.id}
        image={image}
        selected={image.id === selectedImageId}
        highlighted={image.id === highlightImageId}
        onClick={handleImageClick}
      />
    )),
    [images, selectedImageId, highlightImageId, handleImageClick]
  );
  
  if (images.length === 0) {
    return (
      <Box
        height="200px"
        align="center"
        verticalAlign="middle"
        color="D40"
      >
        {emptyMessage}
      </Box>
    );
  }
  
  return (
    <Box
      gap="SP2"
      direction="horizontal"
      flexWrap="wrap"
      padding="SP2"
    >
      {gridItems}
    </Box>
  );
};
```

### **Canvas Editor Template**

```tsx
// components/CanvasEditor.tsx
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { fabric } from 'fabric';
import { Box } from '@wix/design-system';
import type { GeneratedImagePreview } from '../interfaces';

interface CanvasEditorProps {
  image?: GeneratedImagePreview;
  isLoading?: boolean;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export interface CanvasEditorHandle {
  addRectangle: () => void;
  addCircle: () => void;
  addText: (text: string) => void;
  clearCanvas: () => void;
  downloadCanvas: (format?: string) => string;
  getCanvasData: () => any;
  loadCanvasData: (data: any) => void;
}

export const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  ({ image, isLoading = false, onCanvasReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    
    // Initialize Fabric.js canvas
    useEffect(() => {
      if (!canvasRef.current) return;
      
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: 'white',
      });
      
      fabricCanvasRef.current = canvas;
      onCanvasReady?.(canvas);
      
      return () => {
        canvas.dispose();
      };
    }, [onCanvasReady]);
    
    // Load image when changed
    useEffect(() => {
      if (!fabricCanvasRef.current || !image?.imageUrl) return;
      
      fabric.Image.fromURL(image.imageUrl, (img) => {
        const canvas = fabricCanvasRef.current!;
        
        // Scale to fit canvas
        const scale = Math.min(
          (canvas.width! * 0.8) / img.width!,
          (canvas.height! * 0.8) / img.height!
        );
        
        img.scale(scale);
        img.center();
        img.selectable = false; // Background image
        
        canvas.clear();
        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();
      });
    }, [image]);
    
    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      addRectangle: () => {
        if (!fabricCanvasRef.current) return;
        
        const rect = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'rgba(255, 0, 0, 0.5)',
          stroke: '#ff0000',
          strokeWidth: 2,
        });
        
        fabricCanvasRef.current.add(rect);
        fabricCanvasRef.current.setActiveObject(rect);
      },
      
      addCircle: () => {
        if (!fabricCanvasRef.current) return;
        
        const circle = new fabric.Circle({
          left: 150,
          top: 150,
          radius: 50,
          fill: 'rgba(0, 255, 0, 0.5)',
          stroke: '#00ff00',
          strokeWidth: 2,
        });
        
        fabricCanvasRef.current.add(circle);
        fabricCanvasRef.current.setActiveObject(circle);
      },
      
      addText: (text: string) => {
        if (!fabricCanvasRef.current) return;
        
        const textObj = new fabric.Text(text, {
          left: 200,
          top: 200,
          fontSize: 20,
          fill: '#000000',
        });
        
        fabricCanvasRef.current.add(textObj);
        fabricCanvasRef.current.setActiveObject(textObj);
      },
      
      clearCanvas: () => {
        if (!fabricCanvasRef.current) return;
        fabricCanvasRef.current.clear();
      },
      
      downloadCanvas: (format = 'png') => {
        if (!fabricCanvasRef.current) return '';
        
        return fabricCanvasRef.current.toDataURL({
          format,
          quality: 0.8,
        });
      },
      
      getCanvasData: () => {
        if (!fabricCanvasRef.current) return null;
        return fabricCanvasRef.current.toJSON();
      },
      
      loadCanvasData: (data: any) => {
        if (!fabricCanvasRef.current) return;
        
        fabricCanvasRef.current.loadFromJSON(data, () => {
          fabricCanvasRef.current!.renderAll();
        });
      },
    }));
    
    return (
      <Box position="relative">
        {isLoading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(255, 255, 255, 0.8)"
            align="center"
            verticalAlign="middle"
            zIndex={1}
          >
            Loading...
          </Box>
        )}
        
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}
        />
      </Box>
    );
  }
);

CanvasEditor.displayName = 'CanvasEditor';
```

## API Service Templates

### **API Client Template**

```typescript
// services/apiClient.ts
import type { 
  GeneratedImagePreview, 
  GenerateImageRequest,
  PublishImageRequest,
  Subscription 
} from '../interfaces';

class APIClient {
  private baseURL = process.env.REACT_APP_API_BASE_URL || '';
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getProductImages(productId: string): Promise<GeneratedImagePreview[]> {
    return this.request<GeneratedImagePreview[]>(`/products/${productId}/images`);
  }
  
  async generateImages(request: GenerateImageRequest): Promise<GeneratedImagePreview[]> {
    return this.request<GeneratedImagePreview[]>('/images/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  async publishImage(request: PublishImageRequest): Promise<void> {
    return this.request<void>('/images/publish', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  async deleteImage(imageId: string): Promise<void> {
    return this.request<void>(`/images/${imageId}`, {
      method: 'DELETE',
    });
  }
  
  async getSubscription(): Promise<Subscription> {
    return this.request<Subscription>('/subscription');
  }
}

export const apiClient = new APIClient();
```

## Testing Templates

### **Provider Test Template**

```typescript
// __tests__/PhotoStudioProvider.test.tsx
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhotoStudioProvider, usePhotoStudio } from '../providers/PhotoStudioProvider';

const TestComponent = () => {
  const { 
    editorSettings, 
    openPhotoStudio, 
    closePhotoStudio 
  } = usePhotoStudio();
  
  return (
    <div>
      <div data-testid="is-open">
        {editorSettings.isPhotoStudioOpen ? 'open' : 'closed'}
      </div>
      <button onClick={() => openPhotoStudio()}>Open</button>
      <button onClick={closePhotoStudio}>Close</button>
    </div>
  );
};

const renderWithProviders = (children: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <PhotoStudioProvider>
          {children}
        </PhotoStudioProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
};

describe('PhotoStudioProvider', () => {
  test('opens and closes studio', async () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('is-open')).toHaveTextContent('closed');
    
    act(() => {
      screen.getByText('Open').click();
    });
    
    expect(screen.getByTestId('is-open')).toHaveTextContent('open');
    
    act(() => {
      screen.getByText('Close').click();
    });
    
    expect(screen.getByTestId('is-open')).toHaveTextContent('closed');
  });
});
```

These templates provide a solid foundation for implementing a PhotoStudio-style system in any React project.
