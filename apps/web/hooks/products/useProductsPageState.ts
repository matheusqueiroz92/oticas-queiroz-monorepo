import { useState, useCallback } from 'react';

export interface ProductsPageState {
  searchTerm: string;
  productType: string;
  viewMode: "grid" | "table";
  stockFilter: "all" | "low" | "out";
  showFilters: boolean;
  newProductDialogOpen: boolean;
  editProductDialogOpen: boolean;
  productToEdit: any;
}

export function useProductsPageState() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productType, setProductType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(undefined);

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

  const handleOpenNewProduct = useCallback(() => {
    setNewProductDialogOpen(true);
  }, []);

  const handleCloseNewProduct = useCallback(() => {
    setNewProductDialogOpen(false);
  }, []);

  const handleEditProduct = useCallback((product: any) => {
    setProductToEdit(product);
    setEditProductDialogOpen(true);
  }, []);

  const handleCloseEditProduct = useCallback(() => {
    setEditProductDialogOpen(false);
    setProductToEdit(undefined);
  }, []);

  return {
    state: {
      searchTerm,
      productType,
      viewMode,
      stockFilter,
      showFilters,
      newProductDialogOpen,
      editProductDialogOpen,
      productToEdit,
    },
    actions: {
      setSearchTerm,
      setProductType,
      setViewMode: handleViewModeChange,
      setStockFilter,
      setShowFilters,
      handleToggleFilters,
      handleClearFilters,
      handleOpenNewProduct,
      handleCloseNewProduct,
      handleEditProduct,
      handleCloseEditProduct,
    },
  };
} 