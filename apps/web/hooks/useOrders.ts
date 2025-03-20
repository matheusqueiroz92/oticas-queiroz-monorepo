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
} from "@/app/services/orderService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type { Order } from "@/app/types/order";
import { useUsers } from "@/hooks/useUsers";

interface OrderFilters {
  search?: string;
  page?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

export function useOrders() {
  const [filters, setFilters] = useState<OrderFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { fetchUsers, getUserName } = useUsers();

  // Query para buscar pedidos paginados
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.PAGINATED(currentPage, filters),
    queryFn: () => getAllOrders({
      ...filters,
      page: currentPage,
      sort: "-createdAt",
    }),
  });

  // Efeito para buscar usuários quando os pedidos são carregados
  useEffect(() => {
    if ((data?.orders ?? []).length > 0) {
      // Extrair IDs únicos de clientes e vendedores
      const userIdsToFetch = [...new Set([
        ...(data?.orders ?? []).map(order => typeof order.clientId === 'string' ? order.clientId : ''),
        ...(data?.orders ?? []).map(order => typeof order.employeeId === 'string' ? order.employeeId : '')
      ])].filter(Boolean);
      
      // Buscar usuários
      fetchUsers(userIdsToFetch);
    }
  }, [data, fetchUsers]);

  // Dados normalizados
  const orders = data?.orders || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalOrders = data?.pagination?.total || 0;

  // Custom query para buscar um pedido específico
  const fetchOrderById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.ORDERS.DETAIL(id),
      queryFn: () => getOrderById(id),
      enabled: !!id,
    });
  };

  // Mutation para atualizar status do pedido
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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

  // Mutation para atualizar laboratório do pedido
  const updateOrderLaboratoryMutation = useMutation({
    mutationFn: ({ id, laboratoryId }: { id: string; laboratoryId: string }) =>
      updateOrderLaboratory(id, laboratoryId),
    onSuccess: () => {
      toast({
        title: "Laboratório atualizado",
        description: "O laboratório do pedido foi atualizado com sucesso.",
      });

      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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

  // Mutation para criar pedido
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (newOrder) => {
      if (newOrder) {
        toast({
          title: "Pedido criado",
          description: "O pedido foi criado com sucesso.",
        });

        // Invalidar todas as queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        
        // Navegar para a página de detalhes do novo pedido
        if (newOrder._id) {
          router.push(`/orders/${newOrder._id}`);
        }
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
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  }, []);

  // Funções que utilizam as mutations
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

  // Função para forçar atualização da lista
  const refreshOrdersList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
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

  // Funções específicas para obter nomes
  const getClientName = useCallback((clientId: string) => {
    return getUserName(clientId);
  }, [getUserName]);

  const getEmployeeName = useCallback((employeeId: string) => {
    return getUserName(employeeId);
  }, [getUserName]);

  return {
    // Dados e estado
    orders,
    isLoading,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalOrders,
    filters,

    // Mutações e seus estados
    isCreating: createOrderMutation.isPending,
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    isUpdatingLaboratory: updateOrderLaboratoryMutation.isPending,

    // Ações
    setCurrentPage,
    updateFilters,
    fetchOrderById,
    handleUpdateOrderStatus,
    handleUpdateOrderLaboratory,
    handleCreateOrder,
    navigateToOrderDetails,
    navigateToCreateOrder,
    translateOrderStatus,
    getOrderStatusClass,
    getClientName,
    getEmployeeName,
    refetch,
    refreshOrdersList,
  };
}