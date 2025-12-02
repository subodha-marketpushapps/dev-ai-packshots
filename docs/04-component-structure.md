# Component Structure

This document outlines the component hierarchy, organization, and patterns used in the PhotoStudio modal-based editing system.

## Overall Architecture

```
PhotoStudio (Root Modal)
├── Overlay Modals (Stacked)
│   ├── ModalImageDetails
│   ├── ModalRequestUpgrade  
│   └── ModalRequestUnpublish
├── StudioHeader (Fixed Header)
└── MainContent (Split Layout)
    ├── LoadingOverlay (Conditional)
    ├── StudioImageExplorer (Side Panel)
    └── StudioEditor (Main Area)
```

## Root Modal Component

### **PhotoStudio.tsx** - Main Container

**Responsibilities:**
- Modal lifecycle management
- Loading overlay orchestration
- Responsive layout calculations
- Close handlers with validation

```tsx
const PhotoStudio: React.FC = () => {
  const {
    apiLoading,
    isPhotoStudioOpen,
    closePhotoStudio,
    isLoadingImages,
    imagesError,
    editorSettings,
  } = usePhotoStudio();

  // Memoized loading/error states
  const showLoadingOverlay = useMemo(
    () => isLoadingImages || imagesError,
    [isLoadingImages, imagesError]
  );

  const overlayOpacity = useMemo(
    () => (!isLoadingImages && !imagesError ? 1 : 0),
    [isLoadingImages, imagesError]
  );

  const handleOnRequestClose = () => {
    // Prevent closing during image details modal
    if (editorSettings.isModalImageDetailsOpen) return;
    
    // Prevent closing during API operations
    if (apiLoading) {
      addToast({
        content: "Please wait for the current operation to finish.",
        status: "warning",
      });
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
        {/* Stacked overlay modals */}
        <ModalImageDetails />
        <ModalRequestUpgrade />
        <ModalRequestUnpublish />
        
        {/* Fixed header */}
        <StudioHeader />
        
        {/* Loading overlay */}
        {showLoadingOverlay && (
          <LoadingOverlay
            isLoading={isLoadingImages}
            error={imagesError}
            onRetry={closePhotoStudio}
          />
        )}
        
        {/* Main content with responsive layout */}
        <MainContent opacity={overlayOpacity} />
      </Box>
    </Modal>
  );
};
```

**Key Patterns:**
- **Responsive sizing**: Adapts to screen size with viewport units
- **Conditional rendering**: Loading states and error handling
- **Event prevention**: Blocks closing during operations
- **Memoization**: Prevents unnecessary re-renders

## Header Component

### **StudioHeader** - Navigation and Controls

**Structure:**
```
StudioHeader
├── Left Section
│   ├── Close Button
│   └── Navigation Breadcrumb
├── Center Section  
│   ├── Product Selector (Product Mode)
│   └── Studio Type Indicator
└── Right Section
    ├── Subscription Info
    ├── Credits Display
    └── Action Buttons
```

**Implementation Pattern:**
```tsx
const StudioHeader: React.FC = () => {
  const {
    studioType,
    productId,
    currentProduct,
    subscription,
    changeProductId,
    closePhotoStudio,
  } = usePhotoStudio();

  return (
    <Box
      height="55px"
      padding="SP2"
      direction="horizontal"
      verticalAlign="middle"
      backgroundColor="D80"
      borderBottom="1px solid #e5e5e5"
    >
      {/* Left section */}
      <Box flexGrow={0}>
        <HeaderCloseButton onClick={closePhotoStudio} />
        <Breadcrumb studioType={studioType} productName={currentProduct?.name} />
      </Box>
      
      {/* Center section */}
      <Box flexGrow={1} align="center">
        {studioType === 'product' && (
          <ProductSelector
            selectedProductId={productId}
            onProductChange={changeProductId}
          />
        )}
      </Box>
      
      {/* Right section */}
      <Box flexGrow={0} gap="SP2">
        <SubscriptionBadge subscription={subscription} />
        <HeaderActions />
      </Box>
    </Box>
  );
};
```

## Side Panel Component

### **StudioImageExplorer** - File Gallery

**Structure:**
```
StudioImageExplorer  
├── Collapse/Expand Toggle
├── Live Images Section
│   ├── Section Header (count, actions)
│   ├── Image Grid
│   │   └── SelectableImagePreview[]
│   └── Empty State
├── Draft Images Section  
│   ├── Section Header
│   ├── Image Grid
│   │   └── SelectableImagePreview[]
│   └── Empty State
└── Upload Controls (Footer)
    ├── Upload Button
    └── Drag & Drop Zone
```

**Key Features:**
- **Collapsible**: Can minimize to icon-only view
- **Sectioned display**: Live vs Draft images
- **Auto-scrolling**: Highlights new/changed images
- **Upload integration**: Drag-and-drop support

```tsx
const StudioImageExplorer: React.FC = () => {
  const {
    editorSettings,
    sortedLiveImages,
    sortedDraftImages,
    handleSelectingImage,
    canAddReferenceImage,
  } = usePhotoStudio();

  // Filter out temporary states
  const filteredLiveImages = useMemo(() => 
    sortedLiveImages.filter(img => img.imageState !== "uploaded"),
    [sortedLiveImages]
  );

  const filteredDraftImages = useMemo(() =>
    sortedDraftImages.filter(img => 
      img.imageState !== "uploaded" && 
      img.imageState !== "publishing"
    ),
    [sortedDraftImages]
  );

  // Auto-scroll to new/changed images
  const highlightImageId = useImageHighlighting(filteredDraftImages);

  if (!editorSettings.isFileExplorerOpen) {
    return <CollapsedSidebar />;
  }

  return (
    <SidePanel width="320px">
      <SidePanel.Header>
        <Text size="large" weight="bold">Product Images</Text>
        <CollapseButton />
      </SidePanel.Header>
      
      <SidePanel.Content>
        {/* Live Images Section */}
        <ImageSection
          title="Live Images"
          images={filteredLiveImages}
          emptyMessage="No live images found"
          onImageSelect={handleSelectingImage}
        />
        
        {/* Draft Images Section */}
        <ImageSection
          title="Draft Images"  
          images={filteredDraftImages}
          emptyMessage="No draft images found"
          highlightImageId={highlightImageId}
          onImageSelect={handleSelectingImage}
        />
      </SidePanel.Content>
      
      {/* Upload Controls */}
      <SidePanel.Footer>
        <UploadControls disabled={!canAddReferenceImage()} />
      </SidePanel.Footer>
    </SidePanel>
  );
};
```

### **SelectableImagePreview** - Individual Image Component

**Features:**
- **State indicators**: Visual overlay icons for different states
- **Loading states**: Skeleton and progress indicators  
- **Interaction handling**: Click, hover, keyboard navigation
- **Accessibility**: ARIA labels and keyboard support

```tsx
const SelectableImagePreview: React.FC<SelectableImagePreviewProps> = ({
  imageObj,
  height = 100,
  selected = false,
  disabled = false,
  onClick,
}) => {
  // State-based overlay icons
  const overlayIcon = useMemo(() => {
    if (imageObj?.comments?.length > 0) {
      return <FeedbackIcon comments={imageObj.comments} />;
    }
    if (imageObj?.imageState === PROCESS_STATES.REFERENCE) {
      return <ReferenceIcon />;
    }
    if (imageObj?.imageState === PROCESS_STATES.PUBLISHING) {
      return <PublishingIcon />;
    }
    if (imageObj?.imageState === PROCESS_STATES.ERROR) {
      return <ErrorIcon />;
    }
    return null;
  }, [imageObj]);

  return (
    <Box height={height} position="relative">
      {/* State overlay icon */}
      {overlayIcon && (
        <Box position="absolute" bottom={8} right={8} zIndex={1}>
          {overlayIcon}
        </Box>
      )}
      
      {/* Main thumbnail */}
      <Thumbnail
        width="100%"
        height={height}
        selected={selected}
        disabled={disabled || isProcessingState(imageObj.imageState)}
        onClick={disabled ? undefined : () => onClick?.(imageObj)}
        image={
          <ImagePreview
            imageUrl={imageObj?.thumbnails?.thumbnail100 || imageObj.imageUrl}
            imageId={imageObj.id}
            height={height}
          />
        }
      />
      
      {/* Loading overlay for processing states */}
      {isProcessingState(imageObj.imageState) && (
        <ProcessingOverlay />
      )}
    </Box>
  );
};
```

## Main Editor Component

### **StudioEditor** - Editing Interface

**Structure:**
```
StudioEditor
├── Upload Drop Zone (Conditional)
├── Canvas Area (Single Image)
│   └── EditorCanvas (Fabric.js)
├── Multi-Image Area (Batch Mode)
│   └── EditorMultiImages
└── Prompt Input Area (Bottom)
    ├── EditorPromptInput
    └── Action Buttons
```

**Layout Logic:**
```tsx
const StudioEditor: React.FC = () => {
  const {
    editingImage,
    fileExplorerImages,
    referenceImage,
    isLoadingCanvas,
  } = usePhotoStudio();

  // Computed display states
  const isImageFileAvailable = !!(editingImage?.file || editingImage?.imageUrl);
  const showMultiStack = fileExplorerImages.some(img =>
    ["processing", "confirm", "selected", "uploaded", "deleting"].includes(img.imageState)
  );
  const showInputPrompts = (isImageFileAvailable || referenceImage) && !isProcessing;
  const showCanvas = isImageFileAvailable && !showMultiStack;
  const showUploadZone = !isImageFileAvailable && !showMultiStack && !referenceImage;

  return (
    <Box
      flexGrow={1}
      direction="vertical"
      height="100%"
      position="relative"
    >
      {/* Upload drop zone */}
      {showUploadZone && <FileUploadZone />}
      
      {/* Canvas for single image editing */}
      {showCanvas && (
        <Box flexGrow={1} align="center" verticalAlign="middle">
          <EditorCanvas
            ref={canvasRef}
            image={editingImage}
            isLoading={isLoadingCanvas}
          />
        </Box>
      )}
      
      {/* Multi-image batch processing */}
      {showMultiStack && (
        <Box flexGrow={1}>
          <EditorMultiImages aspectRatio="1:1" />
        </Box>
      )}
      
      {/* Prompt input and controls */}
      {showInputPrompts && (
        <Box position="absolute" bottom={0} width="100%">
          <EditorPromptInput />
        </Box>
      )}
    </Box>
  );
};
```

### **EditorCanvas** - Fabric.js Integration

**Features:**
- **Imperative API**: forwardRef for parent control
- **Image loading**: Automatic scaling and centering
- **Drawing tools**: Shapes, freehand, text
- **Export functionality**: Download as various formats

```tsx
const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
  ({ image, isLoading }, ref) => {
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

      return () => canvas.dispose();
    }, []);

    // Load image when changed
    useEffect(() => {
      if (!fabricCanvasRef.current || !image?.imageUrl) return;

      fabric.Image.fromURL(image.imageUrl, (img) => {
        const canvas = fabricCanvasRef.current!;
        
        // Scale to fit
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );
        
        img.scale(scale);
        img.center();
        
        canvas.clear();
        canvas.add(img);
        canvas.renderAll();
      });
    }, [image]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      addRectangle: () => {
        const rect = new fabric.Rect({
          left: 100, top: 100,
          width: 100, height: 100,
          fill: 'rgba(255, 0, 0, 0.5)',
        });
        fabricCanvasRef.current?.add(rect);
      },
      
      downloadCanvas: (options = {}) => {
        return fabricCanvasRef.current?.toDataURL({
          format: options.format || 'png',
          quality: options.quality || 0.8,
        }) || '';
      },
      
      clearCanvas: () => {
        fabricCanvasRef.current?.clear();
      },
    }));

    return (
      <Box position="relative">
        {isLoading && <CanvasLoader />}
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            opacity: isLoading ? 0.5 : 1,
          }}
        />
      </Box>
    );
  }
);
```

### **EditorMultiImages** - Batch Processing View

**Features:**
- **Grid layout**: Responsive image grid
- **State visualization**: Different states for each image
- **Auto-scrolling**: Highlights new/changed images
- **Action overlays**: Context actions for each image

```tsx
const EditorMultiImages: React.FC<EditorMultiImagesProps> = ({
  aspectRatio = "1/1",
}) => {
  const { 
    sortedFileExplorerImages,
    referenceImage,
    confirmImages 
  } = usePhotoStudio();

  // Filter images in processing states
  const allProcessingImages = sortedFileExplorerImages.filter(image =>
    ["processing", "confirm", "selected", "deleting", "uploaded"].includes(
      image.imageState || ""
    )
  );

  const isMulti = allProcessingImages.length > 1;

  // Auto-scroll to highlighted image
  const highlightImageId = useImageHighlighting(allProcessingImages);
  const highlightRef = useAutoScroll(highlightImageId);

  return (
    <Box direction="vertical" gap="SP4" width="100%">
      <Box
        direction="horizontal"
        gap="SP5"
        width="100%"
        flexWrap="wrap"
        align="center"
        verticalAlign="top"
        paddingTop="SP4"
        paddingBottom={referenceImage || confirmImages ? "160px" : "100px"}
      >
        {allProcessingImages.map((image, idx) => (
          <Box
            key={image.id || idx}
            ref={image.id === highlightImageId ? highlightRef : undefined}
          >
            <ImagePreviewer
              image={image}
              isSingleImage={!isMulti}
              aspectRatio={aspectRatio.split(":").join("/")}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
```

### **ImagePreviewer** - Individual Processing Image

**States Handled:**
- `processing`: Shows loader with blur effect
- `deleting`: Shows loader with grayscale
- `confirm`: Shows action buttons
- `selected`: Shows selection indicator
- `uploaded`: Shows upload indicator
- `error`: Shows retry button

```tsx
const ImagePreviewer: React.FC<ImagePreviewerProps> = ({
  image,
  isSingleImage = true,
  aspectRatio = "1/1",
  errorMessage = "Unable to generate image.",
}) => {
  const { showImageDetails, deleteFileExplorerImage } = usePhotoStudio();
  
  const state = image?.imageState || "confirm";
  const imgSrc = image?.imageUrl;

  // Dynamic styling based on state
  const imgStyle = useMemo(() => {
    let style: React.CSSProperties = { aspectRatio };
    
    switch (state) {
      case "processing":
        style.filter = "blur(8px) grayscale(0.2)";
        break;
      case "deleting":
        style.filter = "blur(2px) grayscale(1)";
        break;
      case "error":
        style.filter = "grayscale(1)";
        break;
    }
    
    return style;
  }, [aspectRatio, state]);

  return (
    <Box
      width={isSingleImage ? "auto" : "25vw"}
      minWidth="25vw"
      minHeight="30vh"
      position="relative"
      direction="vertical"
      gap="SP1"
      align="center"
    >
      {/* State-specific rendering */}
      {state === "error" && (
        <ErrorDisplay message={errorMessage} onRetry={() => {}} />
      )}
      
      {state === "processing" && (
        <ProcessingDisplay image={imgSrc} style={imgStyle} />
      )}
      
      {state === "confirm" && imgSrc && (
        <>
          <ConfirmDisplay image={imgSrc} style={imgStyle} />
          <EditorPhotoActions mode="processing" imageObject={image} />
        </>
      )}
      
      {state === "selected" && (
        <SelectedDisplay image={imgSrc} style={imgStyle} />
      )}
      
      {state === "uploaded" && (
        <UploadedDisplay 
          image={imgSrc} 
          style={imgStyle}
          onDelete={() => deleteFileExplorerImage(image.id)}
        />
      )}
    </Box>
  );
};
```

## Prompt Input Component

### **EditorPromptInput** - AI Controls

**Structure:**
```
EditorPromptInput
├── Mode Selector (Enhance/Edit)
├── Prompt Text Area
├── Quality Tags Selector
├── Background Options
├── Output Settings
│   ├── Aspect Ratio
│   ├── Batch Size
│   └── Auto Upscaling
└── Generate Button
```

**Features:**
- **Mode switching**: Enhance vs Edit modes
- **Real-time validation**: Input constraints
- **Setting persistence**: Remembers user preferences
- **Credit checking**: Validates sufficient credits

## Overlay Modals

### **Modal Stack Pattern**

All overlay modals use the same stacking pattern:

```tsx
const ModalImageDetails: React.FC = () => {
  const { 
    editorSettings: { isModalImageDetailsOpen, selectedImageDetails },
    setEditorSettings 
  } = usePhotoStudio();

  const closeModal = () => {
    setEditorSettings(prev => ({
      ...prev,
      isModalImageDetailsOpen: false,
      selectedImageDetails: null,
    }));
  };

  if (!isModalImageDetailsOpen || !selectedImageDetails) return null;

  return (
    <Modal
      isOpen={isModalImageDetailsOpen}
      onRequestClose={closeModal}
      zIndex={1000} // Higher than main modal
    >
      <ModalContent image={selectedImageDetails} onClose={closeModal} />
    </Modal>
  );
};
```

## Performance Patterns

### **Memoization Strategy**
```tsx
// Memoize expensive computations
const filteredImages = useMemo(() =>
  images.filter(img => img.imageState !== "uploaded"),
  [images]
);

// Memoize event handlers
const handleImageSelect = useCallback(
  (image: GeneratedImagePreview) => {
    selectExplorerImageForEditing(image.id);
  },
  [selectExplorerImageForEditing]
);

// Memoize component renders
const ImageThumbnail = React.memo<ImageThumbnailProps>(({ image, selected }) => {
  return <Thumbnail image={image} selected={selected} />;
});
```

### **Conditional Rendering**
```tsx
// Efficient conditional rendering
{showCanvas && <EditorCanvas />}
{showMultiStack && <EditorMultiImages />}
{showUploadZone && <FileUploadZone />}

// Avoid creating components unnecessarily
{isLoading ? <Loader /> : <MainContent />}
```

### **Event Delegation**
```tsx
// Use event delegation for large lists
const handleImageGridClick = useCallback((event: React.MouseEvent) => {
  const imageId = event.target.closest('[data-image-id]')?.getAttribute('data-image-id');
  if (imageId) {
    selectImage(imageId);
  }
}, [selectImage]);

return (
  <div onClick={handleImageGridClick}>
    {images.map(image => (
      <div key={image.id} data-image-id={image.id}>
        <img src={image.url} />
      </div>
    ))}
  </div>
);
```

This component structure provides a scalable, maintainable architecture for complex modal-based editing interfaces.
