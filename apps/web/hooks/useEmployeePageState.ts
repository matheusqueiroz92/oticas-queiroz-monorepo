import { useState, useCallback } from 'react';

export interface EmployeePageState {
  newEmployeeDialogOpen: boolean;
  editEmployeeDialogOpen: boolean;
  employeeToEdit: any;
  showFilters: boolean;
  selectedRole: string;
  selectedStatus: string;
}

export function useEmployeePageState() {
  const [newEmployeeDialogOpen, setNewEmployeeDialogOpen] = useState(false);
  const [editEmployeeDialogOpen, setEditEmployeeDialogOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<any>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");

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
    setSelectedRole("todos");
    setSelectedStatus("todos");
  }, []);

  return {
    state: {
      newEmployeeDialogOpen,
      editEmployeeDialogOpen,
      employeeToEdit,
      showFilters,
      selectedRole,
      selectedStatus,
    },
    actions: {
      handleOpenNewEmployee,
      handleCloseNewEmployee,
      handleEditEmployee,
      handleCloseEditEmployee,
      toggleFilters,
      resetFilters,
      setSelectedRole,
      setSelectedStatus,
    },
  };
} 