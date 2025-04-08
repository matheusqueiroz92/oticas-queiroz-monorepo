"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { useUsers } from "@/hooks/useUsers";
import debounce from 'lodash/debounce';
import { User } from "@/app/types/user";

export function useCustomers() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();
  
  // Obter o valor da página da URL, padrão é 1 se não existir
  const pageFromUrl = searchParams.get("page") ? parseInt(searchParams.get("page") as string, 10) : 1;
  
  const [search, setSearchValue] = useState("");
  const [currentPage, setCurrentPageState] = useState(pageFromUrl);
  const [pageSize] = useState(10);

  // Sincronizar o estado com o parâmetro de URL quando a URL mudar
  useEffect(() => {
    if (pageFromUrl !== currentPage) {
      setCurrentPageState(pageFromUrl);
    }
  }, [pageFromUrl]);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      // Reseta para a primeira página e atualiza a URL ao pesquisar
      updateUrl(1, value);
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.USERS.CUSTOMERS() 
      });
    }, 300),
    [queryClient]
  );

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    
    if (debouncedSearch.cancel) {
      debouncedSearch.cancel();
    }

    debouncedSearch(value);
  }, [debouncedSearch]);
  
  // Função para atualizar a URL com os parâmetros de página e busca
  const updateUrl = useCallback((page: number, searchValue: string = search) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Atualizar parâmetro de página
    if (page === 1) {
      params.delete("page"); // Remove o parâmetro se for página 1 (padrão)
    } else {
      params.set("page", page.toString());
    }
    
    // Atualizar parâmetro de busca
    if (!searchValue) {
      params.delete("q"); // Remove o parâmetro se a busca estiver vazia
    } else {
      params.set("q", searchValue);
    }
    
    // Construir a nova URL e navegar
    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
    
    // Atualizar o estado local
    setCurrentPageState(page);
    if (searchValue !== search) {
      setSearchValue(searchValue);
    }
  }, [pathname, router, searchParams, search]);
  
  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // Efeito para atualizar a busca a partir da URL
  useEffect(() => {
    const searchFromUrl = searchParams.get("q") || "";
    if (searchFromUrl !== search) {
      setSearchValue(searchFromUrl);
    }
  }, [searchParams]);

  const {
    data: customersData = { users: [], pagination: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.CUSTOMERS(search, currentPage, pageSize),
    queryFn: async () => {
      try {
        const timestamp = new Date().getTime();
        
        const searchParams: Record<string, any> = { 
          role: "customer",
          _t: timestamp,
          page: currentPage,
          limit: pageSize
        };
        
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
          return { users: [], pagination: { page: 1, totalPages: 1, total: 0 } };
        }
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: true,
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
      limit: customersData.pagination?.limit,
      currentPage: customersData.pagination?.page || currentPage,
      totalPages: customersData.pagination?.totalPages || 1,
      totalItems: customersData.pagination?.total || 0
    };
  }, [customersData.pagination, currentPage]);

  const navigateToCustomerDetails = useCallback((id: string) => {
    router.push(`/customers/${id}`);
  }, [router]);

  const navigateToNewCustomer = useCallback(() => {
    router.push("/customers/new");
  }, [router]);

  const refreshCustomersList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.CUSTOMERS() });
    await refetch();
  }, [queryClient, refetch]);

  // Função para lidar com a mudança de página, agora atualizando a URL
  const handlePageChange = useCallback((newPage: number) => {
    updateUrl(newPage);
  }, [updateUrl]);

  return {
    customers,
    isLoading,
    error: error ? (error as Error).message : null,
    search,
    setSearch,
    refetch,
    refreshCustomersList,
    navigateToCustomerDetails,
    navigateToNewCustomer,
    getUserImageUrl,
    limit: pagination.limit,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    setCurrentPage: handlePageChange,
  };
}