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
  // isLoading,
  // error,
  // searchTerm,
  // productType,
  // stockFilter,
  viewMode,
  currentPage,
  totalPages,
  totalProducts,
  setCurrentPage,
  // setSearchTerm,
  // setProductType,
  // setStockFilter,
  setViewMode,
  // onSearch,
  // onProductTypeChange,
  clearFilters,
  navigateToProductDetails,
  formatCurrency,
  onRefresh,
}: ProductsListWithDialogProps) {
  // Filtrar produtos com base no estoque
  
  // const filteredProducts = products.filter(product => {
  //   // Se não for um produto com estoque e o filtro não for "all", não mostrar
  //   if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
  //     return stockFilter === "all";
  //   }
    
  //   // Obter o valor do estoque
  //   const stock = (product as any).stock || 0;
    
  //   // Aplicar o filtro específico
  //   switch (stockFilter) {
  //     case "low":
  //       return stock > 0 && stock <= 5;
  //     case "out":
  //       return stock === 0;
  //     case "all":
  //     default:
  //       return true;
  //   }
  // });

  // Não faça slice/paginação no frontend!
  // Use apenas os produtos recebidos do backend (já paginados)

  return (
    <div className={`${viewMode === "grid" ? "space-y-4 px-6 pb-6" : "space-y-4 pb-6"}`}>
      {/* Header: texto de quantidade à esquerda, botões à direita */}
      <div className={`${viewMode === "grid" ? "flex items-center justify-between px-0 pb-2" : "flex items-center justify-between px-6 pb-2"}`}>
        {/* Quantidade de produtos */}
        <span className="text-sm text-muted-foreground">
          {totalProducts} produto{totalProducts !== 1 ? 's' : ''} encontrado{totalProducts !== 1 ? 's' : ''}
        </span>
        {/* Botões de alternância de visualização */}
        <div className="flex items-center gap-2">
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
      {products.length === 0 ? (
        <ProductEmptyState clearFilters={clearFilters} />
      ) : (
        viewMode === "grid" ? (
          <ProductGridWithActions 
            products={products}
            formatCurrency={formatCurrency}
            navigateToProductDetails={navigateToProductDetails}
            onRefresh={onRefresh}
          />
        ) : (
          <ProductTableWithActions 
            products={products}
            formatCurrency={formatCurrency}
            navigateToProductDetails={navigateToProductDetails}
            onRefresh={onRefresh}
          />
        )
      )}
      {/* Paginação */}
      {totalPages > 1 && (
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