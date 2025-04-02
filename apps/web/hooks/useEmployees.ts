"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { useUsers } from "@/hooks/useUsers";
import debounce from 'lodash/debounce';

export function useEmployees() {
  const [search, setSearchValue] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
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
    data: employeesData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.EMPLOYEES(search),
    queryFn: async () => {
      try {
        const timestamp = new Date().getTime();
        
        const response = await api.get(API_ROUTES.USERS.BASE, {
          params: {
            role: "employee",
            search: search || undefined,
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
      } catch (error: any) {
        if (
          error.response?.status === 404 &&
          error.response?.data?.message ===
            "Nenhum usuário com role 'employee' encontrado"
        ) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const employees = useMemo(() => {
    return [...employeesData].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );
  }, [employeesData]);

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
  };
}