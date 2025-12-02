import { useCallback } from "react";
import ApiClient from "../../../utils/api-client";
import { APP_ENDPOINTS } from "../../../../constants";
import {
  FluxImageEditorRequest,
  FluxImageEditorResponse,
} from "../../../../interfaces";

export const useFluxEditApi = () => {
  const mutate = useCallback(async (requestBody: FluxImageEditorRequest) => {
    const formData = new FormData();

    // Manually append all fields to FormData for ApiClient
    if (requestBody.productId)
      formData.append("productId", requestBody.productId);
    if (requestBody.variantId)
      formData.append("variantId", requestBody.variantId);
    if (requestBody.parentTaskId)
      formData.append("parentTaskId", requestBody.parentTaskId);
    if (requestBody.image) formData.append("image", requestBody.image);
    if (requestBody.imageUrl) formData.append("imageUrl", requestBody.imageUrl);
    formData.append("task", requestBody.task);
    if (requestBody.prompt) formData.append("prompt", requestBody.prompt);
    if (requestBody.seed) formData.append("seed", requestBody.seed);
    if (requestBody.outputFormat)
      formData.append("outputFormat", requestBody.outputFormat);
    if (requestBody.qualityTags && requestBody.qualityTags.length > 0)
      formData.append("qualityTags", JSON.stringify(requestBody.qualityTags));
    if (requestBody.background)
      formData.append("background", requestBody.background);
    if (requestBody.position) formData.append("position", requestBody.position);

    const response = await ApiClient.request<FluxImageEditorResponse>({
      url: APP_ENDPOINTS.FLUX_EDIT_DEV,
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      errorMessage: `Failed to edit image with Flux`,
      secured: true,
      includeBaseUrl: false,
      options: {
        retries: 2,
        abortController: new AbortController(),
      },
    });

    return response;
  }, []);

  return { mutate };
};

export const useFluxEnhanceApi = () => {
  const mutate = useCallback(async (requestBody: FluxImageEditorRequest) => {
    const formData = new FormData();

    // Manually append all fields to FormData for ApiClient
    if (requestBody.productId)
      formData.append("productId", requestBody.productId);
    if (requestBody.variantId)
      formData.append("variantId", requestBody.variantId);
    if (requestBody.parentTaskId)
      formData.append("parentTaskId", requestBody.parentTaskId);
    if (requestBody.image) formData.append("image", requestBody.image);
    if (requestBody.imageUrl) formData.append("imageUrl", requestBody.imageUrl);
    formData.append("task", requestBody.task);
    if (requestBody.prompt) formData.append("prompt", requestBody.prompt);
    if (requestBody.seed) formData.append("seed", requestBody.seed);
    if (requestBody.outputFormat)
      formData.append("outputFormat", requestBody.outputFormat);
    if (requestBody.qualityTags && requestBody.qualityTags.length > 0)
      formData.append("qualityTags", JSON.stringify(requestBody.qualityTags));
    if (requestBody.background)
      formData.append("background", requestBody.background);
    if (requestBody.position) formData.append("position", requestBody.position);

    const response = await ApiClient.request<FluxImageEditorResponse>({
      url: APP_ENDPOINTS.FLUX_EDIT,
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      errorMessage: `Failed to enhance image with Flux`,
      secured: true,
      includeBaseUrl: false,
      options: {
        retries: 2,
        abortController: new AbortController(),
      },
    });

    return response;
  }, []);

  return { mutate };
};
