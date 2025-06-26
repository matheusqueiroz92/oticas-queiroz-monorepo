import { Button } from "@/components/ui/button";
import { Product } from "@/app/_types/product";
import { PaginationItems } from "@/components/PaginationItems";
import { ProductEmptyState } from "./ProductEmptyState";
import { ProductGridWithActions } from "./ProductGridWithActions";
import { ProductTableWithActions } from "./ProductTableWithActions";
import { LayoutGrid, Table } from "lucide-react";

interface ProductsListWithDialogProps {
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
  formatCurrency: (value: number) => string;
  onRefresh: () => void;
}

export function ProductsListWithDialog({
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
  formatCurrency,
  onRefresh,
}: ProductsListWithDialogProps) {
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
    <div className="space-y-4">
      {/* Seletor de visualização - movido para o canto direito */}
      <div className="flex items-center justify-end m-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            {filteredProducts.length} produtos encontrados
          </span>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <Table className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Lista de produtos */}
      {filteredProducts.length === 0 ? (
        <ProductEmptyState clearFilters={clearFilters} />
      ) : (
        viewMode === "grid" ? (
          <ProductGridWithActions 
            products={filteredProducts}
            formatCurrency={formatCurrency}
            navigateToProductDetails={navigateToProductDetails}
            onRefresh={onRefresh}
          />
        ) : (
          <ProductTableWithActions 
            products={filteredProducts}
            formatCurrency={formatCurrency}
            navigateToProductDetails={navigateToProductDetails}
            onRefresh={onRefresh}
          />
        )
      )}

      {/* Paginação */}
      {filteredProducts.length > 0 && (
        <PaginationItems
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalProducts}
          pageSize={products.length}
        />
      )}
    </div>
  );
} 