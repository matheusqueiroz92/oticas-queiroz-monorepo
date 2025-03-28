"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState, useCallback, useEffect } from "react";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderLaboratory,
  createOrder,
  getOrdersByClient,
} from "@/app/services/orderService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type { Order } from "@/app/types/order";
import { useUsers } from "@/hooks/useUsers";
import { useLaboratories } from "@/hooks/useLaboratories";
import { formatCurrency, formatDate } from "@/app/utils/formatters";

interface OrderFilters {
  search?: string;
  page?: number;
  status?: string;
  employeeId?: string;
  paymentMethod?: string;
  laboratoryId?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

interface UseOrdersOptions {
  enableQueries?: boolean;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { enableQueries = true } = options;
  const [filters, setFilters] = useState<OrderFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { fetchUsers, getUserName } = useUsers();
  const { getLaboratoryName } = useLaboratories();

  // Gera uma chave de cache para os filtros atuais
  const filterKey = JSON.stringify(filters);

  // Query principal para buscar pedidos
  const {
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.PAGINATED(currentPage, filterKey),
    queryFn: () => getAllOrders({
      ...filters,
      page: currentPage,
      sort: "-createdAt",
    }),
    enabled: enableQueries,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Extraindo dados da query
  const orders = data?.orders || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalOrders = data?.pagination?.total || 0;
  

  // Efeito para buscar os dados de usuários quando os pedidos são carregados
  useEffect(() => {
    if (enableQueries && orders.length > 0) {
      // Extrair os IDs únicos de usuários (clientes e funcionários)
      const userIdsToFetch = [
        ...orders.map(order => typeof order.clientId === 'string' ? order.clientId : '').filter(Boolean),
        ...orders.map(order => typeof order.employeeId === 'string' ? order.employeeId : '').filter(Boolean)
      ];
      
      // Remover duplicatas
      const uniqueUserIds = [...new Set(userIdsToFetch)];
      
      console.log("Buscando dados para usuários:", uniqueUserIds);
      
      // Buscar os dados dos usuários
      if (uniqueUserIds.length > 0) {
        fetchUsers(uniqueUserIds);
      }
    }
  }, [orders, fetchUsers, enableQueries]);

  // Buscar pedidos de um cliente específico
  const useClientOrders = (clientId?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.ORDERS.CLIENT(clientId || ""),
      queryFn: () => getOrdersByClient(clientId || ""),
      enabled: enableQueries && !!clientId,
    });
  };

  // Buscar pedido por ID
  const fetchOrderById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.ORDERS.DETAIL(id),
      queryFn: () => getOrderById(id),
      enabled: enableQueries && !!id,
    });
  };

  // Mutação para atualizar status
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
      });
    }
  });

  // Mutação para atualizar laboratório
  const updateOrderLaboratoryMutation = useMutation({
    mutationFn: ({ id, laboratoryId }: { id: string; laboratoryId: string }) =>
      updateOrderLaboratory(id, laboratoryId),
    onSuccess: () => {
      toast({
        title: "Laboratório atualizado",
        description: "O laboratório do pedido foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar laboratório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o laboratório do pedido.",
      });
    }
  });
   
  // Mutação para criar pedido
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (newOrder) => {
      if (newOrder) {
        toast({
          title: "Pedido criado",
          description: "O pedido foi criado com sucesso.",
        });
   
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
      }
    },
    onError: (error) => {
      console.error("Erro ao criar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o pedido.",
      });
    }
  });
   
  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters: OrderFilters) => {
    console.log('useOrders - updateFilters recebeu:', newFilters);
    
    // Atualiza os filtros no estado
    setFilters(newFilters);
    
    // Reseta a página para 1 ao aplicar novos filtros
    setCurrentPage(1);
    
    // Invalida o cache atual para forçar nova requisição
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.ORDERS.PAGINATED() 
    });
  }, [queryClient]);
   
  // Handlers para ações em pedidos
  const handleUpdateOrderStatus = useCallback((id: string, status: string) => {
    return updateOrderStatusMutation.mutateAsync({ id, status });
  }, [updateOrderStatusMutation]);
   
  const handleUpdateOrderLaboratory = useCallback((id: string, laboratoryId: string) => {
    return updateOrderLaboratoryMutation.mutateAsync({ id, laboratoryId });
  }, [updateOrderLaboratoryMutation]);
   
  const handleCreateOrder = useCallback((orderData: Omit<Order, "_id">) => {
    return createOrderMutation.mutateAsync(orderData);
  }, [createOrderMutation]);
   
  // Funções de navegação
  const navigateToOrderDetails = useCallback((id: string) => {
    router.push(`/orders/${id}`);
  }, [router]);
   
  const navigateToCreateOrder = useCallback(() => {
    router.push("/orders/new");
  }, [router]);
   
  // Função para atualizar manualmente a lista
  const refreshOrdersList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
    await refetch();
  }, [queryClient, refetch]);
   
  // Funções de utilidade
  const translateOrderStatus = useCallback((status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  }, []);
   
  const getOrderStatusClass = useCallback((status: string): string => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
      case "in_production":
        return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
      case "ready":
        return "text-green-600 bg-green-100 px-2 py-1 rounded";
      case "delivered":
        return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
      case "cancelled":
        return "text-red-600 bg-red-100 px-2 py-1 rounded";
      default:
        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
    }
  }, []);
   
  // Funções para obter nomes a partir de IDs
  const getClientName = useCallback((clientId: string) => {
    if (!clientId) return "N/A";
    
    // Limpar o ID se tiver formato ObjectId
    let cleanId = clientId;
    if (typeof clientId === 'string' && clientId.includes('ObjectId')) {
      try {
        const matches = clientId.match(/ObjectId\('([^']+)'\)/);
        if (matches && matches[1]) {
          cleanId = matches[1];
        }
      } catch (err) {
        console.error("Erro ao extrair ID do cliente:", err);
      }
    }
    
    // Buscar o nome do usuário
    const name = getUserName(cleanId);
    
    // Se o nome for "Carregando...", forçar a busca dos dados do usuário
    if (name === "Carregando...") {
      console.log("Buscando dados do cliente:", cleanId);
      fetchUsers([cleanId]);
    }
    
    return name || "Cliente não encontrado";
  }, [getUserName, fetchUsers]);
   
  const getEmployeeName = useCallback((employeeId: string) => {
    if (!employeeId) return "N/A";
    
    // Limpar o ID se tiver formato ObjectId
    let cleanId = employeeId;
    if (typeof employeeId === 'string' && employeeId.includes('ObjectId')) {
      try {
        const matches = employeeId.match(/ObjectId\('([^']+)'\)/);
        if (matches && matches[1]) {
          cleanId = matches[1];
        }
      } catch (err) {
        console.error("Erro ao extrair ID do funcionário:", err);
      }
    }
    
    // Buscar o nome do usuário
    const name = getUserName(cleanId);
    
    // Se o nome for "Carregando...", forçar a busca dos dados do usuário
    if (name === "Carregando...") {
      console.log("Buscando dados do funcionário:", cleanId);
      fetchUsers([cleanId]);
    }
    
    return name || "Funcionário não encontrado";
  }, [getUserName, fetchUsers]);
   
  return {
    orders,
    isLoading,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalOrders,
    filters,
    isCreating: createOrderMutation.isPending,
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    isUpdatingLaboratory: updateOrderLaboratoryMutation.isPending,
   
    setCurrentPage,
    updateFilters,
    fetchOrderById,
    useClientOrders,
    handleUpdateOrderStatus,
    handleUpdateOrderLaboratory,
    handleCreateOrder,
    navigateToOrderDetails,
    navigateToCreateOrder,
    translateOrderStatus,
    getOrderStatusClass,
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    refetch,
    refreshOrdersList,
    formatCurrency,
    formatDate
  };
}