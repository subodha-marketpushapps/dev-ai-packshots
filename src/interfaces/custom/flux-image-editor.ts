export type FluxTaskType =
  | "remove-bg"
  | "change-item-color"
  | "change-bg-color"
  | "change-bg"
  | "enhance-image"
  | "change-context";
export type OutputFormat = "jpeg" | "png";
export type FeedbackType = "GOOD" | "BAD" | "NOT_SURE";
export type GenerationStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "IN_PROGRESS"
  | "PARTIALLY_COMPLETED";

export interface FluxImageEditorRequest {
  /**
   * ID of the product to assign
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  productId?: string;

  /**
   * ID of the variant associated with the generated image
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  variantId?: string;

  /**
   * ID of the parent image if this is a child image
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  parentTaskId?: string;

  /**
   * Binary image file
   */
  image?: File;

  /**
   * The URL of the image to render
   * @example "https://example.com/image.png"
   */
  imageUrl?: string;

  /**
   * The type of generative task to perform
   * @example "remove-bg"
   */
  task: FluxTaskType;

  /**
   * Prompt for the image generation
   * @example "A beautiful sunset over the mountains"
   */
  prompt?: string;

  /**
   * Seed for the image generation
   * @example "1234567890"
   */
  seed?: string;

  /**
   * Output format of the image
   * @example "jpeg"
   */
  outputFormat?: OutputFormat;

  /**
   * Quality tags for the image generation
   * @example ["clarity", "sharpness"]
   */
  qualityTags?: string[];

  /**
   * Background type for the image generation
   * @example "original"
   */
  background?: "original" | "color" | "ai";

  /**
   * Positioning for the image generation
   * @example "original"
   */
  position?: "original" | "ai";
}

export interface FluxImageEditorResponse {
  createdAt: number;
  updatedAt: number;
  id: string;
  parentTaskId: string | null;
  instanceId: string;
  enhancedPrompt?: string | null;
  generationStatus: GenerationStatus;
  imageStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";
  productId: string | null;
  variantId: string | null;
  aiProvider: "photoroom" | "flux-pro" | "flux-max";
  task: FluxTaskType;
  inputImageUrl?: string | null;
  queueUrl: string;
  imageUrl?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  error?: string | null;
  options?: string;
  seed?: string | number | null;
  feedback?: FeedbackType;
  comments?: string;
  creditsUsed?: number;
}
