import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GeneratedImage,
  UpdateGeneratedImageDto,
  BulkDeleteGeneratedImagesDto,
} from "../../interfaces/custom/generated-image";
import * as generatedImagesApi from "../services/api/generated-images";
import { useSetRecoilState } from "recoil";
import { generatedImagesState } from "../services/state/generatedImagesState";

export const QUERY_GENERATED_IMAGES = "queryGeneratedImages";
export const QUERY_FILTERED_GENERATED_IMAGES = "queryFilteredGeneratedImages";
export const QUERY_ALL_GENERATED_IMAGES = "queryAllGeneratedImages";
export const QUERY_GENERATED_IMAGE_BY_TASK_ID = "queryGeneratedImageByTaskId";
export const QUERY_GENERATED_IMAGES_BY_PRODUCT_ID =
  "queryGeneratedImagesByProductId";
export const QUERY_GENERATED_IMAGES_BY_PARENT_ID =
  "queryGeneratedImagesByParentId";

export const MUTATE_UPDATE_GENERATED_IMAGE = "mutateUpdateGeneratedImage";
export const MUTATE_BULK_DELETE_GENERATED_IMAGES =
  "mutateBulkDeleteGeneratedImages";

export const useGeneratedImages = () => {
  const queryClient = useQueryClient();
  const setGeneratedImages = useSetRecoilState(generatedImagesState);

  const getGeneratedImages = (page: number) => {
    return useQuery<GeneratedImage[]>({
      queryKey: [QUERY_GENERATED_IMAGES, page],
      queryFn: () => generatedImagesApi.getGeneratedImages(page),
    });
  };

  const getFilteredGeneratedImages = (page: number) => {
    return useQuery<GeneratedImage[]>({
      queryKey: [QUERY_FILTERED_GENERATED_IMAGES, page],
      queryFn: () => generatedImagesApi.getFilteredGeneratedImages(page),
    });
  };

  const getAllGeneratedImages = (options?: { enabled?: boolean }) => {
    return useQuery<GeneratedImage[]>({
      queryKey: [QUERY_ALL_GENERATED_IMAGES],
      queryFn: () => generatedImagesApi.getAllGeneratedImages(),
      enabled: options?.enabled,
      onSuccess: (data) => {
        setGeneratedImages(
          data.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl ?? null,
            isGenerating: false,
            imageStatus: img.imageStatus ?? "DRAFT",
            error: null,
            prompt: null,
          }))
        );
      },
    });
  };

  const getGeneratedImageByTaskId = (taskId: string) => {
    return useQuery<GeneratedImage>({
      queryKey: [QUERY_GENERATED_IMAGE_BY_TASK_ID, taskId],
      queryFn: () => generatedImagesApi.getGeneratedImageByTaskId(taskId),
    });
  };

  const updateGeneratedImage = useMutation<
    GeneratedImage,
    unknown,
    { taskId: string; data: UpdateGeneratedImageDto }
  >({
    mutationKey: [MUTATE_UPDATE_GENERATED_IMAGE],
    mutationFn: ({ taskId, data }) =>
      generatedImagesApi.updateGeneratedImage(taskId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(
        [QUERY_GENERATED_IMAGE_BY_TASK_ID, data.task],
        data
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_GENERATED_IMAGES] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_FILTERED_GENERATED_IMAGES],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_ALL_GENERATED_IMAGES] });
    },
  });

  const getGeneratedImagesByProductId = (
    productId: string,
    options?: { enabled?: boolean }
  ) => {
    return useQuery<GeneratedImage[]>({
      queryKey: [QUERY_GENERATED_IMAGES_BY_PRODUCT_ID, productId],
      queryFn: () =>
        generatedImagesApi.getGeneratedImagesByProductId(productId),
      enabled: options?.enabled,
    });
  };

  const getGeneratedImagesByParentId = (parentTaskId: string) => {
    return useQuery<GeneratedImage[]>({
      queryKey: [QUERY_GENERATED_IMAGES_BY_PARENT_ID, parentTaskId],
      queryFn: () =>
        generatedImagesApi.getGeneratedImagesByParentId(parentTaskId),
    });
  };

  const bulkDeleteGeneratedImages = useMutation<
    void,
    unknown,
    BulkDeleteGeneratedImagesDto
  >({
    mutationKey: [MUTATE_BULK_DELETE_GENERATED_IMAGES],
    mutationFn: (data) => generatedImagesApi.bulkDeleteGeneratedImages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_GENERATED_IMAGES] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_FILTERED_GENERATED_IMAGES],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_ALL_GENERATED_IMAGES] });
    },
  });

  return {
    getGeneratedImages,
    getFilteredGeneratedImages,
    getAllGeneratedImages,
    getGeneratedImageByTaskId,
    updateGeneratedImage,
    getGeneratedImagesByProductId,
    getGeneratedImagesByParentId,
    bulkDeleteGeneratedImages,
  };
};
