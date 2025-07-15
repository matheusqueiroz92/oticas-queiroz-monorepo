"use client";

import { useProducts } from "@/hooks/useProducts";
import { useProductsPageState } from "@/hooks/useProductsPageState";
import { useProductsFilters } from "@/hooks/useProductsFilters";
import { useProductsStats } from "@/hooks/useProductsStats";
import { ProductsStatsCards } from "@/components/products/ProductsStatsCards";
import { ProductsTableWithFilters } from "@/components/products/ProductsTableWithFilters";
import { PageContainer } from "@/components/ui/page-container";
import { useState } from "react";

export default function ProductsPage() {
  const { state, actions } = useProductsPageState();

  // Estado local para paginação
  const [currentPage, setCurrentPage] = useState(1);

  const {
    products = [],
    loading,
    error,
    totalPages = 1,
    totalProducts = 0,
    updateFilters,
    navigateToProductDetails,
    formatCurrency,
    refetch,
  } = useProducts(currentPage, state.searchTerm, state.stockFilter);

  const {
    handleSearch,
    handleProductTypeChange,
    handleAdvancedFiltersUpdate,
    getActiveFiltersCount,
    // filterProducts,
  } = useProductsFilters({
    searchTerm: state.searchTerm,
    productType: state.productType,
    stockFilter: state.stockFilter,
    updateFilters,
  });

  const stats = useProductsStats(products);
  // const filteredProducts = filterProducts(products);

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <ProductsStatsCards 
          totalProducts={stats.totalProducts}
          lowStockProducts={stats.lowStockProducts}
          outOfStockProducts={stats.outOfStockProducts}
          lensesCount={stats.lensesCount}
          cleanLensesCount={stats.cleanLensesCount}
          prescriptionFramesCount={stats.prescriptionFramesCount}
          sunglassesFramesCount={stats.sunglassesFramesCount}
          totalStockValue={stats.totalStockValue}
        />

        {/* Filtros e Tabela */}
        <ProductsTableWithFilters
          products={products}
          isLoading={loading}
          error={error}
          searchTerm={state.searchTerm}
          onSearchChange={actions.setSearchTerm}
          productType={state.productType}
          onProductTypeChange={(value: string) => {
            actions.setProductType(value);
            handleProductTypeChange(value);
          }}
          stockFilter={state.stockFilter}
          onStockFilterChange={actions.setStockFilter}
          viewMode={state.viewMode}
          onViewModeChange={actions.setViewMode}
          showFilters={state.showFilters}
          onToggleFilters={actions.handleToggleFilters}
          activeFiltersCount={getActiveFiltersCount()}
          onAdvancedFiltersUpdate={handleAdvancedFiltersUpdate}
          onClearFilters={() => {
            actions.handleClearFilters();
            updateFilters({});
          }}
          onRefresh={refetch}
          currentPage={currentPage}
          totalPages={totalPages}
          totalProducts={totalProducts}
          setCurrentPage={setCurrentPage}
          navigateToProductDetails={navigateToProductDetails}
          formatCurrency={formatCurrency}
          onSearch={handleSearch}
        />
      </div>
    </PageContainer>
  );
}