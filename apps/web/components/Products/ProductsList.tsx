import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Product } from "@/app/_types/product";
import { PaginationItems } from "@/components/PaginationItems";
import { ProductFilters } from "./ProductFilters";
import { ProductGridView } from "./ProductGridView";
import { ProductTableView } from "./ProductTableView";
import { ProductEmptyState } from "./ProductEmptyState";

interface ProductsListProps {
  products: Product[];
  isLoading: boolean;
  error: any;
  searchTerm: string;
  productType: string;
  stockFilter: "all" | "low" | "out";
  viewMode: "grid" | "table";
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  setCurrentPage: (page: number) => void;
  setSearchTerm: (value: string) => void;
  setProductType: (value: string) => void;
  setStockFilter: (value: "all" | "low" | "out") => void;
  setViewMode: (value: "grid" | "table") => void;
  onSearch: (e: React.FormEvent) => void;
  onProductTypeChange: (value: string) => void;
  clearFilters: () => void;
  navigateToProductDetails: (id: string) => void;
  navigateToCreateProduct: () => void;
  navigateToEditProduct: (id: string) => void;
  formatCurrency: (value: number) => string;
}

export function ProductsList({
  products,
  isLoading,
  error,
  searchTerm,
  productType,
  stockFilter,
  viewMode,
  currentPage,
  totalPages,
  totalProducts,
  setCurrentPage,
  setSearchTerm,
  setProductType,
  setStockFilter,
  setViewMode,
  onSearch,
  onProductTypeChange,
  clearFilters,
  navigateToProductDetails,
  navigateToCreateProduct,
  navigateToEditProduct,
  formatCurrency,
}: ProductsListProps) {
  // Filtrar produtos com base no estoque
  const filteredProducts = products.filter(product => {
    // Se não for um produto com estoque e o filtro não for "all", não mostrar
    if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
      return stockFilter === "all";
    }
    
    // Obter o valor do estoque
    const stock = (product as any).stock || 0;
    
    // Aplicar o filtro específico
    switch (stockFilter) {
      case "low":
        return stock > 0 && stock <= 5;
      case "out":
        return stock === 0;
      case "all":
      default:
        return true;
    }
  });

  return (
    <Card>
      <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">Lista de Produtos</CardTitle>
        <Button onClick={navigateToCreateProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-6">
          <ProductFilters
            searchTerm={searchTerm}
            productType={productType}
            stockFilter={stockFilter}
            viewMode={viewMode}
            setSearchTerm={setSearchTerm}
            setProductType={setProductType}
            setStockFilter={setStockFilter}
            setViewMode={setViewMode}
            onSearch={onSearch}
            onProductTypeChange={onProductTypeChange}
            clearFilters={clearFilters}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-md mt-4">
            {error.message || "Ocorreu um erro ao carregar os produtos."}
          </div>
        ) : filteredProducts.length === 0 ? (
          <ProductEmptyState clearFilters={clearFilters} />
        ) : (
          viewMode === "grid" ? (
            <ProductGridView 
              products={filteredProducts}
              formatCurrency={formatCurrency}
              navigateToProductDetails={navigateToProductDetails}
              navigateToEditProduct={navigateToEditProduct}
            />
          ) : (
            <ProductTableView 
              products={filteredProducts}
              formatCurrency={formatCurrency}
              navigateToProductDetails={navigateToProductDetails}
              navigateToEditProduct={navigateToEditProduct}
            />
          )
        )}

        {!isLoading && filteredProducts.length > 0 && (
          <PaginationItems
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={totalProducts}
            pageSize={products.length}
          />
        )}
      </CardContent>
    </Card>
  );
}