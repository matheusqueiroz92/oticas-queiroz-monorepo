"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { 
  getAllUsers, 
  getUserById, 
  getCustomers, 
  getEmployees, 
  createUser, 
  updateUser, 
  deleteUser, 
  type UserFilters 
} from "@/app/services/userService";
import debounce from 'lodash/debounce';

interface UseUsersOptions {
  role?: 'customer' | 'employee' | 'all';
  enableQueries?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { role = 'all', enableQueries = true } = options;
  const [filters, setFilters] = useState<UserFilters>({ sort: "name" });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearchValue] = useState("");
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filterKey = JSON.stringify(filters);

  // Processamento de busca com debounce
  const processSearch = useCallback((value: string) => {
    const newFilters: UserFilters = { 
      ...filters,
      search: undefined,
      cpf: undefined,
      sort: "name" 
    };
    
    if (value.trim()) {
      const cleanSearch = value.trim().replace(/\D/g, '');
      
      if (/^\d{11}$/.test(cleanSearch)) {
        newFilters.cpf = cleanSearch;
        newFilters.search = undefined;
      } else {
        newFilters.search = value.trim();
        newFilters.cpf = undefined;
      }
    }
  
    setCurrentPage(1);
    setFilters(newFilters);
  
    const queryKey = role === 'customer' 
      ? QUERY_KEYS.USERS.CUSTOMERS(JSON.stringify(newFilters))
      : role === 'employee'
      ? QUERY_KEYS.USERS.EMPLOYEES(JSON.stringify(newFilters))
      : QUERY_KEYS.USERS.ALL;
    
    queryClient.invalidateQueries({ queryKey });
  }, [filters, queryClient, role]);

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

  // Função principal para buscar usuários com base no role
  const getUsersQuery = useCallback(async () => {
    try {
      const queryParams: UserFilters = {
        ...filters,
        page: currentPage,
        limit: 10,
      };

      let response;
      
      if (role === 'customer') {
        response = await getCustomers(queryParams);
      } else if (role === 'employee') {
        response = await getEmployees(queryParams);
      } else {
        response = await getAllUsers(queryParams);
      }

      // Garantir que o número de usuários retornados não exceda o limite por página
      if (response.users && response.pagination) {
        const limit = response.pagination.limit || 10;
        if (response.users.length > limit) {
          response.users = response.users.slice(0, limit);
        }
      }

      // Atualizar mapa de usuários para consulta rápida
      if (response.users && response.users.length > 0) {
        const updatedUsersMap = response.users.reduce((acc, user) => {
          acc[user._id] = user;
          return acc;
        }, {} as Record<string, any>);

        setUsersMap(prevState => ({
          ...prevState,
          ...updatedUsersMap
        }));
      }

      return response;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }, [currentPage, filters, role]);

  // Query principal para buscar os usuários
  const {
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: role === 'customer' 
      ? QUERY_KEYS.USERS.CUSTOMERS(filterKey) 
      : role === 'employee'
      ? QUERY_KEYS.USERS.EMPLOYEES(filterKey)
      : QUERY_KEYS.USERS.ALL,
    queryFn: getUsersQuery,
    enabled: enableQueries,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const users = data?.users || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalUsers = data?.pagination?.total || 0;

  const customers = useMemo(() => {
    if (role !== 'customer' && role !== 'all') return [];
    return users.filter(user => user.role === 'customer');
  }, [users, role]);

  const employees = useMemo(() => {
    if (role !== 'employee' && role !== 'all') return [];
    return users.filter(user => user.role === 'employee');
  }, [users, role]);

  // Atualizar página e refazer a busca
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    setTimeout(() => {
      refetch();
    }, 0);
  }, [refetch]);

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: UserFilters) => {
    const updatedFilters = {
      ...newFilters,
      sort: newFilters.sort || "name",
      search: newFilters.search !== undefined ? newFilters.search : filters.search,
      cpf: newFilters.cpf !== undefined ? newFilters.cpf : filters.cpf,
    };
    
    setFilters(updatedFilters);
    setCurrentPage(1);
    
    const queryKey = role === 'customer' 
      ? QUERY_KEYS.USERS.CUSTOMERS(JSON.stringify(updatedFilters)) 
      : role === 'employee'
      ? QUERY_KEYS.USERS.EMPLOYEES(JSON.stringify(updatedFilters))
      : QUERY_KEYS.USERS.ALL;
    
    queryClient.invalidateQueries({ queryKey });
    
    setTimeout(() => {
      refetch();
    }, 10);
  }, [filters, queryClient, refetch, role]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    const baseFilters = { sort: "name" };
    setFilters(baseFilters);
    setCurrentPage(1);
    setSearchValue("");
    
    const queryKey = role === 'customer' 
      ? QUERY_KEYS.USERS.CUSTOMERS() 
      : role === 'employee'
      ? QUERY_KEYS.USERS.EMPLOYEES()
      : QUERY_KEYS.USERS.ALL;
    
    queryClient.invalidateQueries({ queryKey });
    
    setTimeout(() => {
      refetch();
    }, 10);
  }, [queryClient, refetch, role]);

  // Recarregar a lista de usuários
  const refreshUsersList = useCallback(async () => {
    const queryKey = role === 'customer' 
      ? QUERY_KEYS.USERS.CUSTOMERS() 
      : role === 'employee'
      ? QUERY_KEYS.USERS.EMPLOYEES()
      : QUERY_KEYS.USERS.ALL;
    
    await queryClient.invalidateQueries({ 
      queryKey,
      refetchType: 'all'
    });
    
    await queryClient.resetQueries({ 
      queryKey
    });
    
    await refetch();
  }, [queryClient, refetch, role]);

  // Query específica para dados de um usuário
  const useUserQuery = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.USERS.DETAIL(id),
      queryFn: () => getUserById(id),
      enabled: enableQueries && !!id,
    });
  };

  // Buscar um usuário específico pelo ID
  const fetchUserById = useCallback(async (id: string) => {
    try {
      if (usersMap[id]) {
        return usersMap[id];
      }
      
      const cachedUser = queryClient.getQueryData(QUERY_KEYS.USERS.DETAIL(id));
      if (cachedUser) {
        return cachedUser;
      }
      
      const userData = await getUserById(id);
      
      if (userData) {
        setUsersMap(prev => ({
          ...prev,
          [id]: userData
        }));
      }
      
      return userData;
    } catch (error) {
      console.error(`Erro ao buscar usuário com ID ${id}:`, error);
      throw error;
    }
  }, [queryClient, usersMap]);

  // Buscar múltiplos usuários por ID
  const fetchUsers = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;

    try {
      const users = await Promise.all(
        userIds.map(id => fetchUserById(id).catch(() => null))
      );
      
      // Atualizar o mapa de usuários com os resultados
      const updatedUsersMap = users.reduce((acc, user) => {
        if (user && user._id) {
          acc[user._id] = user;
        }
        return acc;
      }, {} as Record<string, any>);

      setUsersMap(prevState => ({
        ...prevState,
        ...updatedUsersMap
      }));

      // Atualizar o cache do React Query
      users.forEach(user => {
        if (user && user._id) {
          queryClient.setQueryData(QUERY_KEYS.USERS.DETAIL(user._id), user);
        }
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  }, [fetchUserById, queryClient]);

  // Obter o nome do usuário a partir do mapa de usuários
  const getUserName = useCallback((userId: string | null | undefined): string => {
    if (!userId) return "Usuário não disponível";
    const user = usersMap[userId];
    return user?.name || "Carregando...";
  }, [usersMap]);

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      toast({
        title: "Usuário cadastrado",
        description: "O usuário foi cadastrado com sucesso."
      });

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      
      // Invalidar queries específicas baseadas no papel do usuário
      if (data && data.role === "customer") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.CUSTOMERS(),
        });
      } else if (data && data.role === "employee") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.EMPLOYEES(),
        });
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

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: FormData }) => 
      updateUser(id, userData),
    onSuccess: (data) => {
      toast({
        title: "Usuário atualizado",
        description: "Os dados do usuário foram atualizados com sucesso."
      });

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.USERS.DETAIL(data?._id || "") 
      });
      
      // Invalidar queries específicas baseadas no papel do usuário
      if (data && data.role === "customer") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.CUSTOMERS(),
        });
      } else if (data && data.role === "employee") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.EMPLOYEES(),
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao atualizar os dados do usuário",
      });
    },
  });

  // Mutation para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso."
      });

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      
      if (role === 'customer') {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.CUSTOMERS(),
        });
      } else if (role === 'employee') {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.EMPLOYEES(),
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover usuário",
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao remover o usuário",
      });
    },
  });

  // Funções de navegação
  const navigateToUserDetails = useCallback((id: string) => {
    const route = role === 'customer' 
      ? `/customers/${id}` 
      : role === 'employee'
      ? `/employees/${id}`
      : `/users/${id}`;
    
    router.push(route);
  }, [router, role]);

  const navigateToNewUser = useCallback(() => {
    const route = role === 'customer' 
      ? '/customers/new' 
      : role === 'employee'
      ? '/employees/new'
      : '/users/new';
    
    router.push(route);
  }, [router, role]);

  // Função para obter URL da imagem do usuário
  const getUserImageUrl = useCallback((imagePath?: string): string => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

    if (imagePath.includes("images/users")) {
      return `${baseUrl}/${imagePath.startsWith("/") ? imagePath.substring(1) : imagePath}`;
    }

    return `${baseUrl}/images/users/${imagePath}`;
  }, []);

  // Limpar o cache de usuários
  const clearCache = useCallback(() => {
    setUsersMap({});
  }, []);

  return {
    // Dados
    users,
    customers,
    employees,
    totalPages,
    totalUsers,
    currentPage,
    filters,
    search,
    isLoading,
    error: error ? String(error) : null,
    usersMap,
    
    // Ações
    setSearch,
    setCurrentPage: handlePageChange,
    updateFilters,
    clearFilters,
    refreshUsersList,
    
    // Funções para usuarios específicos
    getUserById: fetchUserById,
    useUserQuery,
    fetchUsers,
    getUserName,
    getUserImageUrl,
    clearCache,
    
    // Navegação
    navigateToUserDetails,
    navigateToNewUser,
    
    // Mutações
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    
    // Aliases específicos para compatibilidade retroativa
    navigateToCustomerDetails: (id: string) => navigateToUserDetails(id),
    navigateToEmployeeDetails: (id: string) => navigateToUserDetails(id),
    navigateToNewCustomer: () => navigateToNewUser(),
    navigateToNewEmployee: () => navigateToNewUser(),
  };
}