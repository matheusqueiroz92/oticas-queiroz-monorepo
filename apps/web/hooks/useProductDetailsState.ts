import { useState, useCallback } from 'react';

export function useProductDetailsState() {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleOpenEditDialog = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setShowEditDialog(false);
  }, []);

  return {
    showEditDialog,
    handleOpenEditDialog,
    handleCloseEditDialog,
  };
} 