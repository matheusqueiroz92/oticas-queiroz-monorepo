"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";
import { PageTitle } from "@/components/PageTitle";
import { ProductsList } from "@/components/Products/ProductsList";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productType, setProductType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  const {
    products,
    loading,
    error,
    totalPages,
    totalProducts,
    currentPage,
    updateFilters,
    setCurrentPage,
    navigateToProductDetails,
    navigateToCreateProduct,
    navigateToEditProduct,
    formatCurrency,
  } = useProducts();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleProductTypeChange = (value: string) => {
    setProductType(value);
    updateFilters({ 
      productType: value !== "all" ? value as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame" : undefined 
    });
  };

  const clearFilters = () => {
    setProductType("all");
    setStockFilter("all");
    setSearchTerm("");
    updateFilters({});
  };

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Produtos"
        description="Gerenciamento de produtos da loja"
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ProductsList 
          products={products}
          isLoading={loading}
          error={error}
          searchTerm={searchTerm}
          productType={productType}
          stockFilter={stockFilter}
          viewMode={viewMode}
          currentPage={currentPage}
          totalPages={totalPages}
          totalProducts={totalProducts}
          setCurrentPage={setCurrentPage}
          setSearchTerm={setSearchTerm}
          setProductType={setProductType}
          setStockFilter={setStockFilter}
          setViewMode={setViewMode}
          onSearch={handleSearch}
          onProductTypeChange={handleProductTypeChange}
          clearFilters={clearFilters}
          navigateToProductDetails={navigateToProductDetails}
          navigateToCreateProduct={navigateToCreateProduct}
          navigateToEditProduct={navigateToEditProduct}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}