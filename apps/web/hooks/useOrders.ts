import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderLaboratory,
  createOrder,
} from "@/app/services/orderService";
import type { Order } from "@/app/types/order";

interface OrderFilters {
  search?: string;
  page?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [filters, setFilters] = useState<OrderFilters>({});

  const router = useRouter();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar parâmetros de busca
      const params = {
        page: currentPage,
        ...filters,
        sort: "-createdAt", // Ordenar do mais recente para o mais antigo
      };

      // Buscar todos os pedidos
      const { orders: fetchedOrders, pagination } = await getAllOrders(params);

      setOrders(fetchedOrders);

      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalOrders(pagination.total || fetchedOrders.length);
      } else {
        setTotalPages(1);
        setTotalOrders(fetchedOrders.length);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setError("Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderById = async (id: string): Promise<Order | null> => {
    try {
      setLoading(true);
      setError(null);

      const order = await getOrderById(id);

      if (order) {
        setCurrentOrder(order);
        return order;
      }
      setError("Pedido não encontrado.");
      return null;
    } catch (error) {
      console.error(`Erro ao buscar pedido com ID ${id}:`, error);
      setError("Não foi possível carregar os detalhes do pedido.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    id: string,
    status: string
  ): Promise<Order | null> => {
    try {
      setLoading(true);
      const updatedOrder = await updateOrderStatus(id, status);

      if (updatedOrder) {
        toast({
          title: "Status atualizado",
          description: "O status do pedido foi atualizado com sucesso.",
        });

        // Atualizar pedido atual se estiver visualizando-o
        if (currentOrder && currentOrder._id === id) {
          setCurrentOrder(updatedOrder);
        }

        return updatedOrder;
      }
      throw new Error("Não foi possível atualizar o status do pedido.");
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderLaboratory = async (
    id: string,
    laboratoryId: string
  ): Promise<Order | null> => {
    try {
      setLoading(true);
      const updatedOrder = await updateOrderLaboratory(id, laboratoryId);

      if (updatedOrder) {
        toast({
          title: "Laboratório atualizado",
          description: "O laboratório do pedido foi atualizado com sucesso.",
        });

        // Atualizar pedido atual se estiver visualizando-o
        if (currentOrder && currentOrder._id === id) {
          setCurrentOrder(updatedOrder);
        }

        return updatedOrder;
      }
      throw new Error("Não foi possível atualizar o laboratório do pedido.");
    } catch (error) {
      console.error(`Erro ao atualizar laboratório do pedido ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o laboratório do pedido.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (
    orderData: Omit<Order, "_id">
  ): Promise<Order | null> => {
    try {
      setLoading(true);
      const newOrder = await createOrder(orderData);

      if (newOrder) {
        toast({
          title: "Pedido criado",
          description: "O pedido foi criado com sucesso.",
        });
        return newOrder;
      }
      return null;
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Não foi possível criar o pedido.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Função para navegar para a página de detalhes do pedido
  const navigateToOrderDetails = (id: string) => {
    router.push(`/orders/${id}`);
  };

  // Função para navegar para a página de criação de pedido
  const navigateToCreateOrder = () => {
    router.push("/orders/new");
  };

  // Tradução de status
  const translateOrderStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
    };
    return statusMap[status] || status;
  };

  // Obter classe CSS para status
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
    orders,
    currentOrder,
    loading,
    error,
    currentPage,
    totalPages,
    totalOrders,
    filters,
    setCurrentPage,
    updateFilters,
    fetchOrders,
    fetchOrderById,
    handleUpdateOrderStatus,
    handleUpdateOrderLaboratory,
    handleCreateOrder,
    navigateToOrderDetails,
    navigateToCreateOrder,
    translateOrderStatus,
    getOrderStatusClass,
  };
}
