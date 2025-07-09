import { useState, useCallback } from 'react';

export function useOrdersPageState() {
  const [userId, setUserId] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderDialogMode, setOrderDialogMode] = useState<'create' | 'edit'>('create');
  const [orderToEdit, setOrderToEdit] = useState<any>(null);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleOpenNewOrder = useCallback(() => {
    setOrderDialogMode('create');
    setOrderToEdit(null);
    setOrderDialogOpen(true);
  }, []);

  const handleEditOrder = useCallback((order: any) => {
    setOrderDialogMode('edit');
    setOrderToEdit(order);
    setOrderDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOrderDialogOpen(false);
    setOrderToEdit(null);
  }, []);

  return {
    state: {
      userId,
      showFilters,
      orderDialogOpen,
      orderDialogMode,
      orderToEdit,
    },
    actions: {
      setUserId,
      handleToggleFilters,
      handleOpenNewOrder,
      handleEditOrder,
      handleCloseDialog,
    },
  };
} 