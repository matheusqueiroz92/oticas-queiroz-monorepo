"use client";

import { useState, useCallback, useMemo, useRef, useEffect} from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { debounce } from "lodash";

export function useUsers() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const pendingRequests = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const pendingUpdates = useRef<Array<() => void>>([]);

  const getAllUsers = useCallback(async () => {
    if (isMountedRef.current) {
      setIsLoading(true);
    }
    try {
      const response = await api.get(API_ROUTES.USERS.BASE);
      
      const updatedUsersMap = response.data.users.reduce((acc: Record<string, any>, user: any) => {
        acc[user._id] = user;
        return acc;
      }, {});
      
      if (isMountedRef.current) {
        setUsersMap(prevState => ({
          ...prevState,
          ...updatedUsersMap
        }));
      }
      
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
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryClient, toast]);

  const useAllUsersQuery = (options = {}) => {
    return useQuery({
      queryKey: QUERY_KEYS.USERS.ALL,
      queryFn: getAllUsers,
      ...options
    });
  };

  const fetchUserById = useCallback(async (id: string) => {
    const response = await api.get(API_ROUTES.USERS.BY_ID(id));
    return response.data;
  }, []);

  const getUserById = useCallback(async (id: string) => {
    try {
      if (usersMap[id]) {
        return usersMap[id];
      }
      
      const cachedUser = queryClient.getQueryData(QUERY_KEYS.USERS.DETAIL(id));
      if (cachedUser) {
        return cachedUser;
      }
      
      const response = await api.get(API_ROUTES.USERS.BY_ID(id));
      
      if (isMountedRef.current) {
        setUsersMap(prev => ({
          ...prev,
          [id]: response.data
        }));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar usuário"
      );
    }
  }, [queryClient, usersMap]);

  const fetchUsers = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;

    // Filtrar apenas IDs que ainda não estão no cache e não estão sendo processados
    const missingUserIds = userIds.filter(id => {
      if (!id) return false;
      // Verificar se já está sendo processado
      if (pendingRequests.current.has(id)) return false;
      // Verificar se já existe no cache local
      if (usersMap[id]) return false;
      // Verificar se já existe no cache do React Query
      const cachedUser = queryClient.getQueryData(QUERY_KEYS.USERS.DETAIL(id));
      return !cachedUser;
    });

    if (!missingUserIds.length) return;

    // Marcar como pendentes
    missingUserIds.forEach(id => pendingRequests.current.add(id));

    try {
      // Batch das requisições com limite para evitar sobrecarga
      const batchSize = 3; // Reduzido para evitar sobrecarga
      const batches = [];
      
      for (let i = 0; i < missingUserIds.length; i += batchSize) {
        batches.push(missingUserIds.slice(i, i + batchSize));
      }

      // Processar batches sequencialmente para evitar sobrecarga
      for (const batch of batches) {
        const users = await Promise.all(
          batch.map(async (id) => {
            try {
              const user = await fetchUserById(id);
              return user;
            } catch (error) {
              console.warn(`Falha ao buscar usuário ${id}:`, error);
              return null;
            } finally {
              // Remover da lista de pendentes
              pendingRequests.current.delete(id);
            }
          })
        );

        // Filtrar usuários válidos e atualizar o mapa
        const validUsers = users.filter(user => user !== null);
        if (validUsers.length > 0) {
          const updatedUsersMap = validUsers.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
          }, {} as Record<string, any>);

          if (isMountedRef.current) {
            setUsersMap(prevState => ({
              ...prevState,
              ...updatedUsersMap
            }));
          }

          // Atualizar o cache do React Query
          validUsers.forEach(user => {
            queryClient.setQueryData(['users', 'detail', user._id], user);
          });
        }

        // Delay entre batches para evitar sobrecarga
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      // Remover todos os IDs pendentes em caso de erro geral
      missingUserIds.forEach(id => pendingRequests.current.delete(id));
    }
  }, [queryClient, usersMap, fetchUserById]);

  // Versão debounced para evitar chamadas excessivas
  const debouncedFetchUsers = useMemo(
    () => debounce(fetchUsers, 300),
    [fetchUsers]
  );

  // useEffect para gerenciar ciclo de vida do componente
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      pendingUpdates.current = []; // Limpar atualizações pendentes
    };
  }, []);

  // useEffect para processar atualizações pendentes
  useEffect(() => {
    const processUpdates = () => {
      if (isMountedRef.current && pendingUpdates.current.length > 0) {
        const updates = [...pendingUpdates.current];
        pendingUpdates.current = [];
        updates.forEach(update => {
          try {
            update();
          } catch (error) {
            console.warn('Erro ao processar atualização pendente:', error);
          }
        });
      }
    };

    const timeoutId = setTimeout(processUpdates, 0);
    return () => clearTimeout(timeoutId);
  });

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
    
    // Verificar cache do React Query antes de fazer nova requisição
    const cachedUser = queryClient.getQueryData(QUERY_KEYS.USERS.DETAIL(userId));
    if (cachedUser && (cachedUser as any).name) {
      return (cachedUser as any).name;
    }
    
    return "Carregando...";
  }, [usersMap, queryClient]);

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
      if (isMountedRef.current) {
        setUsersMap({});
      }
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

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      const response = await api.put(API_ROUTES.USERS.BY_ID(id), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Atualizar o cache com os novos dados
      queryClient.setQueryData(QUERY_KEYS.USERS.DETAIL(data._id), data);
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.CUSTOMERS() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.EMPLOYEES() });
      
      // Atualizar o mapa de usuários
      if (isMountedRef.current) {
        setUsersMap(prev => ({
          ...prev,
          [data._id]: data
        }));
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao atualizar o usuário",
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
    if (isMountedRef.current) {
      setUsersMap({});
    }
  }, []);

  return {
    getUserById,
    useUserQuery,
    createUserMutation,
    updateUserMutation,
    getUserImageUrl,
    getAllUsers,
    useAllUsersQuery,
    usersMap,
    isLoading,
    fetchUsers,
    debouncedFetchUsers,
    getUserName,
    clearCache
  };
}