import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
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
  onNewProduct: () => void;
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
  onNewProduct,
}: ProductsTableWithFiltersProps) {
  const showEmptyState = !isLoading && !error && products.length === 0;
  const productTypeOptions = getProductTypeFilterOptions();
  const stockOptions = getStockFilterOptions();

  // Converter as opções para o formato do componente genérico
  const productTypeFilterOptions: FilterOption[] = productTypeOptions.map(option => ({
    value: option.value,
    label: option.label,
    icon: option.icon
  }));

  const stockFilterOptions: FilterOption[] = stockOptions.map(option => ({
    value: option.value,
    label: option.label,
    icon: option.icon
  }));

  const basicFilters = [
    {
      options: productTypeFilterOptions,
      value: productType,
      onChange: (value: string) => onProductTypeChange(value),
      placeholder: "Tipo de produto",
      width: "w-[200px]"
    },
    {
      options: stockFilterOptions,
      value: stockFilter,
      onChange: (value: string) => onStockFilterChange(value as "all" | "low" | "out"),
      placeholder: "Estoque",
      width: "w-[160px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Produtos"
      searchPlaceholder="Buscar por nome ou marca"
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <ProductsAdvancedFilters
          onUpdateFilters={onAdvancedFiltersUpdate}
          onClearFilters={onClearFilters}
        />
      }
      onNewItem={onNewProduct}
      newButtonText="Novo Produto"
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || products.length === 0}
    >
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
        onNewProduct={onNewProduct}
      />
    </DataTableWithFilters>
  );
} 