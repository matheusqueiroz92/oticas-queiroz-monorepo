import { useState, useCallback } from 'react';

export function useCustomerDetailsState() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleOpenEditDialog = useCallback(() => {
    setEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  return {
    state: {
      statusFilter,
      editDialogOpen,
    },
    actions: {
      handleOpenEditDialog,
      handleCloseEditDialog,
      handleStatusFilterChange,
      setStatusFilter,
    },
  };
} 