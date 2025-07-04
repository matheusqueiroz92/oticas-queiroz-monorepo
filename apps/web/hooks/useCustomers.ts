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
import { Customer } from "@/app/_types/customer";
import { getAllUsersForExport } from "@/app/_services/userService";

interface UseCustomersOptions {
  pageSize?: number;
  initialSearch?: string;
  enablePagination?: boolean;
}

interface CustomerFilters {
  search?: string;
  page?: number;
  customerType?: string;
  status?: string;
  sort?: string;
  cpf?: string;
  limit?: number;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const {
    pageSize = 10,
    initialSearch = "",
    enablePagination = true
  } = options;
  
  const [search, setSearchValue] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CustomerFilters>({ 
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
      const newFilters: CustomerFilters = { 
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
        queryKey: QUERY_KEYS.USERS.CUSTOMERS() 
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
  const updateFilters = useCallback((newFilters: CustomerFilters) => {
    setFilters(prevFilters => ({
      ...newFilters,
      sort: "name",
      search: newFilters.search !== undefined ? newFilters.search : prevFilters.search,
      cpf: newFilters.cpf !== undefined ? newFilters.cpf : prevFilters.cpf,
      limit: pageSize
    }));
    
    setCurrentPage(1);
    
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.USERS.CUSTOMERS()
    });
  }, [queryClient, pageSize]);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    const baseFilters = { sort: "name", limit: pageSize };
    setFilters(baseFilters);
    setCurrentPage(1);
    setSearchValue("");
    
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.USERS.CUSTOMERS()
    });
  }, [queryClient, pageSize]);

  // Nova função para buscar todos os clientes (sem paginação)
  const fetchAllCustomers = useCallback(async (searchQuery: string = "") => {
    try {
      const timestamp = new Date().getTime();
      
      const searchParams: Record<string, any> = { 
        role: "customer",
        _t: timestamp,
        limit: 1000 // Um limite alto para buscar praticamente todos
      };
      
      if (searchQuery) {
        const cleanSearch = searchQuery.trim().replace(/\D/g, '');
        
        if (/^\d{11}$/.test(cleanSearch)) {
          searchParams.cpf = cleanSearch;
        } else {
          searchParams.search = searchQuery;
        }
      }

      const queryString = new URLSearchParams(searchParams).toString();
      const url = `/api/users?${queryString}`;
      
      const response = await api.get(url);
      
      if (response.data?.users) {
        return response.data.users;
      }
      
      return [];
    } catch (error: any) {
      console.error("❌ Erro ao buscar clientes:", error);
      
      if (error.response?.status === 404) {
        return [];
      }
      
      throw error;
    }
  }, []);

  // Query principal para buscar clientes com filtros
  const {
    data: customersData = { users: [], pagination: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.CUSTOMERS(search, currentPage, pageSize, filterKey),
    queryFn: async () => {
      try {
        const timestamp = new Date().getTime();
        
        const searchParams: Record<string, any> = { 
          role: "customer",
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

        if (filters.customerType && filters.customerType !== 'all') {
          // Lógica para diferentes tipos de cliente pode ser adicionada aqui
        }

        if (filters.status && filters.status !== 'all') {
          // Lógica para status de cliente pode ser adicionada aqui
        }
        
        if (search) {
          const cleanSearch = search.trim().replace(/\D/g, '');
          
          if (/^\d{11}$/.test(cleanSearch)) {
            searchParams.cpf = cleanSearch;
          } 
          else if (/^\d{4,7}$/.test(cleanSearch)) {
            searchParams.serviceOrder = cleanSearch;
          } 
          else {
            searchParams.search = search;
          }
        }
        
        const response = await api.get(API_ROUTES.USERS.BASE, {
          params: searchParams,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Timestamp': timestamp.toString()
          }
        });
        
        return response.data;
      } catch (error: any) {
        if (
          error.response?.status === 404 &&
          error.response?.data?.message ===
            "Nenhum usuário com role 'customer' encontrado"
        ) {
          return { users: [], pagination: {} };
        }
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Query separada para buscar total real de clientes (não filtrado)
  const { data: totalCustomersData } = useQuery({
    queryKey: QUERY_KEYS.USERS.TOTAL_CUSTOMERS,
    queryFn: async () => {
      try {
        const response = await api.get(API_ROUTES.USERS.BASE, {
          params: { 
            role: "customer",
            limit: 9999,
            _t: Date.now()
          }
        });
        
        const users = response.data?.users || [];
        return users.filter((user: User) => user.role === 'customer').length;
      } catch (error) {
        console.error("Erro ao buscar total de clientes:", error);
        return 0;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });

  const customers = useMemo(() => {
    if (Array.isArray(customersData.users)) {
      const onlyCustomers = customersData.users.filter((user: User) => user.role === 'customer');
      return [...onlyCustomers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    
    return [];
  }, [customersData.users]);

  const pagination = useMemo(() => {
    return {
      limit: customersData.pagination?.limit || pageSize,
      currentPage: customersData.pagination?.page || currentPage,
      totalPages: customersData.pagination?.totalPages || 1,
      totalItems: customersData.pagination?.total || 0
    };
  }, [customersData.pagination, currentPage, pageSize]);

  const navigateToCustomerDetails = useCallback((id: string) => {
    router.push(`/customers/${id}`);
  }, [router]);

  const navigateToNewCustomer = useCallback(() => {
    router.push("/customers/new");
  }, [router]);

  const refreshCustomersList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.CUSTOMERS() });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.TOTAL_CUSTOMERS });
    await refetch();
  }, [queryClient, refetch]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Função para contar filtros ativos
  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (filters.customerType && filters.customerType !== 'all') count++;
    if (filters.status && filters.status !== 'all') count++;
    return count;
  }, [search, filters.customerType, filters.status]);

  const fetchCustomerById = useCallback(async (id: string) => {
    if (!id) return null;
    
    try {
      const response = await api.get(API_ROUTES.USERS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar cliente ${id}:`, error);
      return null;
    }
  }, []);

  return {
    customers,
    isLoading,
    error: error?.message || null,
    search,
    setSearch,
    currentPage,
    totalPages: pagination.totalPages,
    setCurrentPage: handlePageChange,
    totalItems: pagination.totalItems,
    totalCustomers: totalCustomersData || 0,
    limit: pagination.limit,
    refetch: refreshCustomersList,
    navigateToCustomerDetails,
    navigateToNewCustomer,
    fetchAllCustomers,
    fetchCustomerById,
    getUserImageUrl,
    
    // Novos recursos de filtros
    filters,
    updateFilters,
    clearFilters,
    getActiveFiltersCount
  };
}