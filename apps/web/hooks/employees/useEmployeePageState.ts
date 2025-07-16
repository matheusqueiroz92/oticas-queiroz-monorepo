import { useState, useCallback } from 'react';

export interface EmployeePageState {
  newEmployeeDialogOpen: boolean;
  editEmployeeDialogOpen: boolean;
  employeeToEdit: any;
  showFilters: boolean;
}

export function useEmployeePageState() {
  const [newEmployeeDialogOpen, setNewEmployeeDialogOpen] = useState(false);
  const [editEmployeeDialogOpen, setEditEmployeeDialogOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<any>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const handleOpenNewEmployee = useCallback(() => {
    setNewEmployeeDialogOpen(true);
  }, []);

  const handleCloseNewEmployee = useCallback(() => {
    setNewEmployeeDialogOpen(false);
  }, []);

  const handleEditEmployee = useCallback((employee: any) => {
    setEmployeeToEdit(employee);
    setEditEmployeeDialogOpen(true);
  }, []);

  const handleCloseEditEmployee = useCallback(() => {
    setEditEmployeeDialogOpen(false);
    setEmployeeToEdit(undefined);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const resetFilters = useCallback(() => {
    // Reset filters if needed
  }, []);

  return {
    state: {
      newEmployeeDialogOpen,
      editEmployeeDialogOpen,
      employeeToEdit,
      showFilters,
    },
    actions: {
      handleOpenNewEmployee,
      handleCloseNewEmployee,
      handleEditEmployee,
      handleCloseEditEmployee,
      toggleFilters,
      resetFilters,
    },
  };
} 