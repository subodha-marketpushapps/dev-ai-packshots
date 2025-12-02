import { products, productsV3 } from "@wix/stores";
import { APP_ENDPOINTS } from "../../../constants";
import { AddMediaDto, ReplaceMediaDto } from "../../../interfaces";
import ApiClient from "../../utils/api-client";

export const addProductMedia = async (
  id: string,
  data: AddMediaDto
): Promise<products.Product | productsV3.V3Product> => {
  return (await ApiClient.request({
    url: APP_ENDPOINTS.PRODUCTS_ADD_MEDIA(id),
    method: "PATCH",
    data,
    errorMessage: "Failed to add product media",
    secured: true,
  })) as products.Product | productsV3.V3Product;
};

export const replaceProductMedia = async (
  id: string,
  data: ReplaceMediaDto
): Promise<void> => {
  await ApiClient.request({
    url: APP_ENDPOINTS.PRODUCTS_REPLACE_MEDIA(id),
    method: "PATCH",
    data,
    errorMessage: "Failed to replace product media",
    secured: true,
  });
};
