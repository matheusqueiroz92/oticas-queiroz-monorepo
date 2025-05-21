"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderLaboratory,
  createOrder,
  getOrdersByClient,
  updateOrder,
} from "@/app/services/orderService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type { Order } from "@/app/types/order";
import { useUsers } from "@/hooks/useUsers";
import { useLaboratories } from "@/hooks/useLaboratories";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import debounce from 'lodash/debounce';
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";

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
  serviceOrder?: string;
  cpf?: string;
}

interface UseOrdersOptions {
  enableQueries?: boolean;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { enableQueries = true } = options;
  const [filters, setFilters] = useState<OrderFilters>({ sort: "-createdAt" });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearchValue] = useState("");

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { fetchUsers, getUserName } = useUsers();
  const { getLaboratoryName } = useLaboratories();

  const filterKey = JSON.stringify(filters);

  const processSearch = useCallback((value: string) => {
    const newFilters: OrderFilters = { 
      ...filters,
      search: undefined,
      cpf: undefined,
      serviceOrder: undefined,
      sort: "-createdAt" 
    };
    
    if (value.trim()) {
      const cleanSearch = value.trim().replace(/\D/g, '');
      
      if (/^\d{11}$/.test(cleanSearch)) {
        newFilters.cpf = cleanSearch;
        newFilters.search = undefined;
        newFilters.serviceOrder = undefined;
      } 
      else if (/^\d{4,7}$/.test(cleanSearch)) {
        newFilters.serviceOrder = cleanSearch;
        newFilters.search = undefined;
        newFilters.cpf = undefined;
      } 
      else {
        newFilters.search = value.trim();
        newFilters.cpf = undefined;
        newFilters.serviceOrder = undefined;
      }
    }
  
    setCurrentPage(1);
    setFilters(newFilters);
  
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.ORDERS.PAGINATED(1, JSON.stringify(newFilters))
    });
  }, [filters, queryClient]);

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

  const {
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.PAGINATED(currentPage, filterKey),
    queryFn: async () => {
      return await getAllOrders({
        ...filters,
        page: currentPage,
      });
    },
    enabled: enableQueries,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const orders = data?.orders || [];
  
  const totalPages = data?.pagination?.totalPages || 1;
  const totalOrders = data?.pagination?.total || 0;
  
  useEffect(() => {
    if (enableQueries && orders.length > 0) {
      const userIdsToFetch = [
        ...orders.map(order => typeof order.clientId === 'string' ? order.clientId : '').filter(Boolean),
        ...orders.map(order => typeof order.employeeId === 'string' ? order.employeeId : '').filter(Boolean)
      ];
      
      const uniqueUserIds = [...new Set(userIdsToFetch)];
      
      if (uniqueUserIds.length > 0) {
        fetchUsers(uniqueUserIds);
      }
    }
  }, [orders, fetchUsers, enableQueries]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    setTimeout(() => {
      refetch();
    }, 0);
  }, [refetch]);

  const updateFilters = useCallback((newFilters: OrderFilters) => {
    const updatedFilters = {
      ...newFilters,
      sort: "-createdAt",
      search: newFilters.search !== undefined ? newFilters.search : filters.search,
      cpf: newFilters.cpf !== undefined ? newFilters.cpf : filters.cpf,
      serviceOrder: newFilters.serviceOrder !== undefined ? newFilters.serviceOrder : filters.serviceOrder,
    };
    
    setFilters(updatedFilters);
    
    setCurrentPage(1);
    
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.ORDERS.PAGINATED(1, JSON.stringify(updatedFilters))
    });
    
    setTimeout(() => {
      refetch();
    }, 10);
  }, [filters, queryClient, refetch]);

  const clearFilters = useCallback(() => {
    const baseFilters = { sort: "-createdAt" };
    setFilters(baseFilters);
    setCurrentPage(1);
    setSearchValue("");
    
    queryClient.invalidateQueries({ 
      queryKey: [QUERY_KEYS.ORDERS.ALL]
    });
    
    setTimeout(() => {
      refetch();
    }, 10);
  }, [queryClient, refetch]);
   
  const refreshOrdersList = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: [QUERY_KEYS.ORDERS.ALL],
      refetchType: 'all'
    });
    
    await queryClient.resetQueries({ 
      queryKey: [QUERY_KEYS.ORDERS.ALL]
    });
    
    await refetch();
  }, [queryClient, refetch]);

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
      staleTime: 0,
      refetchOnMount: true,
    });
  };

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, orderData }: { id: string, orderData: Partial<Order> }) => {
      try {
        // Use the service function instead of directly calling the API
        return await updateOrder(id, orderData);
      } catch (error) {
        console.error(`Error updating order ${id}:`, error);
        throw error;
      }
    },
    onSuccess: (data, { id }) => {
      toast({
        title: "Pedido atualizado",
        description: `O pedido #${id.substring(0, 8)} foi atualizado com sucesso.`,
      });

      // Invalidate multiple related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(id) });
      
      // Refresh dashboard stats if they exist
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar pedido:", error);
      
      // Display more specific error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Não foi possível atualizar o pedido.";
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar pedido",
        description: errorMessage,
      });
    }
  });

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
    onError: (error: any) => {
      console.error("Erro ao atualizar status:", error);
      let errorMessage = "Não foi possível atualizar o status do pedido.";
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
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

  const handleUpdateOrder = useCallback(async (id: string, orderData: Partial<Order>) => {
    if (!id || typeof id !== 'string') {
      throw new Error("ID do pedido inválido");
    }
    
    if (!orderData.clientId || !orderData.products || orderData.products.length === 0) {
      throw new Error("Dados do pedido incompletos");
    }
    
    return updateOrderMutation.mutateAsync({ id, orderData });
  }, [updateOrderMutation]);
   
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

  const navigateToEditOrder = useCallback((id: string) => {
    router.push(`/orders/${id}/edit`);
  }, [router]);
   
  const navigateToCreateOrder = useCallback(() => {
    router.push("/orders/new");
  }, [router]);
   
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

  const getStatusBadge = useCallback((status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-800",
      },
      in_production: {
        label: "Em Produção",
        className: "bg-blue-100 text-blue-800",
      },
      ready: { 
        label: "Pronto", 
        className: "bg-green-100 text-green-800" 
      },
      delivered: {
        label: "Entregue",
        className: "bg-purple-100 text-purple-800",
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-red-100 text-red-800",
      },
    };

    return statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
  }, []);

  const getPaymentStatusBadge = useCallback((paymentStatus: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pendente",
        className: "bg-red-100 text-red-800",
      },
      partially_paid: { 
        label: "Pago parcialmente",
        className: "bg-yellow-100 text-yellow-800" 
      },
      paid: {
        label: "Pago",
        className: "bg-green-100 text-green-800",
      },
    };

    return statusMap[paymentStatus] || {
      label: paymentStatus,
      className: "bg-gray-100 text-gray-800",
    };
  }, []);

  const getPaymentMethodText = useCallback((method?: string) => {
    if (!method) return "N/A";

    const methodMap: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      installment: "Parcelado",
    };

    return methodMap[method] || method;
  }, []);

  const getProductTypeLabel = useCallback((type?: string): string => {
    const types: Record<string, string> = {
      lenses: "Lentes",
      clean_lenses: "Limpa-lentes",
      prescription_frame: "Armação de grau",
      sunglasses_frame: "Armação solar"
    };
    
    if (!type) return "Não especificado";
    return types[type] || type;
  }, []);
   
  const getClientName = useCallback((clientId: string) => {
    if (!clientId) return "N/A";
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
    const name = getUserName(cleanId);

    if (name === "Carregando...") {
      fetchUsers([cleanId]);
    }
    
    return name || "Cliente não encontrado";
  }, [getUserName, fetchUsers]);
   
  const getEmployeeName = useCallback((employeeId: string) => {
    if (!employeeId) return "N/A";
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
    const name = getUserName(cleanId);
    
    if (name === "Carregando...") {
      fetchUsers([cleanId]);
    }
    
    return name || "Funcionário não encontrado";
  }, [getUserName, fetchUsers]);

  const fetchOrderComplementaryDetails = useCallback(async (order: Order) => {
    if (!order) return { client: null, employee: null, laboratoryInfo: null };
    
    try {
      const results = {
        client: null,
        employee: null,
        laboratoryInfo: null
      };
      
      if (typeof order.clientId === "string") {
        try {
          const response = await api.get(API_ROUTES.USERS.BY_ID(order.clientId));
          results.client = response.data;
        } catch (clientError) {
          console.error("Erro ao buscar cliente:", clientError);
        }
      } else if (typeof order.clientId === "object" && order.clientId !== null) {
        results.client = order.clientId;
      }

      if (typeof order.employeeId === "string") {
        try {
          const response = await api.get(API_ROUTES.USERS.BY_ID(order.employeeId));
          results.employee = response.data;
        } catch (employeeError) {
          console.error("Erro ao buscar funcionário:", employeeError);
        }
      } else if (typeof order.employeeId === "object" && order.employeeId !== null) {
        results.employee = order.employeeId;
      }

      if (order.laboratoryId) {
        try {
          if (typeof order.laboratoryId === "string") {
            const labResponse = await api.get(API_ROUTES.LABORATORIES.BY_ID(order.laboratoryId));
            results.laboratoryInfo = labResponse.data;
          } else if (typeof order.laboratoryId === "object" && order.laboratoryId !== null) {
            results.laboratoryInfo = order.laboratoryId;
          }
        } catch (labError) {
          console.error("Erro ao buscar laboratório:", labError);
        }
      }
      
      return results;
    } catch (error) {
      console.error("Erro ao buscar detalhes complementares:", error);
      return { client: null, employee: null, laboratoryInfo: null };
    }
  }, []);

  useEffect(() => {
    if (!filters.sort) {
      setFilters(prev => ({ ...prev, sort: "-createdAt" }));
    }
  }, []);
   
  return {
    orders,
    isLoading,
    isUpdating: updateOrderMutation.isPending,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalOrders,
    filters,
    search,
    setSearch,
    clearFilters,
    isCreating: createOrderMutation?.isPending,
    isUpdatingStatus: updateOrderStatusMutation?.isPending,
    isUpdatingLaboratory: updateOrderLaboratoryMutation?.isPending,
   
    setCurrentPage: handlePageChange,
    updateFilters,
    fetchOrderById,
    useClientOrders,
    handleUpdateOrder,
    handleUpdateOrderStatus,
    handleUpdateOrderLaboratory,
    handleCreateOrder,
    navigateToOrderDetails,
    navigateToEditOrder,
    navigateToCreateOrder,
    translateOrderStatus,
    getOrderStatusClass,
    getStatusBadge,
    getPaymentStatusBadge,
    getPaymentMethodText,
    getProductTypeLabel,
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    refetch,
    refreshOrdersList,
    formatCurrency,
    formatDate,
    fetchOrderComplementaryDetails
  };
}