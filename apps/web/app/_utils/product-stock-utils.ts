import type { Product } from "@/app/_types/product";

const FRAME_TYPES = ["prescription_frame", "sunglasses_frame"] as const;

/**
 * Conta armações com estoque baixo (1 a 5 unidades), alinhado a useProductsStats.
 */
export function countLowStockFrames(products: Product[]): number {
  return products.filter((product) => {
    if (
      product.productType !== "prescription_frame" &&
      product.productType !== "sunglasses_frame"
    ) {
      return false;
    }
    const stock = product.stock ?? 0;
    return stock > 0 && stock <= 5;
  }).length;
}

export { FRAME_TYPES };
