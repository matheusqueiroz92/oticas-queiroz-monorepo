import { Loader2, Package } from "lucide-react";
import { ProductsListWithDialog } from "@/components/products/ProductsListWithDialog";
import { ProductActions } from "@/components/products/ProductActions";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";

interface ProductsContentProps {
  products: any[];
  isLoading: boolean;
  error: any;
  searchTerm: string;
  productType: string;
  stockFilter: "all" | "low" | "out";
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  showEmptyState: boolean;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  setCurrentPage: (page: number) => void;
  navigateToProductDetails: (productId: string) => void;
  formatCurrency: (value: number) => string;
  onRefresh: () => void;
  onClearFilters: () => void;
  onNewProduct?: () => void;
}

export function ProductsContent({
  products,
  isLoading,
  error,
  searchTerm,
  productType,
  stockFilter,
  viewMode,
  onViewModeChange,
  showEmptyState,
  currentPage,
  totalPages,
  totalProducts,
  setCurrentPage,
  navigateToProductDetails,
  formatCurrency,
  onRefresh,
  onClearFilters,
}: ProductsContentProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert message={error.message || "Ocorreu um erro ao carregar os produtos."} />
      </div>
    );
  }

  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Nenhum produto cadastrado</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          {searchTerm || productType !== "all" || stockFilter !== "all" 
            ? "Tente ajustar os filtros de busca." 
            : "Clique em 'Novo Produto' para adicionar um produto ao sistema."
          }
        </p>
        <div className="flex gap-2">
          {(searchTerm || productType !== "all" || stockFilter !== "all") && (
            <Button 
              variant="outline" 
              onClick={onClearFilters}
            >
              Limpar Filtros
            </Button>
          )}
          <ProductActions onRefresh={onRefresh} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header apenas para os botões de alternância, sem texto de quantidade */}
      <div className="flex justify-between items-center px-6 border-b">
        <div className="flex-1 flex items-center"></div>
        <div className="flex items-center gap-2"></div>
      </div>
      <ProductsListWithDialog 
      products={products}
      isLoading={isLoading}
      error={error}
      searchTerm={searchTerm}
      productType={productType}
      stockFilter={stockFilter}
      viewMode={viewMode}
      currentPage={currentPage}
      totalPages={totalPages}
      totalProducts={totalProducts}
      setCurrentPage={setCurrentPage}
      setSearchTerm={() => {}}
      setProductType={() => {}}
      setStockFilter={() => {}}
      setViewMode={onViewModeChange}
      onSearch={() => {}}
      onProductTypeChange={() => {}}
      clearFilters={onClearFilters}
      navigateToProductDetails={navigateToProductDetails}
      formatCurrency={formatCurrency}
      onRefresh={onRefresh}
    />
    </div>
  );
} 