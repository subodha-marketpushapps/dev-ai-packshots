import { APP_ENDPOINTS } from "../../../constants";
import {
  GeneratedImage,
  UpdateGeneratedImageDto,
  BulkDeleteGeneratedImagesDto,
} from "../../../interfaces/custom/generated-image";
import ApiClient from "../../utils/api-client";

export const getGeneratedImages = async (
  page: number
): Promise<GeneratedImage[]> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES_VIEW_ALL(page),
    method: "GET",
    errorMessage: "Failed to fetch generated images",
    secured: true,
  });
};

export const getFilteredGeneratedImages = async (
  page: number
): Promise<GeneratedImage[]> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES_VIEW_FILTERED(page),
    method: "GET",
    errorMessage: "Failed to fetch filtered generated images",
    secured: true,
  });
};

export const getAllGeneratedImages = async (): Promise<GeneratedImage[]> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES,
    method: "GET",
    errorMessage: "Failed to fetch all generated images",
    secured: true,
  });
};

export const getGeneratedImageByTaskId = async (
  taskId: string
): Promise<GeneratedImage> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES_TASK_ID(taskId),
    method: "GET",
    errorMessage: "Failed to fetch generated image by task ID",
    secured: true,
  });
};

export const updateGeneratedImage = async (
  taskId: string,
  data: UpdateGeneratedImageDto
): Promise<GeneratedImage> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES_UPDATE(taskId),
    method: "PATCH",
    data,
    errorMessage: "Failed to update generated image",
    secured: true,
  });
};

export const getGeneratedImagesByProductId = async (
  productId: string
): Promise<GeneratedImage[]> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES_BY_PRODUCT_ID(productId),
    method: "GET",
    errorMessage: "Failed to fetch generated images by product ID",
    secured: true,
  });
};

export const getGeneratedImagesByParentId = async (
  parentTaskId: string
): Promise<GeneratedImage[]> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES_BY_PARENT_ID(parentTaskId),
    method: "GET",
    errorMessage: "Failed to fetch generated images by parent task ID",
    secured: true,
  });
};

export const bulkDeleteGeneratedImages = async (
  data: BulkDeleteGeneratedImagesDto
): Promise<void> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.GENERATED_IMAGES,
    method: "DELETE",
    data,
    errorMessage: "Failed to bulk delete generated images",
    secured: true,
  });
};
