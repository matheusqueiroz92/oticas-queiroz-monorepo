"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { useUsers } from "@/hooks/useUsers";
import debounce from 'lodash/debounce';

export function useCustomers() {
  const [search, setSearchValue] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      console.log("Executando debounced search para clientes:", value);
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.USERS.CUSTOMERS() 
      });
    }, 300),
    [queryClient]
  );

  const setSearch = useCallback((value: string) => {
    console.log("Valor de busca de clientes alterado:", value);

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
    data: customersData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.CUSTOMERS(search),
    queryFn: async () => {
      try {
        console.log("Buscando clientes com termo:", search);
        
        const timestamp = new Date().getTime();
        
        const response = await api.get(API_ROUTES.USERS.CUSTOMERS, {
          params: { 
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
        
        console.log("Resposta da busca de clientes:", response.data.length, "resultados");
        return response.data;
      } catch (error: any) {
        if (
          error.response?.status === 404 &&
          error.response?.data?.message ===
            "Nenhum usuário com role 'customer' encontrado"
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

  const customers = useMemo(() => {
    return [...customersData].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );
  }, [customersData]);

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
  };
}