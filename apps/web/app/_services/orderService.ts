import { api } from "./authService";
import type { Order } from "../_types/order";
import { normalizeOrder, normalizeOrders } from "../_utils/data-normalizers";
import { API_ROUTES } from "../_constants/api-routes"
import axios from "axios";

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
  paymentStatus?: string;
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
    // Limpar filtros com valor 'all'
    const cleanedFilters = { ...filters };
    if (cleanedFilters.paymentMethod === 'all') delete cleanedFilters.paymentMethod;
    if (cleanedFilters.paymentStatus === 'all') delete cleanedFilters.paymentStatus;

    const params: Record<string, any> = {};

    params.page = cleanedFilters.page || 1;
    params.limit = cleanedFilters.limit || 10;
  
    params.sort = cleanedFilters.sort || "-createdAt";
    
    if (cleanedFilters.search) {
      params.search = cleanedFilters.search;
    }

    if (cleanedFilters.cpf) {
      params.cpf = cleanedFilters.cpf;
    }
    
    if (cleanedFilters.serviceOrder) {
      params.serviceOrder = cleanedFilters.serviceOrder;
    }
    
    if (cleanedFilters.status && cleanedFilters.status !== 'all') {
      params.status = cleanedFilters.status;
    }
    
    if (cleanedFilters.employeeId && cleanedFilters.employeeId !== 'all') {
      params.employeeId = cleanedFilters.employeeId;
    }

    if (cleanedFilters.paymentMethod) {
      params.paymentMethod = cleanedFilters.paymentMethod;
    }
    if (cleanedFilters.paymentStatus) {
      params.paymentStatus = cleanedFilters.paymentStatus;
    }

    if (cleanedFilters.laboratoryId && cleanedFilters.laboratoryId !== 'all') {
      params.laboratoryId = cleanedFilters.laboratoryId;
    }
    
    if (cleanedFilters.startDate) {
      params.startDate = cleanedFilters.startDate;
    }
    
    if (cleanedFilters.endDate) {
      params.endDate = cleanedFilters.endDate;
    }
    
    params._t = Date.now() + Math.random().toString(36).substring(7);

    console.log('🔍 getAllOrders - cleanedFilters:', cleanedFilters);
    console.log('🔍 getAllOrders - params:', params);

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
    
    if (axios.isAxiosError(error) && error.response) {
      console.error("Dados da resposta de erro:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    }
    
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
 * Busca os pedidos do cliente logado
 */
export async function getMyOrders(): Promise<Order[]> {
  try {
    const params = {
      sort: "-createdAt",
      _t: new Date().getTime()
    };
    const response = await api.get(API_ROUTES.ORDERS.MY_ORDERS, { params });

    return Array.isArray(response.data) ? normalizeOrders(response.data) : [];
  } catch (error) {
    console.error("Erro ao buscar meus pedidos:", error);
    return [];
  }
}

/**
 * Atualiza os dados de um pedido existente
 * @param id ID do pedido
 * @param orderData Dados do pedido a serem atualizados
 * @returns Pedido atualizado
 * @throws Error se a atualização falhar
 */
export async function updateOrder(
  id: string,
  orderData: Partial<Order>
): Promise<Order | null> {
  try {
    // Garante que o ID fornecido seja válido
    if (!id || typeof id !== 'string') {
      throw new Error("ID do pedido inválido");
    }
    
    // Valida dados essenciais
    if (!orderData) {
      throw new Error("Dados do pedido ausentes");
    }
    
    // Faz a requisição PUT para a API
    const response = await api.put(API_ROUTES.ORDERS.UPDATE(id), orderData);
    
    // Normaliza os dados do pedido retornado
    return normalizeOrder(response.data);
  } catch (error) {
    console.error(`Erro ao atualizar pedido ${id}:`, error);
    
    // Extrai mensagem de erro da resposta da API
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Erros específicos baseados no status da resposta
      if (error.response?.status === 400) {
        throw new Error("Dados inválidos para atualização do pedido");
      }
      
      if (error.response?.status === 404) {
        throw new Error("Pedido não encontrado");
      }
      
      if (error.response?.status === 403) {
        throw new Error("Sem permissão para atualizar este pedido");
      }
    }
    
    // Erro genérico
    throw new Error("Erro ao atualizar pedido. Tente novamente.");
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
    // CORRIGIDO: Remover serviceOrder e serviceNumber dos dados enviados
    const { serviceOrder, serviceNumber, ...cleanOrderData } = orderData as any;
    
    const data = {
      ...cleanOrderData,
      products: Array.isArray(orderData.products) 
        ? orderData.products 
        : [orderData.products],
      // REMOVIDO: serviceOrder - será gerado automaticamente pelo backend
      totalPrice: orderData.totalPrice || 0,
      discount: orderData.discount || 0,
      finalPrice: orderData.finalPrice || (orderData.totalPrice || 0) - (orderData.discount || 0)
    };
    
    // Garantir que serviceOrder não seja enviado
    if ('serviceOrder' in data) {
      delete (data as any).serviceOrder;
    }
    if ('serviceNumber' in data) {
      delete (data as any).serviceNumber;
    }
    
    console.log("Dados enviados para criação do pedido (sem serviceOrder):", data);
    
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
    const params = new URLSearchParams();
    
    params.append('limit', '9999');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key !== 'page' && key !== 'limit') {
          params.append(key, String(value));
        }
      }
    });

    console.log('Parâmetros para exportação:', Object.fromEntries(params.entries()));
    
    const response = await api.get(API_ROUTES.ORDERS.PARAMS(params.toString()));
    
    let result = [];
    
    if (Array.isArray(response.data)) {
      result = response.data;
    } else if (response.data?.orders && Array.isArray(response.data.orders)) {
      result = response.data.orders;
    } else {
      console.warn('Formato de resposta inesperado na exportação:', response.data);
      result = [];
    }

    return normalizeOrders(result);
  } catch (error) {
    console.error('Erro ao buscar pedidos para exportação:', error);
    throw error;
  }
};