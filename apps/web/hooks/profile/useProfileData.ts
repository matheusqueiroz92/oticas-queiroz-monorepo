"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useProfile } from "@/hooks/profile/useProfile";
import { useOrders } from "@/hooks/orders/useOrders";
import { useQuery } from "@tanstack/react-query";
import { getAllOrders, getOrdersByClient, getMyOrders } from "@/app/_services/orderService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import {
  calculateUserSales,
  countCompletedOrders,
  countUniqueCustomers,
  calculateMembershipDuration,
  getCustomerStatus,
  calculateUserRating,
  calculateOrdersGrowth,
  getPreviousMonthOrders,
  generateStarRating,
} from "@/app/_utils/profile-utils";

export function useProfileData() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  const {
    profile: user,
    isLoadingProfile: loading,
    isUpdatingProfile,
    handleUpdateProfile,
    refetchProfile,
    getUserImageUrl,
  } = useProfile();

  // Obter dados do usuário logado via cookies (igual à página "Meus Pedidos")
  const [loggedUserId, setLoggedUserId] = useState<string>("");
  const [loggedUserRole, setLoggedUserRole] = useState<string>("");

  // Carregar dados do usuário logado dos cookies
  useEffect(() => {
    const userId = Cookies.get("userId");
    const userRole = Cookies.get("role");
    
    if (userId) setLoggedUserId(userId);
    if (userRole) setLoggedUserRole(userRole);
  }, []);

  // Usar useOrders normalmente (como funcionava antes)
  const {
    orders,
    isLoading: isLoadingOrders,
    filters,
    updateFilters,
    getClientName,
  } = useOrders();

  // Hook específico para buscar pedidos do cliente logado
  const {
    data: myOrders,
    isLoading: isLoadingMyOrders,
    error: myOrdersError,
  } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.MY_ORDERS,
    queryFn: () => getMyOrders(),
    enabled: !!loggedUserId && loggedUserRole === "customer",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Aplicar filtro automático baseado no tipo de usuário (IGUAL à página "Meus Pedidos")
  useEffect(() => {
    if (loggedUserId && loggedUserRole) {
      let shouldUpdate = false;
      let newFilters = { ...filters };

      const isCustomer = loggedUserRole === "customer";
      const isEmployee = loggedUserRole === "employee" || loggedUserRole === "admin";

      if (isCustomer) {
        // Para clientes: filtrar por clientId
        if (!filters.clientId || filters.clientId !== loggedUserId) {
          newFilters.clientId = loggedUserId;
          shouldUpdate = true;
        }
        if (filters.employeeId) {
          delete newFilters.employeeId;
          shouldUpdate = true;
        }
      } else if (isEmployee) {
        // Para funcionários: filtrar por employeeId
        if (!filters.employeeId || filters.employeeId !== loggedUserId) {
          newFilters.employeeId = loggedUserId;
          shouldUpdate = true;
        }
        if (filters.clientId) {
          delete newFilters.clientId;
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        updateFilters(newFilters);
      }
    }
  }, [loggedUserId, loggedUserRole, filters, updateFilters]);

  // Query adicional para buscar TODOS os pedidos para estatísticas precisas
  const {
    data: allUserOrdersForStats,
  } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.PROFILE_ALL(loggedUserId, loggedUserRole),
    queryFn: async () => {
      if (!loggedUserId || !loggedUserRole) return [];

      if (loggedUserRole === "customer") {
        // Para clientes: usar a função específica que retorna todos os pedidos do cliente
        const orders = await getOrdersByClient(loggedUserId);
        return orders || [];
      } else {
        // Para funcionários/admins: buscar todos os pedidos com limite alto e filtro por employeeId
        const result = await getAllOrders({
          employeeId: loggedUserId,
          limit: 10000, // Limite alto para pegar todos os pedidos
          sort: "-createdAt"
        });
        return result.orders || [];
      }
    },
    enabled: !!loggedUserId && !!loggedUserRole,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Calcular dados do perfil baseados em dados reais
  const profileData = useMemo(() => {
    if (!user) {
      return {
        userOrders: [],
        userOrdersForDisplay: [],
        totalSales: 0,
        totalSalesAllTime: 0,
        ordersCompleted: 0,
        ordersCompletedAllTime: 0,
        customersServed: 0,
        customersServedAllTime: 0,
        membershipDuration: "< 1 ano",
        customerStatus: "Bronze",
        userRating: 4.0,
        ordersGrowth: 0,
        starRating: "★★★★☆",
      };
    }

    // Para exibição: escolher a fonte correta dependendo do tipo de usuário
    let userOrders = [];
    
    if (loggedUserRole === "customer") {
      // Para clientes: usar os dados do hook específico myOrders
      userOrders = myOrders || [];
    } else {
      // Para funcionários/admins: usar os dados paginados do useOrders
      userOrders = orders || [];
    }
    
    // Ordenar por data (mais recente primeiro) e pegar os 3 primeiros para exibição
    const sortedOrders = [...userOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.orderDate);
      const dateB = new Date(b.createdAt || b.orderDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    const userOrdersForDisplay = sortedOrders.slice(0, 3);
    
    // Para estatísticas: usar os dados completos (se disponíveis, senão usar os paginados)
    const allOrdersForCalculation = allUserOrdersForStats || userOrders;
    
    // Estatísticas do mês atual (baseadas em TODOS os pedidos do usuário)
    const totalSales = calculateUserSales(allOrdersForCalculation, 'month', loggedUserRole);
    const ordersCompleted = countCompletedOrders(allOrdersForCalculation, 'month');
    const customersServed = countUniqueCustomers(allOrdersForCalculation, 'month');
    
    // Estatísticas de todo o tempo
    const totalSalesAllTime = calculateUserSales(allOrdersForCalculation, 'all', loggedUserRole);
    const ordersCompletedAllTime = countCompletedOrders(allOrdersForCalculation, 'all');
    const customersServedAllTime = countUniqueCustomers(allOrdersForCalculation, 'all');
    
    // Outras métricas
    const membershipDuration = calculateMembershipDuration(user);
    const customerStatus = getCustomerStatus(totalSalesAllTime);
    const userRating = calculateUserRating(ordersCompletedAllTime, customersServedAllTime);
    const starRating = generateStarRating(userRating);

    // Crescimento mensal
    const previousMonthOrders = getPreviousMonthOrders(allOrdersForCalculation);
    const previousMonthCount = countCompletedOrders(previousMonthOrders, 'all');
    const ordersGrowth = calculateOrdersGrowth(ordersCompleted, previousMonthCount);

    return {
      userOrders,
      userOrdersForDisplay,
      totalSales,
      totalSalesAllTime,
      ordersCompleted,
      ordersCompletedAllTime,
      customersServed,
      customersServedAllTime,
      membershipDuration,
      customerStatus,
      userRating,
      ordersGrowth,
      starRating,
    };
  }, [user, orders, allUserOrdersForStats, myOrders, loggedUserRole]);

  // Funções para controlar o dialog de edição
  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
  };

  // Função para atualizar perfil
  const handleSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      // Adicionar dados do formulário
      Object.entries(data).forEach(([key, value]) => {
        if (key === "address" && typeof value === "object" && value !== null) {
          // Serializar endereço como JSON
          formData.append(key, JSON.stringify(value));
        } else if (key !== "image" && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Adicionar imagem se fornecida
      if (data.image) {
        formData.append("userImage", data.image);
      }

      const updatedUser = await handleUpdateProfile(formData);

      if (updatedUser && updatedUser.name !== Cookies.get("name")) {
        Cookies.set("name", updatedUser.name, { expires: 1 });
      }

      refetchProfile();
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  // Função para navegar para detalhes do pedido
  const handleViewOrderDetails = (id: string) => {
    router.push(`/orders/${id}`);
  };

  // Função para voltar ao dashboard
  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return {
    // Dados do usuário
    user,
    loading,
    isUpdatingProfile,
    isLoadingOrders: loggedUserRole === "customer" ? isLoadingMyOrders : isLoadingOrders,
    getUserImageUrl,

    // Dados calculados
    profileData,

    // Estados do UI
    editDialogOpen,

    // Funções
    handleEditClick,
    handleCloseEdit,
    handleSubmit,
    handleViewOrderDetails,
    handleBackToDashboard,
    refetchProfile,
    getClientName,
  };
} 