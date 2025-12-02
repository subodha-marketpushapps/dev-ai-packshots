import { GeneratedImage } from "./generated-image";

export type PromptEditingMode = "enhance" | "edit";
export type AspectRatio =
  | "original"
  | "21:9"
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "2:3"
  | "3:4"
  | "9:16"
  | "9:21";

/**
 * Represents the various states of an image during its lifecycle in the photo studio.
 *
 * - `"edit"`: The image is selected for canvas editing.
 * - `"processing"`: The image is being processed (e.g., generating, editing).
 * - `"confirm"`: Multiple images are being processed, and the user can confirm the final image.
 * - `"selected"`: The image is selected for further actions.
 * - `"reference"`: The image data is being used as a reference image.
 * - `"error"`: The image processing has failed.
 * - `"deleting"`: The image is being deleted.
 */
export type ProcessState =
  | "edit"
  | "processing"
  | "publishing"
  | "confirm"
  | "selected"
  | "reference"
  | "error"
  | "deleting"
  | "uploaded"
  | "none";

/**
 * Represents a preview of a generated image with a subset of properties from the `GeneratedImage` interface.
 * This interface extends `GeneratedImage` while omitting several properties and adding optional fields specific to the preview context.
 *
 * @extends Omit<GeneratedImage, "createdAt" | "updatedAt" | "inputImageUrl" | "generationStatus" | "instanceId" | "aiProvider" | "task" | "startedAt" | "finishedAt" | "queueUrl" | "options" | "error" | "creditsUsed" | "seed">
 *
 * @property {number} [createdAt] - The timestamp indicating when the image preview was created. Optional.
 * @property {string | number | null} [seed] - The seed value used for generating the image. Can be a string, number, or null. Optional.
 * @property {ProcessState} [imageState] - The current state of the image processing. Optional.
 * @property {boolean} [isLiveImage] - Indicates whether the image is a live image/Published for the product. Optional.
 */
export interface GeneratedImagePreview
  extends Omit<
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
  createdAt?: number;
  seed?: string | number | null;
  imageState?: ProcessState;
  isLiveImage?: boolean;
  customPrompt?: string;
  /**
   * Explicit order for live images in explorer. Only set for isLiveImage=true.
   */
  order?: number;
}

export type ImageDetailsMode = "detailed" | "fullscreen" | "compare";

export interface EditorSettings {
  activePromptToolbar: boolean;
  isFileExplorerOpen?: boolean;
  fileExplorerImages: GeneratedImagePreview[];
  selectedImageId: string | null;
  isModalImageDetailsOpen?: boolean;
  selectedImageDetails?: GeneratedImagePreview | null;
  imageDetailsMode?: ImageDetailsMode;
}

export interface Layer extends GeneratedImagePreview {
  file: File | null;
  imageUrl: string | null;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface ImageHistoryState {
  states: Layer[];
  currentIndex: number;
}

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

export interface PromptSettings {
  prompt: string;
  qualityTags: string[];
  background: "original" | "color" | "ai";
  position: "original" | "ai";
}

export interface OutputSettings {
  aspectRatio: AspectRatio;
  editingMode: PromptEditingMode;
  autoUpscaling: boolean;
  batchSize: number;
}
