import ApiClient from "../../utils/api-client";
import { APP_CONSTANTS } from "../../../constants";

interface EnhanceBackgroundResponse {
  message: string;
  data: Record<string, any>;
  success: boolean;
  error: any;
  statusCode: number;
}

export const enhanceBackground = async (
  image: File,
  prompt?: string
): Promise<EnhanceBackgroundResponse> => {
  if (!image) {
    throw new Error("Image file is required");
  }

  const formData = new FormData();
  formData.append("image", image);
  if (prompt) {
    formData.append("prompt", prompt);
  }

  return await ApiClient.request<EnhanceBackgroundResponse>({
    url: `${APP_CONSTANTS.openAiEndpoint}/openai/enhance-background`,
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    errorMessage: "Failed to enhance background",
    secured: true,
    includeBaseUrl: false,
    options: {
      retries: 2,
      abortController: new AbortController(),
    },
  });
};
