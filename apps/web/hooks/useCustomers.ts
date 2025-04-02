"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { useUsers } from "@/hooks/useUsers";
import debounce from 'lodash/debounce';
import { User } from "@/app/types/user";

export function useCustomers() {
  const [search, setSearchValue] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      
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
        const timestamp = new Date().getTime();
        
        const searchParams: Record<string, any> = { 
          role: "customer",
          _t: timestamp
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
    const onlyCustomers = customersData.filter((user: User) => user.role === 'customer');
    
    return [...onlyCustomers].sort((a, b) => 
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