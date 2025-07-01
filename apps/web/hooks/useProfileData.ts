"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useProfile } from "@/hooks/useProfile";
import { useOrders } from "@/hooks/useOrders";
import {
  getUserOrders,
  calculateUserSales,
  countCompletedOrders,
  countUniqueCustomers,
  calculateMembershipDuration,
  getCustomerStatus,
  calculateUserRating,
  calculateOrdersGrowth,
  getPreviousMonthOrders,
  formatCurrency,
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

  const { orders, isLoading: isLoadingOrders } = useOrders();

  // Calcular dados do perfil baseados em dados reais
  const profileData = useMemo(() => {
    if (!user || !orders) {
      return {
        userOrders: [],
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

    const userId = Cookies.get("userId") || "";
    const userOrders = getUserOrders(orders, userId);

    // Estatísticas do mês atual
    const totalSales = calculateUserSales(userOrders, 'month');
    const ordersCompleted = countCompletedOrders(userOrders, 'month');
    const customersServed = countUniqueCustomers(userOrders, 'month');

    // Estatísticas de todo o tempo
    const totalSalesAllTime = calculateUserSales(userOrders, 'all');
    const ordersCompletedAllTime = countCompletedOrders(userOrders, 'all');
    const customersServedAllTime = countUniqueCustomers(userOrders, 'all');

    // Outras métricas
    const membershipDuration = calculateMembershipDuration(user);
    const customerStatus = getCustomerStatus(totalSalesAllTime);
    const userRating = calculateUserRating(ordersCompletedAllTime, customersServedAllTime);
    const starRating = generateStarRating(userRating);

    // Crescimento mensal
    const previousMonthOrders = getPreviousMonthOrders(userOrders);
    const previousMonthCount = countCompletedOrders(previousMonthOrders, 'all');
    const ordersGrowth = calculateOrdersGrowth(ordersCompleted, previousMonthCount);

    return {
      userOrders,
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
  }, [user, orders]);

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
    isLoadingOrders,
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
  };
} 