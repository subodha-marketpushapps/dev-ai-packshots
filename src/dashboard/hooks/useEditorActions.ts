import { useCallback, useMemo } from "react";
import { useRecoilState, useRecoilCallback, useRecoilValue } from "recoil";
import {
  editingImageState,
  editorSettingsState,
  imageHistoryState,
  processingImagesState,
  referenceImageState,
  selectedImagesState,
  sortedFileExplorerImagesState,
  confirmImagesState,
} from "../services/state/editorState";
import {
  GeneratedImagePreview,
  ImageDetailsMode,
  Layer,
  ProcessState,
} from "../../interfaces";

const MAX_HISTORY_SIZE = 50;

export const useEditorActions = () => {
  const [editingImage, setEditingImage] = useRecoilState(editingImageState);
  const [editorSettings, setEditorSettings] =
    useRecoilState(editorSettingsState);
  const [history, setHistory] = useRecoilState(imageHistoryState);

  const sortedFileExplorerImages = useRecoilValue(
    sortedFileExplorerImagesState
  );
  const processingImages = useRecoilValue(processingImagesState);
  const referenceImage = useRecoilValue(referenceImageState);
  const selectedImages = useRecoilValue(selectedImagesState);
  const confirmImages = useRecoilValue(confirmImagesState);

  const { fileExplorerImages, selectedImageId } = editorSettings;

  // Memoize undo/redo state to prevent unnecessary recalculations
  const { canUndo, canRedo } = useMemo(
    () => ({
      canUndo: history.currentIndex > 0,
      canRedo: history.currentIndex < history.states.length - 1,
    }),
    [history.currentIndex, history.states.length]
  );

  // Update the current editing image (layer)
  const updateLayerState = useCallback(
    (updates: Partial<Layer>) => {
      setEditingImage((prev) => (prev ? { ...prev, ...updates } : prev));
    },
    [setEditingImage]
  );

  // Update an image in the explorer
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
              ? img.imageState !== ("uploaded" as ProcessState)
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
        selectedImageId: resetId ? "" : prev.selectedImageId, // Reset selected image ID
      }));
    },
    [setEditorSettings, referenceImage]
  );

  // Add a new image to the explorer
  const addFileExplorerImage = useCallback(
    (newImage: GeneratedImagePreview, resetId: boolean = true) => {
      setEditorSettings((prev) => ({
        ...prev,
        fileExplorerImages: [newImage, ...prev.fileExplorerImages],
        selectedImageId: resetId ? "" : prev.selectedImageId, // Reset selected image ID
      }));
    },
    [setEditorSettings]
  );

  // Delete an image from the explorer
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

  // Mark reference image for Copy edits
  const markGeneratedImageForCopyEdit = useRecoilCallback(
    ({ snapshot, set }) =>
      (imageId: string) => {
        const editorSettings =
          snapshot.getLoadable(editorSettingsState).contents;
        const fileExplorerImages = editorSettings.fileExplorerImages;
        const selectedLayer = fileExplorerImages.find(
          (l: GeneratedImagePreview) => l.id === imageId
        );
        // Do not allow marking publishing images
        if (selectedLayer && selectedLayer.imageState !== "publishing") {
          set(editingImageState, null); // Clear current editing image
          set(editorSettingsState, (prev) => ({
            ...prev,
            fileExplorerImages: prev.fileExplorerImages.map((img) =>
              img.id === imageId && img.imageState !== "publishing"
                ? { ...img, imageState: "reference" as ProcessState }
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

  // Select explorer image for canvas editing and update history (always latest state)
  const selectExplorerImageForEditing = useRecoilCallback(
    ({ snapshot, set }) =>
      (
        imageId: string,
        updates?: Partial<GeneratedImagePreview>,
        filterTempImages: boolean = true
      ) => {
        const editorSettings =
          snapshot.getLoadable(editorSettingsState).contents;
        const fileExplorerImages = editorSettings.fileExplorerImages;
        const selectedLayer = fileExplorerImages.find(
          (l: GeneratedImagePreview) => l.id === imageId
        );
        // Robust: If image is publishing, do nothing and return immediately
        if (!selectedLayer || selectedLayer.imageState === "publishing") {
          return;
        }
        const prevHistory = snapshot.getLoadable(imageHistoryState).contents;
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
          set(editingImageState, newLayer);
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
          set(editorSettingsState, (prev) => ({
            ...prev,
            fileExplorerImages: prev.fileExplorerImages
              .filter(
                (img) =>
                  !(
                    filterTempImages &&
                    img.imageState === ("uploaded" as ProcessState)
                  )
              )
              .map((img) => {
                // Never change state of publishing images
                if (img.imageState === "publishing") return img;
                if (img.id === imageId) {
                  return {
                    ...img,
                    imageState: "edit" as ProcessState,
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

  // Set a new image as the editing image and update history
  const updateCanvasImage = useCallback(
    (imageObject: GeneratedImagePreview) => {
      const img = new window.Image();
      img.onload = () => {
        const newLayer: Layer = {
          file: null,
          width: img.naturalWidth,
          height: img.naturalHeight,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          productId: imageObject.productId || undefined,
          ...imageObject,
        };
        setEditingImage(newLayer);
        const newStates = [
          ...history.states.slice(0, history.currentIndex + 1),
          newLayer,
        ];
        let newIndex = history.currentIndex + 1;
        if (newStates.length > MAX_HISTORY_SIZE) {
          newStates.shift();
          newIndex--;
        }
        setHistory({
          states: newStates,
          currentIndex: newIndex,
        });
      };
      img.src = imageObject.imageUrl || "";
    },
    [setEditingImage, setHistory, history]
  );

  const showImageDetails = useCallback(
    (image: GeneratedImagePreview, mode: ImageDetailsMode) => {
      setEditorSettings((prev) => ({
        ...prev,
        isModalImageDetailsOpen: true,
        selectedImageDetails: image,
        imageDetailsMode: mode || "detailed",
      }));
    },
    [setEditorSettings]
  );

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

  return {
    sortedFileExplorerImages,
    processingImages,
    referenceImage,
    selectedImages,
    editingImage,
    editorSettings,
    setEditorSettings,
    updateLayerState,
    updateFileExplorerImage,
    markGeneratedImageForCopyEdit,
    fileExplorerImages,
    selectedImageId,
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
    confirmImages,
  };
};
