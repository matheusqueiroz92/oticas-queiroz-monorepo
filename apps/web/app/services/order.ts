import { api } from "./auth";
import type { Order } from "../types/order";

interface OrderFilters {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
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
    let orders: Order[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      orders = response.data;
    } else if (response.data?.orders) {
      orders = response.data.orders;
      pagination = response.data.pagination;
    }

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
    return response.data;
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
    return response.data;
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
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar laboratório do pedido ${id}:`, error);
    return null;
  }
}

/**
 * Cria um novo pedido
 */
export async function createOrder(
  orderData: Omit<Order, "_id">
): Promise<Order | null> {
  try {
    const response = await api.post("/api/orders", orderData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error; // Repassar o erro para tratamento pelo chamador
  }
}

/**
 * Extrair nome de cliente ou funcionário de uma string de objeto MongoDB
 */
export function extractName(objectString: string): string {
  try {
    const nameMatch = objectString.match(/name: ['"]([^'"]+)['"]/);
    if (nameMatch?.[1]) {
      return nameMatch[1];
    }
    return "Nome não disponível";
  } catch (error) {
    console.error("Erro ao extrair nome:", error);
    return "Nome não disponível";
  }
}
