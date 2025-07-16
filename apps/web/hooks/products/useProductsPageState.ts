import { useState, useCallback } from 'react';

export interface ProductsPageState {
  searchTerm: string;
  productType: string;
  viewMode: "grid" | "table";
  stockFilter: "all" | "low" | "out";
  showFilters: boolean;
}

export function useProductsPageState() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productType, setProductType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    setProductType("all");
    setStockFilter("all");
    setSearchTerm("");
  }, []);

  const handleViewModeChange = useCallback((mode: "grid" | "table") => {
    setViewMode(mode);
  }, []);

  return {
    state: {
      searchTerm,
      productType,
      viewMode,
      stockFilter,
      showFilters,
    },
    actions: {
      setSearchTerm,
      setProductType,
      setViewMode: handleViewModeChange,
      setStockFilter,
      setShowFilters,
      handleToggleFilters,
      handleClearFilters,
    },
  };
} 