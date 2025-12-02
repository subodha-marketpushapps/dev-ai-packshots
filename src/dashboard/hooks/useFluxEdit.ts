import { useMutation, useQueryClient } from "@tanstack/react-query";
import ApiClient from "../utils/api-client";
import {
  FluxImageEditorRequest,
  FluxImageEditorResponse,
} from "../../interfaces";
import { APP_ENDPOINTS } from "../../constants";

export const QUERY_FLUX_EDIT = "queryFluxEdit";
export const MUTATE_FLUX_EDIT = "mutateFluxEdit";

export const useFluxEdit = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    FluxImageEditorResponse,
    unknown,
    FluxImageEditorRequest
  >({
    mutationKey: [MUTATE_FLUX_EDIT],
    mutationFn: async (request) => {
      const formData = new FormData();

      if (request.productId) {
        formData.append("productId", request.productId);
      }

      if (request.variantId) {
        formData.append("variantId", request.variantId);
      }

      if (request.parentTaskId) {
        formData.append("parentTaskId", request.parentTaskId);
      }

      if (request.image) {
        formData.append("image", request.image);
      }

      if (request.imageUrl) {
        formData.append("imageUrl", request.imageUrl);
      }

      formData.append("task", request.task);

      if (request.prompt) {
        formData.append("prompt", request.prompt);
      }

      if (request.seed) {
        formData.append("seed", request.seed);
      }

      if (request.outputFormat) {
        formData.append("outputFormat", request.outputFormat);
      }

      return await ApiClient.request<FluxImageEditorResponse>({
        url: APP_ENDPOINTS.FLUX_EDIT_DEV,
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        errorMessage: "Failed to edit image with Flux",
        secured: true,
        includeBaseUrl: false,
        options: {
          retries: 2,
          abortController: new AbortController(),
        },
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_FLUX_EDIT], data);
    },
  });

  return mutation;
};
