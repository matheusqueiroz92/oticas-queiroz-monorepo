import { useCallback } from 'react';

interface MyOrdersFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  filters: Record<string, any>;
  updateFilters: (filters: Record<string, any>) => void;
  isCustomer: boolean;
  isEmployee: boolean;
  loggedUserId: string;
}

export function useMyOrdersFilters({
  search,
  setSearch,
  filters,
  updateFilters,
  isCustomer,
  isEmployee,
  loggedUserId,
}: MyOrdersFiltersProps) {
  const shouldUseFilters = isEmployee;

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (search) count++;
    
    // Para funcionários/admins: contar filtros ativos (exceto employeeId automático)
    if (shouldUseFilters) {
      if (filters.status && filters.status !== 'all') count++;
      if (filters.paymentMethod && filters.paymentMethod !== 'all') count++;
      if (filters.laboratoryId && filters.laboratoryId !== 'all') count++;
      if (filters.startDate) count++;
      if (filters.endDate) count++;
    }
    
    return count;
  }, [search, filters, shouldUseFilters]);

  const handleClearFilters = useCallback(() => {
    // Para funcionários/admins: manter apenas o filtro do usuário logado e limpar os outros
    if (shouldUseFilters && isEmployee) {
      const newFilters: any = {
        sort: "-createdAt",
        employeeId: loggedUserId
      };
      
      updateFilters(newFilters);
      setSearch('');
    }
    // Para clientes: apenas limpar a busca (os pedidos vêm do hook useMyOrders)
    else if (isCustomer) {
      setSearch('');
    }
  }, [shouldUseFilters, isEmployee, isCustomer, loggedUserId, updateFilters, setSearch]);

  const handleUpdateFilters = useCallback((newFilters: Record<string, any>) => {
    // Sempre manter o filtro do usuário logado
    const filtersWithUser = { ...newFilters };
    
    if (isCustomer) {
      filtersWithUser.clientId = loggedUserId;
    } else if (isEmployee) {
      filtersWithUser.employeeId = loggedUserId;
    }
    
    updateFilters(filtersWithUser);
  }, [isCustomer, isEmployee, loggedUserId, updateFilters]);

  const handleStatusFilterChange = useCallback((value: string) => {
    const newFilters = { ...filters };
    if (value === "all") {
      delete newFilters.status;
    } else {
      newFilters.status = value;
    }
    handleUpdateFilters(newFilters);
  }, [filters, handleUpdateFilters]);

  return {
    shouldUseFilters,
    getActiveFiltersCount,
    handleClearFilters,
    handleUpdateFilters,
    handleStatusFilterChange,
  };
} 