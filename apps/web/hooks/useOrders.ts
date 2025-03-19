"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderLaboratory,
  createOrder,
} from "@/app/services/orderService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type { Order } from "@/app/types/order";

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

  // Função para forçar atualização de todas as queries de pedidos
  const invalidateOrdersCache = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.PAGINATED() });
  };

  // Query para buscar pedidos paginados
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.PAGINATED(currentPage, filters),
    queryFn: () =>
      getAllOrders({
        ...filters,
        page: currentPage,
        sort: "-createdAt",
      } as OrderFilters),
    placeholderData: (prevData) => prevData, // Substitui keepPreviousData
  });

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
    onSuccess: (updatedOrder) => {
      if (updatedOrder) {
        toast({
          title: "Status atualizado",
          description: "O status do pedido foi atualizado com sucesso.",
        });

        // Invalidar queries
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDERS.DETAIL(updatedOrder._id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDERS.PAGINATED(),
        });
      }
      return updatedOrder;
    },
    onError: (error, variables) => {
      console.error(
        `Erro ao atualizar status do pedido ${variables.id}:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
      });
    },
  });

  // Mutation para atualizar laboratório do pedido
  const updateOrderLaboratoryMutation = useMutation({
    mutationFn: ({ id, laboratoryId }: { id: string; laboratoryId: string }) =>
      updateOrderLaboratory(id, laboratoryId),
    onSuccess: (updatedOrder) => {
      if (updatedOrder) {
        toast({
          title: "Laboratório atualizado",
          description: "O laboratório do pedido foi atualizado com sucesso.",
        });

        // Invalidar queries
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDERS.DETAIL(updatedOrder._id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDERS.PAGINATED(),
        });
      }
      return updatedOrder;
    },
    onError: (error, variables) => {
      console.error(
        `Erro ao atualizar laboratório do pedido ${variables.id}:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o laboratório do pedido.",
      });
    },
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

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      }
      return newOrder;
    },
    onError: (error) => {
      console.error("Erro ao criar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Não foi possível criar o pedido.",
      });
    },
  });

  // Função para atualizar filtros
  const updateFilters = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Funções que utilizam as mutations
  const handleUpdateOrderStatus = async (id: string, status: string) => {
    const result = await updateOrderStatusMutation.mutateAsync({ id, status });
    
    // Forçar invalidação do cache após atualizar o status
    if (result) {
      invalidateOrdersCache();
    }
    
    return result;
  };

  const handleUpdateOrderLaboratory = (id: string, laboratoryId: string) => {
    return updateOrderLaboratoryMutation.mutateAsync({ id, laboratoryId });
  };

  const handleCreateOrder = (orderData: Omit<Order, "_id">) => {
    return createOrderMutation.mutateAsync(orderData);
  };

  // Funções de navegação
  const navigateToOrderDetails = (id: string) => {
    router.push(`/orders/${id}`);
  };

  const navigateToCreateOrder = () => {
    router.push("/orders/new");
  };

  // Funções de utilidade
  const translateOrderStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
    };
    return statusMap[status] || status;
  };

  const getOrderStatusClass = (status: string): string => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
      case "in_production":
        return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
      case "ready":
        return "text-green-600 bg-green-100 px-2 py-1 rounded";
      case "delivered":
        return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
      default:
        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
    }
  };

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
    invalidateOrdersCache,
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
    refetch,
  };
}
