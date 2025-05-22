import { Product } from "@/app/_types/product";
import { ProductCard } from "./ProductCard";

interface ProductGridViewProps {
  products: Product[];
  formatCurrency: (value: number) => string;
  navigateToProductDetails: (id: string) => void;
  navigateToEditProduct: (id: string) => void;
}

export function ProductGridView({
  products,
  formatCurrency,
  navigateToProductDetails,
  navigateToEditProduct,
}: ProductGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard 
          key={product._id} 
          product={product}
          formatCurrency={formatCurrency}
          navigateToProductDetails={navigateToProductDetails}
          navigateToEditProduct={navigateToEditProduct}
        />
      ))}
    </div>
  );
}