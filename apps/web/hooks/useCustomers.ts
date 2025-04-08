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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setCurrentPage(1);
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
          return { users: [], pagination: {} };
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
      console.log(onlyCustomers);
      return [...onlyCustomers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    
    return [];
  }, [customersData.users]);

  const pagination = useMemo(() => {
    return {
      limit: customersData.pagination?.limit,
      currentPage: customersData.pagination?.page,
      totalPages: customersData.pagination?.totalPages,
      totalItems: customersData.pagination?.total
    };
  }, [customersData.pagination]);

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

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

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