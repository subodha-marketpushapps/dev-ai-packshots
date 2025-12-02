import React from "react";
import { Image } from "@wix/design-system";
import { extractImageUrl } from "../../../utils";
import { NormalizedProduct } from "../../../utils/catalogNormalizer";

interface CellProductNameProps {
  product: NormalizedProduct;
  size?: number | string;
  src?: string;
}

const CellWixProductImage: React.FC<CellProductNameProps> = ({
  product,
  size = "56px",
  src,
}) => {
  return (
    <Image src={src ?? extractImageUrl(product)} width={size} height={size} />
  );
};

export default CellWixProductImage;
