import { api } from "./authService";
import type { Order } from "../types/order";
import { normalizeOrder, normalizeOrders } from "../utils/data-normalizers";

export interface OrderFilters {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  employeeId?: string;
  paymentMethod?: string;
  laboratoryId?: string;
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

export async function getAllOrders(filters: OrderFilters = {}): Promise<{
  orders: Order[];
  pagination?: PaginationInfo;
}> {
  try {
    console.log("Filtros sendo enviados para a API:", filters);
    
    const params: Record<string, any> = {};
    
    // Parâmetros de paginação
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit || 10;
    if (filters.sort) params.sort = filters.sort;
    
    // Parâmetro de busca
    if (filters.search) {
      params.search = filters.search;
      console.log(`Enviando parâmetro search: "${filters.search}"`);
    }
    
    // Status
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
      console.log(`Enviando status: ${filters.status}`);
    }
    
    // EmployeeId
    if (filters.employeeId && filters.employeeId !== 'all') {
      params.employeeId = filters.employeeId;
      console.log(`Enviando employeeId: ${filters.employeeId}`);
    }

    // PaymentMethod
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      params.paymentMethod = filters.paymentMethod;
      console.log(`Enviando paymentMethod: ${filters.paymentMethod}`);
    }

    // LaboratoryId
    if (filters.laboratoryId && filters.laboratoryId !== 'all') {
      params.laboratoryId = filters.laboratoryId;
      console.log(`Enviando laboratoryId: ${filters.laboratoryId}`);
    }
    
    // Datas
    if (filters.startDate) {
      params.startDate = filters.startDate;
      console.log(`Enviando startDate: ${filters.startDate}`);
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate;
      console.log(`Enviando endDate: ${filters.endDate}`);
    }
    
    // Adicionar timestamp para evitar cache
    params._t = new Date().getTime() + Math.random().toString(36).substring(7);
    
    console.log("Parâmetros finais enviados para a API:", params);
    console.log("URL de requisição:", `/api/orders?${new URLSearchParams(params).toString()}`);

    // Configuração com headers anti-cache
    const config = {
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Force-Fetch': 'true',
        'X-Timestamp': Date.now().toString()
      }
    };

    const response = await api.get("/api/orders", config);
    
    console.log("Resposta recebida da API:", response.data);

    let rawOrders: any[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      rawOrders = response.data;
    } else if (response.data?.orders) {
      rawOrders = response.data.orders;
      pagination = response.data.pagination;
    }

    const orders = normalizeOrders(rawOrders);
    console.log(`Retornando ${orders.length} pedidos normalizados`);

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
 * Busca os pedidos de um cliente
 */
export async function getOrdersByClient(clientId: string): Promise<Order[] | null> {
  try {
    if (!clientId) return [];
    const response = await api.get(`/api/orders/client/${clientId}`);
    return Array.isArray(response.data) ? normalizeOrders(response.data) : [];
  } catch (error) {
    console.error("Erro ao buscar pedidos do cliente:", error);
    return [];
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
      product: Array.isArray(orderData.products) 
        ? orderData.products 
        : [orderData.products],
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