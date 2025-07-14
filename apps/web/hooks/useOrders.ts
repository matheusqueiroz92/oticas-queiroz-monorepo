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
  getMyOrders,
} from "@/app/_services/orderService";
import { QUERY_KEYS } from "../app/_constants/query-keys";
import { API_ROUTES } from "@/app/_constants/api-routes";
import type { Order } from "@/app/_types/order";
import { useUsers } from "@/hooks/useUsers";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import debounce from 'lodash/debounce';
import { api } from "@/app/_services/authService";

interface OrderFilters {
  search?: string;
  page?: number;
  status?: string;
  employeeId?: string;
  clientId?: string;
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

interface NextServiceOrderResponse {
  nextServiceOrder: string;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { enableQueries = true } = options;
  const [filters, setFilters] = useState<OrderFilters>({ sort: "-createdAt" });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearchValue] = useState("");

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getUserName } = useUsers();
  
  // Função para obter nome do laboratório com dados populados
  const getLaboratoryName = (id: string | any): string => {
    if (!id) return "N/A";
    
    // Se id já é um objeto populado (tem propriedade name)
    if (typeof id === 'object' && id?.name) {
      return id.name;
    }
    
    // Se chegou aqui, não conseguimos determinar o nome
    return "Laboratório não encontrado";
  };

  const filterKey = JSON.stringify(filters);

  // Query para buscar o próximo serviceOrder
  const {
    data: nextServiceOrderData,
    isLoading: isLoadingNextServiceOrder,
    error: nextServiceOrderError,
    refetch: refetchNextServiceOrder,
  } = useQuery<NextServiceOrderResponse>({
    queryKey: QUERY_KEYS.ORDERS.NEXT_SERVICE_ORDER,
    queryFn: async () => {
      const response = await api.get(API_ROUTES.ORDERS.NEXT_SERVICE_ORDER);
      return response.data;
    },
    enabled: enableQueries,
    staleTime: 1000 * 30, // 30 segundos - dados ficam "frescos" por esse tempo
    gcTime: 1000 * 60 * 5, // 5 minutos no cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Função para buscar manualmente o próximo serviceOrder
  const fetchNextServiceOrder = useCallback(async () => {
    try {
      await refetchNextServiceOrder();
    } catch (error) {
      console.error("Erro ao buscar próximo serviceOrder:", error);
    }
  }, [refetchNextServiceOrder]);

  // Função para obter o valor de exibição do serviceOrder
  const getServiceOrderDisplayValue = useCallback(() => {
    if (isLoadingNextServiceOrder) {
      return "Carregando...";
    }
    
    if (nextServiceOrderError) {
      console.error("Erro ao carregar próximo serviceOrder:", nextServiceOrderError);
      return "Erro ao carregar";
    }
    
    if (nextServiceOrderData?.nextServiceOrder) {
      const serviceOrderNumber = nextServiceOrderData.nextServiceOrder;
      
      // Verificar se o número é válido e >= 300000
      const numberValue = parseInt(serviceOrderNumber);
      if (!isNaN(numberValue) && numberValue >= 300000) {
        return serviceOrderNumber;
      } else {
        console.warn("ServiceOrder inválido recebido:", serviceOrderNumber);
        return "300000"; // Fallback para 300000
      }
    }
    
    return "300000"; // Fallback padrão
  }, [isLoadingNextServiceOrder, nextServiceOrderError, nextServiceOrderData]);

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
      console.log('🔍 useOrders - filters enviados para getAllOrders:', { ...filters, page: currentPage });
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
  
  const { fetchUsers } = useUsers();

  useEffect(() => {
    if (enableQueries && orders.length > 0) {
      const userIdsToFetch = [
        ...orders.map(order => {
          // Se clientId é string, precisa buscar. Se é objeto, já está populado.
          if (typeof order.clientId === 'string') {
            return order.clientId;
          }
          return '';
        }).filter(Boolean),
        ...orders.map(order => {
          // Se employeeId é string, precisa buscar. Se é objeto, já está populado.
          if (typeof order.employeeId === 'string') {
            return order.employeeId;
          }
          return '';
        }).filter(Boolean)
      ];
      
      const uniqueUserIds = [...new Set(userIdsToFetch)];
      
      if (uniqueUserIds.length > 0) {
        // Usar timeout para evitar setState durante render
        setTimeout(() => {
          fetchUsers(uniqueUserIds);
        }, 0);
      }
    }
  }, [orders, enableQueries, fetchUsers]);

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

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(id) });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar pedido:", error);
      
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
   
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
        
        // Atualizar o próximo serviceOrder após criar um pedido
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.NEXT_SERVICE_ORDER });
        fetchNextServiceOrder();
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

  const navigateToOrders = useCallback(() => {
    router.push("/orders");
  }, [router]);
   
  const navigateToOrderDetails = useCallback((id: string) => {
    router.push(`/orders/${id}`);
  }, [router]);

  const navigateToEditOrder = useCallback((id: string) => {
    router.push(`/orders/${id}/edit`);
  }, [router]);
   
  const navigateToCreateOrder = useCallback(() => {
    router.push("/orders/new");
  }, [router]);

  const navigateToMyOrders = useCallback(() => {
    router.push("/my-orders");
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
   
  const getClientName = useCallback((clientId: string | any) => {
    if (!clientId) return "N/A";
    
    // Se clientId já é um objeto populado (tem propriedade name)
    if (typeof clientId === 'object' && clientId?.name) {
      return clientId.name;
    }
    
    // Se é uma string, tentar buscar via getUserName apenas como fallback
    if (typeof clientId === 'string') {
      let cleanId = clientId;
      if (clientId.includes('ObjectId')) {
        try {
          const matches = clientId.match(/ObjectId\('([^']+)'\)/);
          if (matches && matches[1]) {
            cleanId = matches[1];
          }
        } catch (err) {
          console.error("Erro ao extrair ID do cliente:", err);
          return "Cliente não encontrado";
        }
      }
      
      // Como agora estamos usando populate, este cenário só deve acontecer em casos excepcionais
      const name = getUserName(cleanId);
      
      // Se retornou "Carregando...", mostrar um fallback mais adequado
      if (name === "Carregando...") {
        return "Cliente"; // Fallback mais amigável
      }
      
      return name || "Cliente não encontrado";
    }
    
    return "Cliente não encontrado";
  }, [getUserName]);
   
  const getEmployeeName = useCallback((employeeIdOrOrder: string | any) => {
    // Se recebeu um objeto (pedido completo), verificar se tem employeeId populado
    if (typeof employeeIdOrOrder === 'object' && employeeIdOrOrder?.employeeId) {
      // Se employeeId é um objeto populado com name
      if (typeof employeeIdOrOrder.employeeId === 'object' && employeeIdOrOrder.employeeId?.name) {
        return employeeIdOrOrder.employeeId.name;
      }
      
      // Se employeeId é uma string, tentar buscar via getUserName
      if (typeof employeeIdOrOrder.employeeId === 'string') {
        const name = getUserName(employeeIdOrOrder.employeeId);
        return name || "Carregando...";
      }
    }
    
    // Se recebeu um objeto (pedido completo), usar dados normalizados
    if (typeof employeeIdOrOrder === 'object' && employeeIdOrOrder?._normalized?.employeeName) {
      return employeeIdOrOrder._normalized.employeeName;
    }
    
    // Se recebeu um objeto employeeId populado diretamente
    if (typeof employeeIdOrOrder === 'object' && employeeIdOrOrder?.name) {
      return employeeIdOrOrder.name;
    }
    
    // Se é uma string (ID), tentar buscar via getUserName
    if (typeof employeeIdOrOrder === 'string') {
      if (!employeeIdOrOrder) return "N/A";
      
      let cleanId = employeeIdOrOrder;

      if (employeeIdOrOrder.includes('ObjectId')) {
        try {
          const matches = employeeIdOrOrder.match(/ObjectId\('([^']+)'\)/);
          if (matches && matches[1]) {
            cleanId = matches[1];
          }
        } catch (err) {
          console.error("Erro ao extrair ID do funcionário:", err);
        }
      }
      
      // Tentar buscar nome via getUserName, mas se falhar, não mostrar erro
      try {
        const name = getUserName(cleanId);
        
        // Se retornou "Carregando...", mostrar um fallback mais adequado
        if (name === "Carregando...") {
          return "Vendedor"; // Fallback mais amigável
        }
        
        return name || "Vendedor";
      } catch (error) {
        console.log(error);
        // Para clientes, getUserName pode falhar devido a permissões
        return "Vendedor";
      }
    }
    
    return "Vendedor";
  }, [getUserName]);

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
   
  // Hook para buscar pedidos do cliente logado
  const useMyOrders = useCallback(() => {
    return useQuery({
      queryKey: QUERY_KEYS.ORDERS.MY_ORDERS,
      queryFn: () => getMyOrders(),
      enabled: enableQueries,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      retry: 1,
    });
  }, [enableQueries]);

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
    useMyOrders,
    handleUpdateOrder,
    handleUpdateOrderStatus,
    handleUpdateOrderLaboratory,
    handleCreateOrder,
    navigateToOrders,
    navigateToOrderDetails,
    navigateToEditOrder,
    navigateToCreateOrder,
    navigateToMyOrders,
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
    fetchOrderComplementaryDetails,
    
    // Funcionalidades do próximo serviceOrder
    nextServiceOrder: nextServiceOrderData?.nextServiceOrder || null,
    isLoadingNextServiceOrder,
    nextServiceOrderError: nextServiceOrderError ? String(nextServiceOrderError) : null,
    fetchNextServiceOrder,
    getServiceOrderDisplayValue,
  };
}