import { api } from "./authService";
import type { Order } from "../types/order";
import { normalizeOrder, normalizeOrders } from "../utils/data-normalizers";
import { API_ROUTES } from "../constants/api-routes"

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
  cpf?: string;
  serviceOrder?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Busca todos os pedidos com suporte a paginação, filtragem e ordenação
 */
export async function getAllOrders(filters: OrderFilters = {}): Promise<{
  orders: Order[];
  pagination?: PaginationInfo;
}> {
  try {
    const params: Record<string, any> = {};

    params.page = filters.page || 1;
    params.limit = filters.limit || 10;
  
    params.sort = filters.sort || "-createdAt";
    
    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.cpf) {
      params.cpf = filters.cpf;
    }
    
    if (filters.serviceOrder) {
      params.serviceOrder = filters.serviceOrder;
    }
    
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    
    if (filters.employeeId && filters.employeeId !== 'all') {
      params.employeeId = filters.employeeId;
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      params.paymentMethod = filters.paymentMethod;
    }

    if (filters.laboratoryId && filters.laboratoryId !== 'all') {
      params.laboratoryId = filters.laboratoryId;
    }
    
    if (filters.startDate) {
      params.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate;
    }
    
    params._t = Date.now() + Math.random().toString(36).substring(7);

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
    const response = await api.get(API_ROUTES.ORDERS.LIST, config);

    let rawOrders: any[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      rawOrders = response.data;
    } else if (response.data?.orders) {
      rawOrders = response.data.orders;
      pagination = response.data.pagination;
    }
    const orders = normalizeOrders(rawOrders);

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
    const response = await api.get(API_ROUTES.ORDERS.BY_ID(id));
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
    const params = {
      sort: "-createdAt",
      _t: new Date().getTime()
    };
    const response = await api.get(API_ROUTES.ORDERS.CLIENT(clientId), { params });

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
    const response = await api.put(API_ROUTES.ORDERS.STATUS(id), { status });
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
    const response = await api.put(API_ROUTES.ORDERS.LABORATORY(id), {
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
    const data = {
      ...orderData,
      products: Array.isArray(orderData.products) 
        ? orderData.products 
        : [orderData.products],
      serviceOrder: orderData.serviceOrder?.toString() || null,
      totalPrice: orderData.totalPrice || 0,
      discount: orderData.discount || 0,
      finalPrice: orderData.finalPrice || (orderData.totalPrice || 0) - (orderData.discount || 0)
    };
    
    const response = await api.post(API_ROUTES.ORDERS.CREATE, data);
    return normalizeOrder(response.data);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
}

/**
 * Busca todos os pedidos para exportação, aplicando filtros opcionais
 */
export const getAllOrdersForExport = async (filters: Record<string, any> = {}): Promise<Order[]> => {
  try {
    // Configurar para buscar com limite alto
    const params = new URLSearchParams();
    
    // Limite alto para pegar todos os registros que correspondam aos filtros
    params.append('limit', '9999');
    
    // Adicionar filtros à query
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Não incluir os parâmetros de paginação na exportação
        if (key !== 'page' && key !== 'limit') {
          params.append(key, String(value));
        }
      }
    });

    console.log('Parâmetros para exportação:', Object.fromEntries(params.entries()));
    
    const response = await api.get(API_ROUTES.ORDERS.PARAMS(params.toString()));
    
    let result = [];
    
    // Verificar formato da resposta
    if (Array.isArray(response.data)) {
      result = response.data;
    } else if (response.data?.orders && Array.isArray(response.data.orders)) {
      result = response.data.orders;
    } else {
      console.warn('Formato de resposta inesperado na exportação:', response.data);
      result = [];
    }
    
    // Normalizar os pedidos (garantir que estejam no formato correto)
    return normalizeOrders(result);
  } catch (error) {
    console.error('Erro ao buscar pedidos para exportação:', error);
    throw error;
  }
};