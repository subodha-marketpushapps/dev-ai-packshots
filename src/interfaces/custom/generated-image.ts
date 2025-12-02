export interface GeneratedImage {
  createdAt: number;
  updatedAt: number;
  id: string;
  parentTaskId: string | null;
  instanceId: string;
  generationStatus?:
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "PARTIALLY_COMPLETED"
    | "FAILED";
  imageStatus?: "PENDING" | "DRAFT" | "PUBLISHED" | "FAILED" | "ARCHIVED" | "DELETED";
  enhancedPrompt?: string;
  productId?: string | null;
  variantId?: string | null;
  aiProvider: "photoroom" | "flux-pro" | "flux-max";
  task: "remove-bg" | "change-item-color" | "change-bg-color" | "change-bg";
  inputImageUrl?: string | null;
  queueUrl: string;
  imageUrl: string | null;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  options: string;
  seed: string | number | null;
  feedback?: "GOOD" | "BAD" | "NOT_SURE";
  comments?: string;
  creditsUsed: number;
  qualityTags?: string[];
  background?: "original" | "color" | "ai";
  position?: "original" | "ai";
  thumbnails?: {
    thumbnail60?: string;
    thumbnail100?: string;
  };
}

export interface UpdateGeneratedImageDto {
  feedback?: "GOOD" | "BAD" | "NOT_SURE";
  comments?: string;
}

export interface BulkDeleteGeneratedImagesDto {
  ids: string[];
}
