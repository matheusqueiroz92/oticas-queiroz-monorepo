import { api } from "./authService";
import type { Order } from "../types/order";
import { normalizeOrder, normalizeOrders } from "../utils/data-normalizers";

interface OrderFilters {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Busca todos os pedidos com opções de filtro e paginação
 */
export async function getAllOrders(filters: OrderFilters = {}): Promise<{
  orders: Order[];
  pagination?: PaginationInfo;
}> {
  try {
    const response = await api.get("/api/orders", { params: filters });

    // Normalizar a resposta para garantir consistência
    let rawOrders: any[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      rawOrders = response.data;
    } else if (response.data?.orders) {
      rawOrders = response.data.orders;
      pagination = response.data.pagination;
    }

    console.log("Raw orders:", rawOrders);
    console.log("----------------------");
    // Normalizar os pedidos antes de retorná-los
    const orders = normalizeOrders(rawOrders);
    console.log("Orders:", orders);
    console.log("----------------------");

    return { orders, pagination };
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return { orders: [] };
  }
}

/**
 * Busca um pedido específico pelo ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const response = await api.get(`/api/orders/${id}`);
    return normalizeOrder(response.data);
  } catch (error) {
    console.error(`Erro ao buscar pedido com ID ${id}:`, error);
    return null;
  }
}

/**
 * Atualiza o status de um pedido
 */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<Order | null> {
  try {
    const response = await api.put(`/api/orders/${id}/status`, { status });
    return normalizeOrder(response.data);
  } catch (error) {
    console.error(`Erro ao atualizar status do pedido ${id}:`, error);
    return null;
  }
}

/**
 * Atualiza o laboratório de um pedido
 */
export async function updateOrderLaboratory(
  id: string,
  laboratoryId: string
): Promise<Order | null> {
  try {
    const response = await api.put(`/api/orders/${id}/laboratory`, {
      laboratoryId,
    });
    return normalizeOrder(response.data);
  } catch (error) {
    console.error(`Erro ao atualizar laboratório do pedido ${id}:`, error);
    return null;
  }
}

/**
 * Cria um novo pedido
 */
export async function createOrder(
  orderData: Omit<Order, "_id" | "createdAt" | "updatedAt">
): Promise<Order | null> {
  try {
    // Garantir que product é um array
    const data = {
      ...orderData,
      product: Array.isArray(orderData.product) 
        ? orderData.product 
        : [orderData.product],
      // Garantir que os campos de preço estão definidos
      totalPrice: orderData.totalPrice || 0,
      discount: orderData.discount || 0,
      finalPrice: orderData.finalPrice || 
                (orderData.totalPrice || 0) - (orderData.discount || 0)
    };
    
    const response = await api.post("/api/orders", data);
    return normalizeOrder(response.data);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
}