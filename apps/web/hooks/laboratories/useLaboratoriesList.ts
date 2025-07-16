"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllLaboratories } from "@/app/_services/laboratoryService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import debounce from 'lodash/debounce';

interface UseLaboratoriesListOptions {
  pageSize?: number;
  initialSearch?: string;
  enablePagination?: boolean;
}

interface LaboratoryFilters {
  search?: string;
  page?: number;
  isActive?: boolean;
  city?: string;
  sort?: string;
  limit?: number;
}

export function useLaboratoriesList(options: UseLaboratoriesListOptions = {}) {
  const {
    pageSize = 10,
    initialSearch = "",
  } = options;
  
  const [search, setSearchValue] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LaboratoryFilters>({ 
    sort: "name",
    limit: pageSize 
  });
  const router = useRouter();
  const queryClient = useQueryClient();

  // Função para processar busca
  const processSearch = useCallback((value: string) => {
    setFilters(prevFilters => {
      const newFilters: LaboratoryFilters = { 
        ...prevFilters,
        search: value.trim() || undefined,
        sort: "name"
      };
      
      return newFilters;
    });
  
    setCurrentPage(1);
  
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.LABORATORIES.PAGINATED() 
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
  const updateFilters = useCallback((newFilters: LaboratoryFilters) => {
    setFilters(prevFilters => ({
      ...newFilters,
      sort: "name",
      search: newFilters.search !== undefined ? newFilters.search : prevFilters.search,
      limit: pageSize
    }));
    
    setCurrentPage(1);
    
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.LABORATORIES.PAGINATED()
    });
  }, [queryClient, pageSize]);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    const baseFilters = { sort: "name", limit: pageSize };
    setFilters(baseFilters);
    setCurrentPage(1);
    setSearchValue("");
    
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.LABORATORIES.PAGINATED()
    });
  }, [queryClient, pageSize]);

  // Função para contar filtros ativos
  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.isActive !== undefined) count++;
    if (filters.city) count++;
    return count;
  }, [filters]);

  // Query principal para buscar laboratórios com filtros
  const {
    data: laboratoriesData = { laboratories: [], pagination: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(currentPage, filters),
    queryFn: async () => {
      try {
        const searchParams: Record<string, any> = { 
          page: currentPage,
          limit: pageSize
        };
        
        // Aplicar filtros
        if (filters.search) {
          searchParams.search = filters.search;
        }
        
        if (filters.isActive !== undefined) {
          searchParams.isActive = filters.isActive;
        }
        
        if (filters.city) {
          searchParams.city = filters.city;
        }
        
        if (filters.sort) {
          searchParams.sort = filters.sort;
        }

        return await getAllLaboratories(searchParams);
      } catch (error: any) {
        console.error("❌ Erro ao buscar laboratórios:", error);
        
        if (error.response?.status === 404) {
          return { laboratories: [], pagination: {} };
        }
        
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const laboratories = useMemo(() => {
    return laboratoriesData.laboratories || [];
  }, [laboratoriesData.laboratories]);

  const pagination = useMemo(() => {
    const paginationData = laboratoriesData.pagination as any;
    return {
      limit: paginationData?.limit || pageSize,
      currentPage: paginationData?.page || currentPage,
      totalPages: paginationData?.totalPages || 1,
      totalItems: paginationData?.total || laboratories.length
    };
  }, [laboratoriesData.pagination, pageSize, currentPage, laboratories.length]);

  const navigateToLaboratoryDetails = useCallback((id: string) => {
    router.push(`/laboratories/${id}`);
  }, [router]);

  const refreshLaboratoriesList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LABORATORIES.PAGINATED() });
    await refetch();
  }, [queryClient, refetch]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const showEmptyState = !isLoading && !error && laboratories.length === 0;

  return {
    laboratories,
    isLoading,
    error: error ? (error as Error).message : null,
    search,
    showEmptyState,
    setSearch,
    refetch,
    refreshLaboratoriesList,
    navigateToLaboratoryDetails,
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