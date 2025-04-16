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

interface UseInstitutionsOptions {
  pageSize?: number;
  initialSearch?: string;
  enablePagination?: boolean;
}

export function useInstitutions(options: UseInstitutionsOptions = {}) {
  const {
    pageSize = 10,
    initialSearch = "",
    enablePagination = true
  } = options;
  
  const [search, setSearchValue] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getUserImageUrl } = useUsers();

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setCurrentPage(1);
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.USERS.INSTITUTIONS() 
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
    data: institutionsData = { users: [], pagination: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.INSTITUTIONS(search, currentPage, pageSize),
    queryFn: async () => {
      try {
        const timestamp = new Date().getTime();
        
        const searchParams: Record<string, any> = { 
          role: "institution",
          _t: timestamp
        };
        
        if (enablePagination) {
          searchParams.page = currentPage;
          searchParams.limit = pageSize;
        }
        
        if (search) {
          const cleanSearch = search.trim().replace(/\D/g, '');
          
          if (/^\d{14}$/.test(cleanSearch)) {
            searchParams.cnpj = cleanSearch;
          } else {
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
            "Nenhum usuário com role 'institution' encontrado"
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

  const institutions = useMemo(() => {
    if (Array.isArray(institutionsData.users)) {
      const onlyInstitutions = institutionsData.users.filter((user: User) => user.role === 'institution');
      return [...onlyInstitutions].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    
    return [];
  }, [institutionsData.users]);

  const pagination = useMemo(() => {
    return {
      limit: institutionsData.pagination?.limit || pageSize,
      currentPage: institutionsData.pagination?.page || currentPage,
      totalPages: institutionsData.pagination?.totalPages || 1,
      totalItems: institutionsData.pagination?.total || 0
    };
  }, [institutionsData.pagination, currentPage, pageSize]);

  const navigateToInstitutionDetails = useCallback((id: string) => {
    router.push(`/institutions/${id}`);
  }, [router]);

  const navigateToNewInstitution = useCallback(() => {
    router.push("/institutions/new");
  }, [router]);

  const refreshInstitutionsList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.INSTITUTIONS() });
    await refetch();
  }, [queryClient, refetch]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Função para buscar todas as instituições (sem paginação)
  const fetchAllInstitutions = useCallback(
    async (searchQuery?: string): Promise<User[]> => {
      try {
        const timestamp = new Date().getTime();
        
        const searchParams: Record<string, any> = { 
          role: "institution",
          limit: 100, // Um número grande para pegar todos
          _t: timestamp
        };
        
        if (searchQuery) {
          const cleanSearch = searchQuery.trim().replace(/\D/g, '');
          
          if (/^\d{14}$/.test(cleanSearch)) {
            searchParams.cnpj = cleanSearch;
          } else {
            searchParams.search = searchQuery;
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
        
        if (response.data && Array.isArray(response.data.users)) {
          return response.data.users.filter((user: User) => user.role === 'institution');
        }
        
        return [];
      } catch (error) {
        console.error("Erro ao buscar instituições:", error);
        return [];
      }
    },
    []
  );

  return {
    institutions,
    isLoading,
    error: error ? (error as Error).message : null,
    search,
    setSearch,
    refetch,
    refreshInstitutionsList,
    navigateToInstitutionDetails,
    navigateToNewInstitution,
    getUserImageUrl,
    fetchAllInstitutions,
    limit: pagination.limit,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    setCurrentPage: handlePageChange,
  };
}