"use client";

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";

export function useUsers() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Função para buscar usuário por ID
  const getUserById = async (id: string) => {
    try {
      // Verificar se já temos no cache local
      if (usersMap[id]) {
        return usersMap[id];
      }
      
      // Verificar se está no cache do React Query
      const cachedUser = queryClient.getQueryData(QUERY_KEYS.USERS.DETAIL(id));
      if (cachedUser) {
        return cachedUser;
      }
      
      // Buscar da API
      const response = await api.get(API_ROUTES.USERS.BY_ID(id));
      
      // Atualizar cache local
      setUsersMap(prev => ({
        ...prev,
        [id]: response.data
      }));
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar usuário"
      );
    }
  };

  // Query para buscar um usuário específico
  const useUserQuery = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.USERS.DETAIL(id),
      queryFn: () => getUserById(id),
      enabled: !!id,
    });
  };

  // Função para buscar múltiplos usuários por IDs
  const fetchUsers = useCallback(async (userIds: string[]): Promise<void> => {
    if (!userIds.length) return;
    
    setIsLoading(true);
    
    try {
      // Filtrar apenas IDs que ainda não temos no cache
      const idsToFetch = userIds.filter(id => !usersMap[id]);
      
      if (!idsToFetch.length) {
        setIsLoading(false);
        return;
      }
      
      // Buscar em paralelo
      const userPromises = idsToFetch.map(id => 
        api.get(API_ROUTES.USERS.BY_ID(id))
          .then(response => ({ id, data: response.data }))
          .catch(() => ({ id, data: null }))
      );
      
      const results = await Promise.all(userPromises);
      
      // Atualizar o mapa
      const newEntries = results.reduce((acc, { id, data }) => {
        if (data) {
          acc[id] = data;
          // Também armazenar no cache do React Query
          queryClient.setQueryData(QUERY_KEYS.USERS.DETAIL(id), data);
        }
        return acc;
      }, {} as Record<string, any>);
      
      setUsersMap(prev => ({
        ...prev,
        ...newEntries
      }));
    } catch (error) {
      console.error("Erro ao buscar múltiplos usuários:", error);
    } finally {
      setIsLoading(false);
    }
  }, [usersMap, queryClient]);

  // Função para obter o nome do usuário
  const getUserName = useCallback((userId: string | null | undefined): string => {
    if (!userId) return "Usuário não disponível";
    
    const user = usersMap[userId];
    return user?.name || "Carregando..."; // Retorna "Carregando..." até o nome ser carregado
  }, [usersMap]);

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post(API_ROUTES.AUTH.REGISTER, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const role = variables.get("role") as string;
      toast({
        title:
          role === "customer" ? "Cliente cadastrado" : "Funcionário cadastrado",
        description:
          role === "customer"
            ? "O cliente foi cadastrado com sucesso."
            : "O funcionário foi cadastrado com sucesso.",
      });

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      if (role === "customer") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.CUSTOMERS(),
        });
        router.push("/customers");
      } else {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.EMPLOYEES(),
        });
        router.push("/employees");
      }
      
      // Limpar cache de usuários para forçar recarregamento
      setUsersMap({});
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar usuário",
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao cadastrar o usuário",
      });
    },
  });

  // Função para obter URL da imagem do usuário
  const getUserImageUrl = (imagePath?: string): string => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

    if (imagePath.includes("images/users")) {
      return `${baseUrl}/${imagePath.startsWith("/") ? imagePath.substring(1) : imagePath}`;
    }

    return `${baseUrl}/images/users/${imagePath}`;
  };

  // Função para limpar o cache
  const clearCache = useCallback(() => {
    setUsersMap({});
  }, []);

  return {
    getUserById,
    useUserQuery,
    createUserMutation,
    getUserImageUrl,
    
    // Novas funções para gerenciamento de cache
    usersMap,
    isLoading,
    fetchUsers,
    getUserName,
    clearCache
  };
}