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

export function useEmployees() {
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
        queryKey: QUERY_KEYS.USERS.EMPLOYEES() 
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
    data: employeesData = { users: [], pagination: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.EMPLOYEES(search, currentPage, pageSize),
    queryFn: async () => {
      const timestamp = new Date().getTime();
      const response = await api.get(API_ROUTES.USERS.EMPLOYEES, {
        params: {
          search: search || undefined,
          page: currentPage,
          limit: pageSize,
          _t: timestamp
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': timestamp.toString()
        }
      });
  
      return response.data; // Retorna todos os dados com pagination
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const employees = useMemo(() => {
    if (Array.isArray(employeesData.users)) {
      const onlyEmployees = employeesData.users.filter((user: User) => user.role === 'employee');
      return [...onlyEmployees].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return []; // Retorna um array vazio se não for um array
  }, [employeesData.users]);

  const pagination = useMemo(() => {
    return {
      limit: employeesData.pagination?.limit,
      currentPage: employeesData.pagination?.page || currentPage,
      totalPages: employeesData.pagination?.totalPages || 1,
      totalItems: employeesData.pagination?.total || 0
    };
  }, [employeesData.pagination, currentPage]);

  const navigateToEmployeeDetails = useCallback((id: string) => {
    router.push(`/employees/${id}`);
  }, [router]);

  const navigateToNewEmployee = useCallback(() => {
    router.push("/employees/new");
  }, [router]);

  const refreshEmployeesList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.EMPLOYEES() });
    await refetch();
  }, [queryClient, refetch]);

  // Função para lidar com a mudança de página, agora atualizando a URL
  const handlePageChange = useCallback((newPage: number) => {
    updateUrl(newPage);
  }, [updateUrl]);

  return {
    employees,
    isLoading,
    error: error ? (error as Error).message : null,
    search,
    setSearch,
    refetch,
    refreshEmployeesList,
    navigateToEmployeeDetails,
    navigateToNewEmployee,
    getUserImageUrl,
    limit: pagination.limit,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    setCurrentPage: handlePageChange,
  };
}