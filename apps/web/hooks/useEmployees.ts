"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { useUsers } from "@/hooks/useUsers";
import debounce from 'lodash/debounce';
import { User } from "@/app/_types/user";

interface UseEmployeesOptions {
  pageSize?: number;
  initialSearch?: string;
  enablePagination?: boolean;
}

interface EmployeeFilters {
  search?: string;
  page?: number;
  role?: string;
  status?: string;
  sort?: string;
  cpf?: string;
  limit?: number;
  salesRange?: string;
  startDate?: string;
  endDate?: string;
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const {
    pageSize = 10,
    initialSearch = "",
    enablePagination = true
  } = options;
  
  const [search, setSearchValue] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<EmployeeFilters>({ 
    sort: "name",
    limit: pageSize 
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();

  const filterKey = JSON.stringify(filters);

  // Função para processar busca
  const processSearch = useCallback((value: string) => {
    setFilters(prevFilters => {
      const newFilters: EmployeeFilters = { 
        ...prevFilters,
        search: undefined,
        cpf: undefined,
        sort: "name"
      };
      
      if (value.trim()) {
        const cleanSearch = value.trim().replace(/\D/g, '');
        
        if (/^\d{11}$/.test(cleanSearch)) {
          newFilters.cpf = cleanSearch;
          newFilters.search = undefined;
        } else {
          newFilters.search = value.trim();
          newFilters.cpf = undefined;
        }
      }
      
      return newFilters;
    });
  
    setCurrentPage(1);
  
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.USERS.EMPLOYEES() 
    });
  }, [queryClient]);

  const debouncedSearch = useMemo(
    () => debounce(processSearch, 300),
    [processSearch]
  );

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    
    if (debouncedSearch.cancel) {
      debouncedSearch.cancel();
    }

    debouncedSearch(value);
  }, [debouncedSearch]);
  
  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters: EmployeeFilters) => {
    setFilters(prevFilters => ({
      ...newFilters,
      sort: "name",
      search: newFilters.search !== undefined ? newFilters.search : prevFilters.search,
      cpf: newFilters.cpf !== undefined ? newFilters.cpf : prevFilters.cpf,
      limit: pageSize
    }));
    
    setCurrentPage(1);
    
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.USERS.EMPLOYEES()
    });
  }, [queryClient, pageSize]);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    const baseFilters = { sort: "name", limit: pageSize };
    setFilters(baseFilters);
    setCurrentPage(1);
    setSearchValue("");
    
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.USERS.EMPLOYEES()
    });
  }, [queryClient, pageSize]);

  // Função para contar filtros ativos
  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search || filters.cpf) count++;
    if (filters.role && filters.role !== 'todos') count++;
    if (filters.status && filters.status !== 'todos') count++;
    if (filters.salesRange && filters.salesRange !== 'todos') count++;
    return count;
  }, [filters]);

  // Query principal para buscar funcionários com filtros
  const {
    data: employeesData = { users: [], pagination: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.EMPLOYEES(search, currentPage, pageSize),
    queryFn: async () => {
      try {
        const timestamp = new Date().getTime();
        
        const searchParams: Record<string, any> = { 
          _t: timestamp
        };
        
        if (enablePagination) {
          searchParams.page = currentPage;
          searchParams.limit = pageSize;
        }

        // Aplicar filtros
        if (filters.search) {
          searchParams.search = filters.search;
        }
        
        if (filters.cpf) {
          searchParams.cpf = filters.cpf;
        }
        
        if (filters.role && filters.role !== 'todos') {
          searchParams.role = filters.role;
        }
        
        if (filters.sort) {
          searchParams.sort = filters.sort;
        }

        const queryString = new URLSearchParams(searchParams).toString();
        const url = `/api/users?${queryString}`;
        
        const response = await api.get(url);
        
        return response.data;
      } catch (error: any) {
        console.error("❌ Erro ao buscar funcionários:", error);
        
        if (error.response?.status === 404) {
          return { users: [], pagination: {} };
        }
        
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const employees = useMemo(() => {
    if (Array.isArray(employeesData.users)) {
      // Filtrar apenas funcionários (employees e admins)
      const onlyEmployees = employeesData.users.filter((user: User) => 
        user.role === 'employee' || user.role === 'admin'
      );
      
      // Aplicar filtros adicionais se necessário
      let filteredEmployees = onlyEmployees;
      
      if (filters.salesRange && filters.salesRange !== 'todos') {
        filteredEmployees = filteredEmployees.filter((employee: User) => {
          const sales = employee.sales?.length || 0;
          switch (filters.salesRange) {
            case '0':
              return sales === 0;
            case '1+':
              return sales >= 1;
            case '1-5':
              return sales >= 1 && sales <= 5;
            case '6-10':
              return sales >= 6 && sales <= 10;
            case '10+':
              return sales > 10;
            default:
              return true;
          }
        });
      }
      
      return [...filteredEmployees].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return [];
  }, [employeesData.users, filters.salesRange]);

  const pagination = useMemo(() => {
    return {
      limit: employeesData.pagination?.limit || pageSize,
      currentPage: employeesData.pagination?.page || currentPage,
      totalPages: employeesData.pagination?.totalPages || 1,
      totalItems: employeesData.pagination?.total || employees.length
    };
  }, [employeesData.pagination, pageSize, currentPage, employees.length]);

  const navigateToEmployeeDetails = useCallback((id: string) => {
    router.push(`/employees/${id}`);
  }, [router]);

  const refreshEmployeesList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.EMPLOYEES() });
    await refetch();
  }, [queryClient, refetch]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const showEmptyState = !isLoading && !error && employees.length === 0;

  return {
    employees,
    isLoading,
    error: error ? (error as Error).message : null,
    search,
    showEmptyState,
    setSearch,
    refetch,
    refreshEmployeesList,
    navigateToEmployeeDetails,
    getUserImageUrl,
    limit: pagination.limit,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    setCurrentPage: handlePageChange,
    filters,
    updateFilters,
    clearFilters,
    getActiveFiltersCount,
  };
}