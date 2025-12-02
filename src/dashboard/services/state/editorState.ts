import { atom, selector } from "recoil";
import {
  EditorSettings,
  ImageHistoryState,
  Layer,
  GeneratedImagePreview,
} from "../../../interfaces";

export const editorSettingsState = atom<EditorSettings>({
  key: "editorSettingsState",
  default: {
    activePromptToolbar: false,
    isFileExplorerOpen: true,
    fileExplorerImages: [],
    selectedImageId: null,
    isModalImageDetailsOpen: false,
    selectedImageDetails: null,
    imageDetailsMode: "detailed",
  },
});

export const editingImageState = atom<Layer | null>({
  key: "editingImageState",
  default: null,
});

export const imageHistoryState = atom<ImageHistoryState>({
  key: "imageHistoryState",
  default: {
    states: [],
    currentIndex: 0,
  },
});

export const sortedFileExplorerImagesState = selector<GeneratedImagePreview[]>({
  key: "sortedFileExplorerImagesState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return [...(editorSettings.fileExplorerImages || [])].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  },
});

export const processingImagesState = selector<GeneratedImagePreview[]>({
  key: "processingImagesState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (editorSettings.fileExplorerImages || []).filter(
      (image) => image.imageState === "processing"
    );
  },
});

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

export const confirmImagesState = selector<GeneratedImagePreview[]>({
  key: "confirmImagesState",
  get: ({ get }) => {
    const editorSettings = get(editorSettingsState);
    return (editorSettings.fileExplorerImages || []).filter(
      (image) => image.imageState === "confirm"
    );
  },
});

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
