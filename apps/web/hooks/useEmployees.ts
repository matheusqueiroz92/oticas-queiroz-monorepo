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

  // Função debounce para a busca
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      console.log("Executando debounced search para funcionários:", value);
      
      // Invalidar o cache atual para forçar nova requisição
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.USERS.EMPLOYEES() 
      });
    }, 300),
    [queryClient]
  );

  // Função para atualizar o termo de busca
  const setSearch = useCallback((value: string) => {
    console.log("Valor de busca de funcionários alterado:", value);
    
    // Atualizar o estado visual imediatamente
    setSearchValue(value);
    
    // Cancelar o debounce anterior se existir
    if (debouncedSearch.cancel) {
      debouncedSearch.cancel();
    }
    
    // Aplicar o debounce para a chamada da API
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  // Limpar debounce ao desmontar
  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // Query para listar todos os funcionários
  const {
    data: employees = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.EMPLOYEES(search),
    queryFn: async () => {
      try {
        console.log("Buscando funcionários com termo:", search);
        
        // Adicionar timestamp para evitar cache
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
        
        console.log("Resposta da busca de funcionários:", response.data.length, "resultados");
        return response.data;
      } catch (error: any) {
        // Se for um erro 404 específico de "nenhum funcionário encontrado", retorna array vazio
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

  // Funções de navegação
  const navigateToEmployeeDetails = useCallback((id: string) => {
    router.push(`/employees/${id}`);
  }, [router]);

  const navigateToNewEmployee = useCallback(() => {
    router.push("/employees/new");
  }, [router]);

  // Função para atualizar manualmente a lista
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