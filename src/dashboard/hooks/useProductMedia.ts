import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AddMediaDto, ReplaceMediaDto } from "../../interfaces/custom/product-media";
import * as productsApi from "../services/api/product-media";

export const MUTATE_ADD_PRODUCT_MEDIA = "mutateAddProductMedia";
export const MUTATE_REPLACE_PRODUCT_MEDIA = "mutateReplaceProductMedia";

export const useProducts = () => {
  const queryClient = useQueryClient();

  const addProductMedia = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddMediaDto }) =>
      productsApi.addProductMedia(id, data),
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Also invalidate Wix store products query
      queryClient.invalidateQueries({ queryKey: ["queryWixStoreProducts"] });
    },
  });

  const replaceProductMedia = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReplaceMediaDto }) =>
      productsApi.replaceProductMedia(id, data),
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    addProductMedia,
    replaceProductMedia,
  };
};
