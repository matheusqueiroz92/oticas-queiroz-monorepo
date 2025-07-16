import { useCallback, useMemo } from 'react';

interface UseProductsFiltersProps {
  searchTerm: string;
  productType: string;
  stockFilter: "all" | "low" | "out";
  updateFilters: (filters: any) => void;
}

export function useProductsFilters({
  searchTerm,
  productType,
  stockFilter,
  updateFilters,
}: UseProductsFiltersProps) {
  
  const handleSearch = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    updateFilters({ search: searchTerm });
  }, [searchTerm, updateFilters]);

  const handleProductTypeChange = useCallback((value: string) => {
    updateFilters({ 
      productType: value !== "all" ? value as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame" : undefined 
    });
  }, [updateFilters]);

  const handleAdvancedFiltersUpdate = useCallback((filters: Record<string, any>) => {
    updateFilters(filters);
  }, [updateFilters]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (searchTerm) count++;
    if (productType !== "all") count++;
    if (stockFilter !== "all") count++;
    return count;
  }, [searchTerm, productType, stockFilter]);

  const filterProducts = useCallback((products: any[]) => {
    return products.filter(product => {
      // Filtro por termo de busca (nome ou marca)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const name = (product.name || "").toLowerCase();
        const brand = (product.brand || "").toLowerCase();
        if (!name.includes(term) && !brand.includes(term)) {
          return false;
        }
      }

      // Filtro por tipo de produto
      if (productType !== "all" && product.productType !== productType) {
        return false;
      }

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
  }, [searchTerm, productType, stockFilter]);

  return {
    handleSearch,
    handleProductTypeChange,
    handleAdvancedFiltersUpdate,
    getActiveFiltersCount,
    filterProducts,
  };
} 