import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductsAdvancedFilters } from "@/components/products/ProductsAdvancedFilters";
import { ProductsContent } from "@/components/products/ProductsContent";
import { ProductActions } from "@/components/products/ProductActions";
import { getProductTypeFilterOptions, getStockFilterOptions } from "@/app/_utils/product-utils";

interface ProductsTableWithFiltersProps {
  products: any[];
  isLoading: boolean;
  error: any;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  productType: string;
  onProductTypeChange: (type: string) => void;
  stockFilter: "all" | "low" | "out";
  onStockFilterChange: (filter: "all" | "low" | "out") => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  onAdvancedFiltersUpdate: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  setCurrentPage: (page: number) => void;
  navigateToProductDetails: (productId: string) => void;
  formatCurrency: (value: number) => string;
  onSearch: (event: React.FormEvent) => void;
}

export function ProductsTableWithFilters({
  products,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
  productType,
  onProductTypeChange,
  stockFilter,
  onStockFilterChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onAdvancedFiltersUpdate,
  onClearFilters,
  onRefresh,
  currentPage,
  totalPages,
  totalProducts,
  setCurrentPage,
  navigateToProductDetails,
  formatCurrency,
  // onSearch,
}: ProductsTableWithFiltersProps) {
  const showEmptyState = !isLoading && !error && products.length === 0;
  const productTypeOptions = getProductTypeFilterOptions();
  const stockOptions = getStockFilterOptions();

  return (
    <Card>
      <CardHeader className="bg-gray-100 dark:bg-slate-800/50">
        <CardTitle className="text-lg">Lista de Produtos</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
          {/* Área esquerda: Input de busca e selects */}
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Buscar por nome ou marca"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            
            <Select value={productType} onValueChange={onProductTypeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de produto" />
              </SelectTrigger>
              <SelectContent>
                {productTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={onStockFilterChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                {stockOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Área direita: Botões de ação */}
          <div className="flex gap-2 justify-end sm:ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleFilters}
              className={activeFiltersCount > 0 ? "bg-blue-50 border-blue-200 dark:bg-blue-900/60 dark:border-blue-700" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <ProductActions onRefresh={onRefresh} />
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <ProductsAdvancedFilters
          onUpdateFilters={onAdvancedFiltersUpdate}
          onClearFilters={onClearFilters}
        />
      )}
      
      <CardContent className="p-0">
        <ProductsContent
          products={products}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
          productType={productType}
          stockFilter={stockFilter}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          showEmptyState={showEmptyState}
          currentPage={currentPage}
          totalPages={totalPages}
          totalProducts={totalProducts}
          setCurrentPage={setCurrentPage}
          navigateToProductDetails={navigateToProductDetails}
          formatCurrency={formatCurrency}
          onRefresh={onRefresh}
          onClearFilters={onClearFilters}
        />
      </CardContent>
    </Card>
  );
} 