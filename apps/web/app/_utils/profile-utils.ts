import { Order } from "@/app/_types/order";
import { User } from "@/app/_types/user";

/**
 * Filtra os pedidos que pertencem ao usuário específico.
 * @param orders Array com todos os pedidos do sistema
 * @param userId ID do usuário para filtrar os pedidos
 * @param userRole Papel do usuário no sistema ('customer' | 'employee' | 'admin')
 * @param limit Quantidade máxima de pedidos a retornar (padrão: todos)
 * @returns Array com pedidos do usuário especificado
 */
export const getUserOrders = (orders: Order[] = [], userId: string, userRole?: string, limit?: number): Order[] => {
  if (!userId || !orders.length) return [];
  
  const filtered = orders.filter(order => {
    // Converter IDs para string para comparação mais robusta
    const clientIdStr = order.clientId?.toString().trim() || '';
    const employeeIdStr = order.employeeId?.toString().trim() || '';
    const userIdStr = userId.toString().trim();
    
    // Para clientes, buscar por clientId
    if (userRole === 'customer') {
      return clientIdStr === userIdStr;
    }
    
    // Para funcionários e admins, buscar por employeeId primeiro, depois clientId
    // Também verificar se o usuário tem alguma relação com o pedido
    const isEmployee = employeeIdStr === userIdStr;
    const isClient = clientIdStr === userIdStr;
    
    return isEmployee || isClient;
  });

  // Ordenar por data de criação (mais recente primeiro)
  const sorted = filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.orderDate);
    const dateB = new Date(b.createdAt || b.orderDate);
    return dateB.getTime() - dateA.getTime();
  });

  // Limitar quantidade se especificado
  return limit ? sorted.slice(0, limit) : sorted;
};

/**
 * Calcula o total de vendas realizadas pelo usuário em um período.
 * @param orders Array com pedidos do usuário
 * @param period Período para cálculo ('month' | 'all')
 * @param userRole Role do usuário ('customer' | 'employee' | 'admin')
 * @returns Valor total das vendas
 */
export const calculateUserSales = (orders: Order[] = [], period: 'month' | 'all' = 'month', userRole?: string): number => {
  let filteredOrders = orders;
  
  if (period === 'month') {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
  }
  
  // Para clientes: considerar todos os pedidos não cancelados (representa gastos totais)
  // Para funcionários/admins: considerar apenas pedidos com pagamento realizado
  const salesOrders = filteredOrders.filter(order => {
    const isNotCancelled = order.status !== 'cancelled';
    
    if (userRole === 'customer') {
      // Para clientes: todos os pedidos não cancelados representam gastos
      return isNotCancelled;
    } else {
      // Para funcionários/admins: apenas pedidos com pagamento realizado
      const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'partially_paid';
      return isPaid && isNotCancelled;
    }
  });
  
  return salesOrders.reduce((total, order) => {
    return total + (order.finalPrice || order.totalPrice || 0);
  }, 0);
};

/**
 * Conta quantos pedidos o usuário completou em um período.
 * @param orders Array com pedidos do usuário
 * @param period Período para cálculo ('month' | 'all')
 * @returns Número de pedidos completados
 */
export const countCompletedOrders = (orders: Order[] = [], period: 'month' | 'all' = 'month'): number => {
  let filteredOrders = orders;
  
  if (period === 'month') {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
  }
  
  // Para pedidos cadastrados, considerar todos os pedidos que não foram cancelados
  return filteredOrders.filter(order => order.status !== 'cancelled').length;
};

/**
 * Conta quantos clientes únicos o usuário atendeu.
 * @param orders Array com pedidos do usuário
 * @param period Período para cálculo ('month' | 'all')
 * @returns Número de clientes únicos atendidos
 */
export const countUniqueCustomers = (orders: Order[] = [], period: 'month' | 'all' = 'month'): number => {
  let filteredOrders = orders;
  
  if (period === 'month') {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
  }
  
  // Para clientes atendidos, considerar todos os pedidos que não foram cancelados
  const validOrders = filteredOrders.filter(order => order.status !== 'cancelled');
  
  const uniqueClientIds = new Set(
    validOrders.map(order => order.clientId.toString())
  );
  
  return uniqueClientIds.size;
};

/**
 * Calcula há quantos anos o usuário está no sistema.
 * @param user Dados do usuário
 * @returns Número de anos como membro (string formatada)
 */
export const calculateMembershipDuration = (user: User): string => {
  if (!user.createdAt) return "< 1 ano";
  
  const createdDate = new Date(user.createdAt);
  const currentDate = new Date();
  const diffTime = currentDate.getTime() - createdDate.getTime();
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  
  if (diffYears < 1) return "< 1 ano";
  if (diffYears === 1) return "1 ano";
  return `${diffYears} anos`;
};

/**
 * Determina o status do cliente baseado no valor total gasto.
 * @param totalSpent Valor total gasto pelo cliente
 * @returns Status do cliente ('Bronze' | 'Prata' | 'Ouro' | 'Premium')
 */
export const getCustomerStatus = (totalSpent: number): string => {
  if (totalSpent >= 10000) return "Premium";
  if (totalSpent >= 5000) return "Ouro";
  if (totalSpent >= 2000) return "Prata";
  return "Bronze";
};

/**
 * Calcula a avaliação média simulada baseada no desempenho.
 * @param completedOrders Número de pedidos completados
 * @param customersServed Número de clientes atendidos
 * @returns Avaliação de 1 a 5
 */
export const calculateUserRating = (completedOrders: number, customersServed: number): number => {
  // Fórmula simulada baseada na performance
  const baseRating = 4.0;
  const performanceBonus = Math.min((completedOrders / 100) * 0.5, 0.8);
  const customerBonus = Math.min((customersServed / 50) * 0.2, 0.2);
  
  return Math.min(baseRating + performanceBonus + customerBonus, 5.0);
};

/**
 * Calcula a porcentagem de crescimento dos pedidos no mês atual vs mês anterior.
 * @param currentMonthOrders Pedidos do mês atual
 * @param previousMonthOrders Pedidos do mês anterior
 * @returns Porcentagem de crescimento
 */
export const calculateOrdersGrowth = (currentMonthOrders: number, previousMonthOrders: number): number => {
  if (previousMonthOrders === 0) return currentMonthOrders > 0 ? 100 : 0;
  
  return Math.round(((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100);
};

/**
 * Obtém os pedidos do mês anterior para comparação.
 * @param orders Array com todos os pedidos do usuário
 * @returns Array com pedidos do mês anterior
 */
export const getPreviousMonthOrders = (orders: Order[] = []): Order[] => {
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt || order.orderDate);
    return orderDate.getMonth() === previousMonth.getMonth() && 
           orderDate.getFullYear() === previousMonth.getFullYear();
  });
};

/**
 * Formata valores monetários para exibição.
 * @param value Valor a ser formatado
 * @returns String formatada em Real brasileiro
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Gera estrelas para avaliação visual.
 * @param rating Avaliação numérica (1-5)
 * @returns String com estrelas preenchidas e vazias
 */
export const generateStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return "★".repeat(fullStars) + 
         (hasHalfStar ? "☆" : "") + 
         "☆".repeat(emptyStars);
}; 