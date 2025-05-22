"use client";

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { QUERY_KEYS } from "@/app/_constants/query-keys";

export function useUsers() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const getAllUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(API_ROUTES.USERS.BASE);
      
      const updatedUsersMap = response.data.users.reduce((acc: Record<string, any>, user: any) => {
        acc[user._id] = user;
        return acc;
      }, {});
      
      setUsersMap(prevState => ({
        ...prevState,
        ...updatedUsersMap
      }));
      
      queryClient.setQueryData(QUERY_KEYS.USERS.ALL, response.data);
      
      response.data.users.forEach((user: any) => {
        queryClient.setQueryData(QUERY_KEYS.USERS.DETAIL(user._id), user);
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar todos os usuários:', error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar usuários",
        description: error.response?.data?.message || "Ocorreu um erro ao buscar a lista de usuários",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, toast]);

  const useAllUsersQuery = (options = {}) => {
    return useQuery({
      queryKey: QUERY_KEYS.USERS.ALL,
      queryFn: getAllUsers,
      ...options
    });
  };

  const fetchUserById = async (id: string) => {
    const response = await api.get(API_ROUTES.USERS.BY_ID(id));
    return response.data;
  };

  const getUserById = async (id: string) => {
    try {
      if (usersMap[id]) {
        return usersMap[id];
      }
      
      const cachedUser = queryClient.getQueryData(QUERY_KEYS.USERS.DETAIL(id));
      if (cachedUser) {
        return cachedUser;
      }
      
      const response = await api.get(API_ROUTES.USERS.BY_ID(id));
      
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

  const fetchUsers = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;

    try {
      // Usando Promise.all para carregar todos os usuários simultaneamente
      const users = await Promise.all(userIds.map(id => fetchUserById(id)));
      // Atualiza o mapa de usuários
      const updatedUsersMap = users.reduce((acc, user) => {
        acc[user._id] = user;
        return acc;
      }, {} as Record<string, any>);

      setUsersMap(prevState => ({
        ...prevState,
        ...updatedUsersMap
      }));

      // Opcional: Atualizar o cache do React Query
      users.forEach(user => {
        queryClient.setQueryData(['users', 'detail', user._id], user);
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  }, [queryClient]);

  const useUserQuery = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.USERS.DETAIL(id),
      queryFn: () => getUserById(id),
      enabled: !!id,
    });
  };

  const getUserName = useCallback((userId: string | null | undefined): string => {
    if (!userId) return "Usuário não disponível";
    
    const user = usersMap[userId];
    if (user && user.name) {
      return user.name;
    }
    
    fetchUsers([userId]);
    
    return "Carregando...";
  }, [usersMap, fetchUsers]);

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

  const clearCache = useCallback(() => {
    setUsersMap({});
  }, []);

  return {
    getUserById,
    useUserQuery,
    createUserMutation,
    getUserImageUrl,
    getAllUsers,
    useAllUsersQuery,
    usersMap,
    isLoading,
    fetchUsers,
    getUserName,
    clearCache
  };
}