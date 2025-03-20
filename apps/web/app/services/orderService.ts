import { api } from "./authService";
import type { Order } from "../types/order";
import { normalizeOrder, normalizeOrders } from "../utils/data-normalizers";

// Extender a interface Window para incluir queryClient
declare global {
  interface Window {
    queryClient?: any;
  }
}
import { QUERY_KEYS } from "../constants/query-keys";
import axios from "axios";

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

// Broadcast channel para sincronizar pedidos entre abas
let orderUpdateChannel: BroadcastChannel | null = null;

// Inicializar channel se suportado pelo navegador
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  orderUpdateChannel = new BroadcastChannel('order-updates');
  
  // Escutar por atualizações de outras abas
  orderUpdateChannel.onmessage = (event) => {
    if (event.data.type === 'order-updated') {
      // Forçar atualização das consultas relevantes
      if (window.queryClient) {
        window.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
        window.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.PAGINATED() });
        
        if (event.data.orderId) {
          window.queryClient.invalidateQueries({ 
            queryKey: QUERY_KEYS.ORDERS.DETAIL(event.data.orderId) 
          });
        }
      }
      
      // Disparar evento DOM
      document.dispatchEvent(new CustomEvent('order-updated', { 
        detail: event.data 
      }));
    }
  };
}

// Função para transmitir atualizações entre abas
function broadcastOrderUpdate(orderId: string, action: string) {
  if (orderUpdateChannel) {
    orderUpdateChannel.postMessage({
      type: 'order-updated',
      orderId,
      action,
      timestamp: Date.now()
    });
  }
}

/**
 * Busca todos os pedidos com opções de filtro e paginação
 */
export async function getAllOrders(filters: OrderFilters = {}): Promise<{
  orders: Order[];
  pagination?: PaginationInfo;
}> {
  try {
    // Adicionar um timestamp para evitar cache 
    const timestamp = new Date().getTime();
    
    console.log("🔧 Solicitação para API com filtros:", filters);
    
    const response = await api.get("/api/orders", { 
      params: { ...filters, _t: timestamp } 
    });
    
    console.log("🔧 Resposta da API:", response.data);

    // Normalizar a resposta para garantir consistência
    let rawOrders: any[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      rawOrders = response.data;
    } else if (response.data?.orders) {
      rawOrders = response.data.orders;
      pagination = response.data.pagination;
    }

    // Normalizar os pedidos antes de retorná-los
    const orders = normalizeOrders(rawOrders);

    return { orders, pagination };
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    
    // Verificar se é um erro de timeout ou conexão
    if (axios.isAxiosError(error) && !error.response) {
      console.warn("Erro de conexão - retornando dados vazios");
    }
    
    // Verificar o tipo específico de erro do servidor
    if (axios.isAxiosError(error) && error.response?.status === 500) {
      console.warn("Erro 500 do servidor - possível problema no backend");
      
      // Log adicional para ajudar no diagnóstico
      console.log("URL requisitada:", error.config?.url);
      console.log("Parâmetros:", error.config?.params);
    }
    
    // Retornar um objeto vazio, mas válido
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
    
    // Transmitir atualização para outras abas
    broadcastOrderUpdate(id, 'status-updated');
    
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