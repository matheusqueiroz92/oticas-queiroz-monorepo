import { useState, useCallback } from 'react';

export function useMyOrdersPageState() {
  const [showFilters, setShowFilters] = useState(false);
  const [loggedUserId, setLoggedUserId] = useState<string>("");
  const [loggedUserName, setLoggedUserName] = useState<string>("");
  const [loggedUserRole, setLoggedUserRole] = useState<string>("");
  const [orderDialogMode, setOrderDialogMode] = useState<"create" | "edit">("create");
  const [orderToEdit, setOrderToEdit] = useState<any>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

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

  // Determinar se é cliente ou funcionário/admin
  const isCustomer = loggedUserRole === "customer";
  const isEmployee = loggedUserRole === "employee" || loggedUserRole === "admin";

  return {
    state: {
      showFilters,
      loggedUserId,
      loggedUserName,
      loggedUserRole,
      orderDialogMode,
      orderToEdit,
      orderDialogOpen,
      isCustomer,
      isEmployee,
    },
    actions: {
      setLoggedUserId,
      setLoggedUserName,
      setLoggedUserRole,
      handleToggleFilters,
      handleOpenNewOrder,
      handleEditOrder,
      handleCloseDialog,
    },
  };
} 