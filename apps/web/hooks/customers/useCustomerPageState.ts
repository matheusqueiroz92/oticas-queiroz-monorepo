import { useState, useCallback } from 'react';

export interface CustomerPageState {
  newCustomerDialogOpen: boolean;
  editCustomerDialogOpen: boolean;
  customerToEdit: any;
  showFilters: boolean;
  selectedCustomerType: string;
  selectedCategory: string;
}

export function useCustomerPageState() {
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomerType, setSelectedCustomerType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const handleOpenNewCustomer = useCallback(() => {
    setNewCustomerDialogOpen(true);
  }, []);

  const handleCloseNewCustomer = useCallback(() => {
    setNewCustomerDialogOpen(false);
  }, []);

  const handleEditCustomer = useCallback((customer: any) => {
    setCustomerToEdit(customer);
    setEditCustomerDialogOpen(true);
  }, []);

  const handleCloseEditCustomer = useCallback(() => {
    setEditCustomerDialogOpen(false);
    setCustomerToEdit(undefined);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCustomerType("all");
    setSelectedCategory("todos");
  }, []);

  return {
    state: {
      newCustomerDialogOpen,
      editCustomerDialogOpen,
      customerToEdit,
      showFilters,
      selectedCustomerType,
      selectedCategory,
    },
    actions: {
      handleOpenNewCustomer,
      handleCloseNewCustomer,
      handleEditCustomer,
      handleCloseEditCustomer,
      toggleFilters,
      resetFilters,
      setSelectedCustomerType,
      setSelectedCategory,
    },
  };
} 