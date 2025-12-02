import { GeneratedImage } from "../../../../../interfaces";
import { products } from "@wix/stores";
import { NormalizedProduct } from "../../../../utils/catalogNormalizer";

export interface TableRawData extends NormalizedProduct {
  name: string;
  sku: string;
  formattedPrice: string;
  image: string;
  isSelected?: boolean;
  generatedImages?: GeneratedImage[];
}

export interface SortOption {
  fieldName: string;
  order: "desc" | "asc";
}
