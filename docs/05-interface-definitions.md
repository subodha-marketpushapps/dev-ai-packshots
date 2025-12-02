# Interface Definitions

This document provides comprehensive TypeScript interface definitions for building a modal-based image editing system.

## Core Image Interfaces

### **ProcessState Type**
```typescript
export type ProcessState =
  | "edit"        // Currently being edited on canvas
  | "processing"  // Being generated/processed by AI
  | "publishing"  // Being published to product gallery  
  | "confirm"     // Awaiting user confirmation (batch operations)
  | "selected"    // Selected for batch operations
  | "reference"   // Used as reference for AI operations
  | "error"       // Processing failed
  | "deleting"    // Being deleted
  | "uploaded"    // User-uploaded image
  | "none";       // Default state

export const PROCESS_STATES = {
  EDIT: "edit" as ProcessState,
  PROCESSING: "processing" as ProcessState,
  PUBLISHING: "publishing" as ProcessState,
  CONFIRM: "confirm" as ProcessState,
  SELECTED: "selected" as ProcessState,
  REFERENCE: "reference" as ProcessState,
  ERROR: "error" as ProcessState,
  DELETING: "deleting" as ProcessState,
  UPLOADED: "uploaded" as ProcessState,
  NONE: "none" as ProcessState,
};
```

### **Base Image Interface**
```typescript
export interface GeneratedImage {
  // Core identifiers
  id: string;
  parentTaskId: string | null;
  instanceId: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  startedAt: string;
  finishedAt: string | null;
  
  // Status tracking
  generationStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PARTIALLY_COMPLETED" | "FAILED";
  imageStatus: "PENDING" | "DRAFT" | "PUBLISHED" | "FAILED";
  
  // Image data
  imageUrl: string | null;
  inputImageUrl: string | null;
  queueUrl: string;
  
  // AI processing
  enhancedPrompt: string;
  aiProvider: "photoroom" | "flux-pro" | "flux-max";
  task: "remove-bg" | "change-item-color" | "change-bg-color" | "change-bg";
  
  // Product context
  productId: string | null;
  variantId: string | null;
  
  // Processing details
  options: string;
  seed: string | number | null;
  error: string | null;
  creditsUsed: number;
  
  // User feedback
  feedback: "GOOD" | "BAD" | "NOT_SURE";
  comments: string;
  
  // Quality settings
  qualityTags: string[];
  background: "original" | "color" | "ai";
  position: "original" | "ai";
  
  // Thumbnails
  thumbnails: {
    thumbnail60?: string;
    thumbnail100?: string;
  };
}
```

### **Image Preview Interface**
```typescript
/**
 * Lightweight version of GeneratedImage for UI display
 * Omits heavy processing data and adds UI-specific fields
 */
export interface GeneratedImagePreview extends Omit<
  GeneratedImage,
  | "createdAt" 
  | "updatedAt" 
  | "instanceId"
  | "aiProvider" 
  | "task"
  | "startedAt" 
  | "finishedAt"
  | "queueUrl" 
  | "options" 
  | "error"
  | "creditsUsed" 
  | "seed"
> {
  // Optional overrides
  createdAt?: number;
  seed?: string | number | null;
  
  // UI-specific state
  imageState?: ProcessState;
  isLiveImage?: boolean;        // Published to product gallery
  customPrompt?: string;        // User's custom prompt
  
  /**
   * Explicit order for live images in explorer
   * Only set for isLiveImage=true
   */
  order?: number;
}
```

### **Canvas Layer Interface**
```typescript
/**
 * Extended image interface for canvas editing
 * Includes physical dimensions and file reference
 */
export interface Layer extends GeneratedImagePreview {
  // File reference
  file: File | null;
  imageUrl: string | null;
  
  // Canvas dimensions
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}
```

## Editor State Interfaces

### **Editor Settings**
```typescript
export interface EditorSettings {
  // UI state
  activePromptToolbar: boolean;
  isFileExplorerOpen: boolean;
  
  // Image collection
  fileExplorerImages: GeneratedImagePreview[];
  selectedImageId: string | null;
  
  // Modal states
  isModalImageDetailsOpen: boolean;
  selectedImageDetails: GeneratedImagePreview | null;
  imageDetailsMode: ImageDetailsMode;
}

export type ImageDetailsMode = "detailed" | "fullscreen" | "compare";
```

### **History State**
```typescript
export interface ImageHistoryState {
  states: Layer[];      // Array of layer snapshots
  currentIndex: number; // Current position in history
}

// History management constants
export const MAX_HISTORY_SIZE = 50;
```

## AI Processing Interfaces

### **Prompt Settings**
```typescript
export interface PromptSettings {
  prompt: string;
  qualityTags: string[];
  background: "original" | "color" | "ai";
  position: "original" | "ai";
}
```

### **Output Settings**
```typescript
export interface OutputSettings {
  aspectRatio: AspectRatio;
  editingMode: PromptEditingMode;
  autoUpscaling: boolean;
  batchSize: number;
}

export type PromptEditingMode = "enhance" | "edit";

export type AspectRatio =
  | "original"
  | "21:9"    // Ultra-wide
  | "16:9"    // Widescreen
  | "4:3"     // Traditional
  | "3:2"     // Photography
  | "1:1"     // Square
  | "2:3"     // Portrait 3:2
  | "3:4"     // Portrait 4:3
  | "9:16"    // Vertical 16:9
  | "9:21";   // Vertical ultra-wide
```

### **Flux API Interfaces**
```typescript
export interface FluxImageEditorRequest {
  // Core parameters
  prompt?: string;
  seed?: string;
  outputFormat?: OutputFormat;
  
  // Quality settings
  qualityTags?: string[];
  background?: "original" | "color" | "ai";
  position?: "original" | "ai";
  
  // Image processing
  inputImageUrl?: string;
  maskImageUrl?: string;
  
  // Output settings
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export interface FluxImageEditorResponse {
  // Identifiers
  id: string;
  parentTaskId: string | null;
  instanceId: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  startedAt: string;
  finishedAt?: string | null;
  
  // Status
  generationStatus: GenerationStatus;
  imageStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";
  
  // Processing details
  enhancedPrompt?: string | null;
  aiProvider: "photoroom" | "flux-pro" | "flux-max";
  task: FluxTaskType;
  
  // Product context
  productId: string | null;
  variantId: string | null;
  
  // Results
  imageUrl?: string | null;
  inputImageUrl?: string | null;
  queueUrl: string;
  
  // Error handling
  error?: string | null;
  
  // Settings
  options?: string;
  seed?: string | number | null;
  
  // User feedback
  feedback?: FeedbackType;
  comments?: string;
  creditsUsed?: number;
}

export type GenerationStatus =
  | "PENDING"
  | "IN_PROGRESS" 
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "FAILED";

export type FluxTaskType = 
  | "remove-bg"
  | "change-item-color"
  | "change-bg-color"
  | "change-bg";

export type FeedbackType = "GOOD" | "BAD" | "NOT_SURE";

export type OutputFormat = "jpeg" | "png" | "webp";
```

## Modal and Provider Interfaces

### **Modal State**
```typescript
export interface ModalState {
  isPhotoStudioOpen: boolean;
  studioType: StudioTypes;
  productId?: string;
  initialSelectedImageId?: string;
}

export type StudioTypes = "general" | "product";

export interface OpenStudioParams {
  type?: StudioTypes;
  productId?: string;
  initialImageId?: string;
  imageType?: "live" | "draft";
}
```

### **Loading States**
```typescript
export interface LoadingState {
  api: boolean;           // API operations in progress
  canvas: boolean;        // Canvas operations loading
  imagePreparing: boolean; // Image preparation for AI
  images: boolean;        // Image fetching/loading
}

export interface ComputedLoadingStates {
  isAnyLoading: boolean;
  isLoadingCanvas: boolean;
  isApiImagePreparing: boolean;
  isLoadingImages: boolean;
  apiLoading: boolean;
}
```

### **Error States**
```typescript
export interface ErrorState {
  api: string | null;          // API operation errors
  images: string | null;       // Image loading errors
  subscription: string | null; // Subscription/credit errors
}

export type ErrorType = keyof ErrorState;
```

### **Provider Context Type**
```typescript
export interface PhotoStudioContextType {
  // === State ===
  sortedFileExplorerImages: GeneratedImagePreview[];
  sortedLiveImages: GeneratedImagePreview[];
  sortedDraftImages: GeneratedImagePreview[];
  editingImage: Layer | null;
  editorSettings: EditorSettings;
  
  // === Image Actions ===
  updateFileExplorerImage: (
    id: string, 
    updates: Partial<GeneratedImagePreview>,
    resetId?: boolean,
    filterTempImages?: boolean,
    avoidPublishingImages?: boolean
  ) => void;
  addFileExplorerImage: (
    image: GeneratedImagePreview, 
    resetId?: boolean
  ) => void;
  deleteFileExplorerImage: (id: string) => void;
  selectExplorerImageForEditing: (
    id: string, 
    updates?: Partial<GeneratedImagePreview>,
    filterTempImages?: boolean
  ) => void;
  markGeneratedImageForCopyEdit: (id: string) => void;
  
  // === Canvas Actions ===
  updateLayerState: (updates: Partial<Layer>) => void;
  updateCanvasImage: (image: GeneratedImagePreview) => void;
  showImageDetails: (image: GeneratedImagePreview, mode: ImageDetailsMode) => void;
  
  // === History ===
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // === Modal Management ===
  openPhotoStudio: (params: OpenStudioParams) => Promise<void>;
  closePhotoStudio: () => void;
  isPhotoStudioOpen: boolean;
  studioType: StudioTypes;
  productId?: string;
  initialSelectedImageId?: string;
  
  // === API Actions ===
  publishImage: (image: GeneratedImagePreview, productId: string) => Promise<void>;
  unpublishImage: (image: GeneratedImagePreview, productId: string) => Promise<void>;
  deleteImage: (image: GeneratedImagePreview) => Promise<void>;
  refreshProductImages: () => void;
  changeProductId: (productId: string) => Promise<void>;
  
  // === Loading States ===
  loadingState: LoadingState;
  isAnyLoading: boolean;
  isLoadingImages: boolean;
  isLoadingCanvas: boolean;
  isApiImagePreparing: boolean;
  apiLoading: boolean;
  setApiLoading: (loading: boolean) => void;
  setIsLoadingCanvas: (loading: boolean) => void;
  setApiImagePreparing: (loading: boolean) => void;
  setImagesLoaded: () => void;
  
  // === Error Management ===
  errorState: ErrorState;
  setError: (type: ErrorType, error: string) => void;
  clearError: (type: ErrorType) => void;
  
  // === Settings ===
  promptSettings: PromptSettings;
  setPromptSettings: React.Dispatch<React.SetStateAction<PromptSettings>>;
  outputSettings: OutputSettings;
  setOutputSettings: React.Dispatch<React.SetStateAction<OutputSettings>>;
  
  // === Last API Request ===
  lastApiRequest: {
    promptSettings: PromptSettings;
    outputSettings: OutputSettings;
    editingImage: GeneratedImagePreview | null;
  } | null;
  setLastApiRequest: React.Dispatch<React.SetStateAction<typeof lastApiRequest>>;
}
```

## Subscription and Product Interfaces

### **Subscription**
```typescript
export interface SubscriptionResponse {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "inactive" | "cancelled" | "expired";
  creditsAvailable: number;
  creditsTotal: number;
  creditsUsed: number;
  expiresAt?: string;
  renewsAt?: string;
  features: string[];
}
```

### **Product Context**
```typescript
// Wix Store Product (simplified)
export interface Product {
  _id: string;
  name: string;
  description?: string;
  media?: {
    items: MediaItem[];
  };
  slug: string;
  visible: boolean;
}

export interface MediaItem {
  _id?: string;
  image?: {
    url: string;
    altText?: string;
  };
  video?: {
    url: string;
  };
}
```

## Component Props Interfaces

### **Image Preview Components**
```typescript
export interface SelectableImagePreviewProps {
  imageObj: GeneratedImagePreview;
  height?: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: (image?: GeneratedImagePreview) => void;
}

export interface ImagePreviewerProps {
  image: GeneratedImagePreview;
  isSingleImage?: boolean;
  aspectRatio?: string;
  errorMessage?: string;
  onRetry?: () => void;
}
```

### **Editor Component Props**
```typescript
export interface EditorPhotoActionsProps {
  mode?: "live" | "draft" | "multiple" | "processing" | "uploaded";
  imageObject: GeneratedImagePreview;
}

export interface EditorMultiImagesProps {
  aspectRatio?: string;
}

export interface EditorCanvasProps {
  // Canvas component props
}

export interface EditorCanvasHandle {
  addRectangle: () => void;
  addCircle: () => void;
  downloadCanvas: (options?: DownloadCanvasOptions) => void;
  getCanvasAsFile: (options?: DownloadCanvasOptions) => File | null;
  clearCanvas: () => void;
}

export interface DownloadCanvasOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  multiplier?: number;
}
```

## Utility Types

### **State Update Helpers**
```typescript
export type StateUpdater<T> = T | ((prev: T) => T);

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

### **Event Handler Types**
```typescript
export type ImageSelectHandler = (image: GeneratedImagePreview) => void;
export type ImageUpdateHandler = (id: string, updates: Partial<GeneratedImagePreview>) => void;
export type ImageDeleteHandler = (id: string) => void;

export type ModalOpenHandler = (params: OpenStudioParams) => Promise<void>;
export type ModalCloseHandler = () => void;

export type ErrorHandler = (type: ErrorType, error: string) => void;
export type LoadingHandler = (loading: boolean) => void;
```

### **API Response Types**
```typescript
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ImageUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}
```

## Constants and Enums

### **Process State Constants**
```typescript
export const IMAGE_STATES = {
  // Active states
  EDITING: 'edit',
  PROCESSING: 'processing',
  PUBLISHING: 'publishing',
  
  // Selection states  
  SELECTED: 'selected',
  REFERENCE: 'reference',
  UPLOADED: 'uploaded',
  
  // Completion states
  CONFIRM: 'confirm',
  ERROR: 'error',
  DELETING: 'deleting',
  NONE: 'none',
} as const;
```

### **UI Constants**
```typescript
export const UI_CONSTANTS = {
  MAX_HISTORY_SIZE: 50,
  MAX_LIVE_IMAGES: 10,
  MAX_REFERENCE_IMAGES: 6,
  DEFAULT_CANVAS_WIDTH: 800,
  DEFAULT_CANVAS_HEIGHT: 600,
  MODAL_ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
} as const;
```

This comprehensive interface system provides type safety and clear contracts for all components in the modal-based editing system.
