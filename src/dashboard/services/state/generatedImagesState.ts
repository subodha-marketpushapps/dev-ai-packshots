import { atom } from "recoil";

export interface GeneratedImageState {
  id: string; // Unique ID for each generated image
  imageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  prompt: string | null; // Store the prompt for reference
}

export const generatedImagesState = atom<GeneratedImageState[]>({
  key: "generatedImagesState",
  default: [],
});
