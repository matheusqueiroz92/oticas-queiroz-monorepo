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

interface OrderFilters {
  search?: string;
  page?: number;
  statuses?: string[];
  employeeIds?: string[];
  paymentMethods?: string[];
  laboratoryIds?: string[];
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

  const filterKey = JSON.stringify(filters);

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

  useEffect(() => {
    if (enableQueries && (data?.orders ?? []).length > 0) {
      // Buscar IDs únicos de usuários
      const userIdsToFetch = [
        ...(data?.orders ? data.orders.map(order => {
          let clientId = order.clientId;
          // Se for uma string, mas parecer um objeto JSON
          if (typeof clientId === 'string' && clientId.includes('ObjectId')) {
            try {
              // Extrai apenas o ID do ObjectId
              const matches = clientId.match(/ObjectId\('([^']+)'\)/);
              if (matches && matches[1]) {
                return matches[1];
              }
            } catch (err) {
              console.error("Erro ao extrair ID do cliente:", err);
            }
          }
          // Se for um objeto
          if (typeof clientId === 'object' && clientId && '_id' in (clientId as { _id: string })) {
            return (clientId as { _id: string })._id;
          }
          // Se for apenas uma string de ID
          return clientId;
        }).filter(Boolean) : []),
        
        ...(data?.orders ? data.orders.map(order => {
          let employeeId = order.employeeId;
          // Se for uma string, mas parecer um objeto JSON
          if (typeof employeeId === 'string' && employeeId.includes('ObjectId')) {
            try {
              // Extrai apenas o ID do ObjectId
              const matches = employeeId.match(/ObjectId\('([^']+)'\)/);
              if (matches && matches[1]) {
                return matches[1];
              }
            } catch (err) {
              console.error("Erro ao extrair ID do funcionário:", err);
            }
          }
          // Se for um objeto
          if (typeof employeeId === 'object' && employeeId && '_id' in (employeeId as { _id: string })) {
            return (employeeId as { _id: string })._id;
          }
          // Se for apenas uma string de ID
          return employeeId;
        }).filter(Boolean) : [])
      ];
      
      // Verifica se há usuários para buscar
      if (userIdsToFetch.length > 0) {
        fetchUsers(userIdsToFetch);  // Passamos apenas os IDs para a função fetchUsers
      }
    }
  }, [data, fetchUsers, enableQueries]);
  
  const orders = data?.orders || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalOrders = data?.pagination?.total || 0;

  const useClientOrders = (clientId?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.ORDERS.CLIENT(clientId || ""),
      queryFn: () => getOrdersByClient(clientId || ""),
      enabled: enableQueries && !!clientId,
    });
  };

  const fetchOrderById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.ORDERS.DETAIL(id),
      queryFn: () => getOrderById(id),
      enabled: enableQueries && !!id,
    });
  };

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });

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

  const updateOrderLaboratoryMutation = useMutation({
    mutationFn: ({ id, laboratoryId }: { id: string; laboratoryId: string }) =>
      updateOrderLaboratory(id, laboratoryId),
    onSuccess: () => {
      toast({
        title: "Laboratório atualizado",
        description: "O laboratório do pedido foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar laboratório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o laboratório do pedido.",});
      }
    });
   
    const createOrderMutation = useMutation({
      mutationFn: createOrder,
      onSuccess: (newOrder) => {
        if (newOrder) {
          toast({
            title: "Pedido criado",
            description: "O pedido foi criado com sucesso.",
          });
   
          queryClient.invalidateQueries({ queryKey: ['orders'] });
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
   
    const updateFilters = useCallback((newFilters: OrderFilters) => {
      console.log('useOrders - updateFilters recebeu:', newFilters);
      
      setFilters(newFilters);
      
      setCurrentPage(1);
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.ORDERS.PAGINATED() 
      });
    }, [queryClient]);
   
    const handleUpdateOrderStatus = useCallback((id: string, status: string) => {
      return updateOrderStatusMutation.mutateAsync({ id, status });
    }, [updateOrderStatusMutation]);
   
    const handleUpdateOrderLaboratory = useCallback((id: string, laboratoryId: string) => {
      return updateOrderLaboratoryMutation.mutateAsync({ id, laboratoryId });
    }, [updateOrderLaboratoryMutation]);
   
    const handleCreateOrder = useCallback((orderData: Omit<Order, "_id">) => {
      return createOrderMutation.mutateAsync(orderData);
    }, [createOrderMutation]);
   
    const navigateToOrderDetails = useCallback((id: string) => {
      router.push(`/orders/${id}`);
    }, [router]);
   
    const navigateToCreateOrder = useCallback(() => {
      router.push("/orders/new");
    }, [router]);
   
    const refreshOrdersList = useCallback(async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await refetch();
    }, [queryClient, refetch]);
   
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
   
    const getClientName = useCallback((clientId: string) => {
      if (typeof clientId === 'string' && clientId.includes('ObjectId')) {
        try {
          const matches = clientId.match(/ObjectId\('([^']+)'\)/);
          if (matches && matches[1]) {
            clientId = matches[1];
          }
        } catch (err) {
          console.error("Erro ao extrair ID do cliente:", err);
        }
      }
      
      const getName = getUserName(clientId);
      return getName;
    }, [getUserName]);
   
    const getEmployeeName = useCallback((employeeId: string) => {
      if (typeof employeeId === 'string' && employeeId.includes('ObjectId')) {
        try {
          const matches = employeeId.match(/ObjectId\('([^']+)'\)/);
          if (matches && matches[1]) {
            employeeId = matches[1];
          }
        } catch (err) {
          console.error("Erro ao extrair ID do funcionário:", err);
        }
      }
      
      const getName = getUserName(employeeId);
      return getName;
    }, [getUserName]);
   
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
    };
   }