"use client";

import { Product } from "@/app/_types/product";
import { ProductCardWithActions } from "./ProductCardWithActions";

interface ProductGridWithActionsProps {
  products: Product[];
  formatCurrency: (value: number) => string;
  navigateToProductDetails: (id: string) => void;
  onRefresh: () => void;
}

export function ProductGridWithActions({
  products,
  formatCurrency,
  navigateToProductDetails,
  onRefresh,
}: ProductGridWithActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-6">
      {products.map((product) => (
        <ProductCardWithActions
          key={product._id}
          product={product}
          formatCurrency={formatCurrency}
          navigateToProductDetails={navigateToProductDetails}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
} 