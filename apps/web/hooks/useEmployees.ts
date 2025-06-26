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

export function useEmployees() {
  const [search, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setCurrentPage(1);
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
  
  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  const {
    data: employeesData = { users: [], pagination: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.EMPLOYEES(search, currentPage, pageSize),
    queryFn: async () => {
      const timestamp = new Date().getTime();
      
      // Se há busca, buscar em todos os usuários e filtrar depois
      if (search && search.trim()) {
        const response = await api.get(API_ROUTES.USERS.BASE, {
          params: {
            search: search.trim(),
            page: currentPage,
            limit: pageSize * 2, // Aumentar o limit para compensar a filtragem
            _t: timestamp
          },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Timestamp': timestamp.toString()
          }
        });
        
        return response.data;
      } else {
        // Buscar funcionários e administradores separadamente e combinar
        const [employeesResponse, adminsResponse] = await Promise.all([
          api.get(API_ROUTES.USERS.BASE, {
            params: {
              role: 'employee',
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
          }),
          api.get(API_ROUTES.USERS.BASE, {
            params: {
              role: 'admin',
              page: 1,
              limit: 50, // Assumindo que não há muitos admins
              _t: timestamp
            },
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Timestamp': timestamp.toString()
            }
          })
        ]);
        
        // Combinar os resultados
        const combinedUsers = [
          ...employeesResponse.data.users,
          ...adminsResponse.data.users
        ];
        
        return {
          users: combinedUsers,
          pagination: employeesResponse.data.pagination // Usar a paginação dos funcionários como base
        };
      }
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const employees = useMemo(() => {
    if (Array.isArray(employeesData.users)) {
      const onlyEmployees = employeesData.users.filter((user: User) => user.role === 'employee' || user.role === 'admin');
      return [...onlyEmployees].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return [];
  }, [employeesData.users]);

  const pagination = useMemo(() => {
    return {
      limit: employeesData.pagination?.limit,
      currentPage: employeesData.pagination?.page,
      totalPages: employeesData.pagination?.totaPages,
      totalItems: employeesData.pagination?.total
    };
  }, [employeesData.pagination]);

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
    navigateToNewEmployee,
    getUserImageUrl,
    limit: pagination.limit,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    setCurrentPage: handlePageChange,
  };
}