"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, Package, AlertTriangle, DollarSign, TrendingUp, Search, Filter, Download, Plus } from "lucide-react";
import { ProductsListWithDialog } from "@/components/products/ProductsListWithDialog";
import { ProductsStatistics } from "@/components/products/ProductsStatistics";
import { ProductActions } from "@/components/products/ProductActions";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ListPageHeader, 
  FilterSelects, 
  ActionButtons, 
  AdvancedFilters,
  ListPageContent 
} from "@/components/ui/list-page-header";
import { getProductTypeName } from "@/app/_services/productService";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productType, setProductType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [showFilters, setShowFilters] = useState(false);

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
    formatCurrency,
    refetch,
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

  const handleRefresh = () => {
    refetch();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (productType !== "all") count++;
    if (stockFilter !== "all") count++;
    return count;
  };

  // Calcular estatísticas dos produtos


  const showEmptyState = !loading && !error && products.length === 0;

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
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <ProductsStatistics 
          products={products}
          formatCurrency={formatCurrency}
        />

        {/* Filtros e Busca */}
        <ListPageHeader
          title="Lista de Produtos"
          searchValue={searchTerm}
          searchPlaceholder="Buscar por nome ou marca"
          onSearchChange={setSearchTerm}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(prev => !prev)}
          activeFiltersCount={getActiveFiltersCount()}
        >
          <FilterSelects>
            <Select value={productType} onValueChange={handleProductTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="lenses">{getProductTypeName("lenses")}</SelectItem>
                <SelectItem value="clean_lenses">{getProductTypeName("clean_lenses")}</SelectItem>
                <SelectItem value="prescription_frame">{getProductTypeName("prescription_frame")}</SelectItem>
                <SelectItem value="sunglasses_frame">{getProductTypeName("sunglasses_frame")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as "all" | "low" | "out")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
                <SelectItem value="out">Sem estoque</SelectItem>
              </SelectContent>
            </Select>
          </FilterSelects>

          <ActionButtons>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <ProductActions onRefresh={handleRefresh} />
          </ActionButtons>

          <AdvancedFilters>
            <div></div>
          </AdvancedFilters>
        </ListPageHeader>

        <ListPageContent>
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-6">
              <ErrorAlert message={error.message || "Ocorreu um erro ao carregar os produtos."} />
            </div>
          )}

          {showEmptyState && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                {searchTerm ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Produto' para adicionar um produto ao sistema."}
              </p>
              {!searchTerm && (
                <ProductActions onRefresh={handleRefresh} />
              )}
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <ProductsListWithDialog 
              products={filteredProducts}
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
              formatCurrency={formatCurrency}
              onRefresh={handleRefresh}
            />
          )}
        </ListPageContent>
      </div>
    </PageContainer>
  );
}