import { Order, OrderStatus } from "@/app/_types/order";
import { IPayment } from "@/app/_types/payment";
import { Customer } from "@/app/_types/customer";

/**
 * Filtra e retorna apenas os pagamentos realizados no dia atual.
 * @param payments Array com todos os pagamentos do sistema
 * @returns Array contendo apenas os pagamentos do dia atual
 */
export const getTodayPayments = (payments: IPayment[] = []): IPayment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    });
  };

/**
 * Calcula o valor total das vendas (pagamentos do tipo 'sale').
 * @param payments Array com todos os pagamentos do sistema
 * @returns Valor total das vendas em número
 */
  export const getSalesTotal = (payments: IPayment[] = []): number => {
    return payments.filter(p => p.type === 'sale').reduce((sum, p) => sum + p.amount, 0);
  };

/**
 * Conta quantos pedidos possuem os status especificados.
 * @param orders Array com todos os pedidos do sistema
 * @param statuses Array com os status que devem ser contabilizados
 * @returns Número de pedidos que possuem algum dos status especificados
 */
  export const getOrdersCountByStatus = (orders: Order[] = [], statuses: OrderStatus[]): number => {
    return orders.filter(o => statuses.includes(o.status as OrderStatus)).length;
  };

/**
 * Retorna a quantidade de clientes cadastrados na semana atual.
 * A semana atual é considerada de domingo a sábado.
 * @param customers Array com todos os clientes cadastrados no sistema
 * @returns Número de clientes cadastrados na semana atual
 */
export const getWeeklyCustomersCount = (customers: Customer[] = []): number => {
  const today = new Date();
  
  // Calcular o início da semana atual (domingo)
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Calcular o fim da semana atual (sábado)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return customers.filter(customer => {
    if (!customer.createdAt) return false;
    
    const customerCreatedAt = new Date(customer.createdAt);
    return customerCreatedAt >= startOfWeek && customerCreatedAt <= endOfWeek;
  }).length;
};

/**
 * Retorna os pedidos mais recentes ordenados por data de criação.
 * @param orders Array com todos os pedidos do sistema
 * @param limit Quantidade máxima de pedidos a retornar (padrão: 3)
 * @returns Array com os pedidos mais recentes ordenados da data mais recente para a mais antiga
 */
export const getRecentOrders = (orders: Order[] = [], limit: number = 5): Order[] => {
  return [...orders].sort((a, b) => 
    new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()
  ).slice(0, limit);
};

/**
 * Calcula a porcentagem de crescimento de vendas comparado com ontem.
 * @param todayPayments Pagamentos de hoje
 * @param yesterdayPayments Pagamentos de ontem
 * @returns Porcentagem de crescimento (pode ser negativa)
 */
export const getSalesGrowthPercentage = (todayPayments: IPayment[] = [], yesterdayPayments: IPayment[] = []): number => {
  const todayTotal = getSalesTotal(todayPayments);
  const yesterdayTotal = getSalesTotal(yesterdayPayments);
  
  if (yesterdayTotal === 0) return todayTotal > 0 ? 100 : 0;
  
  return Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100);
};

/**
 * Retorna os pagamentos de ontem para comparação.
 * @param payments Array com todos os pagamentos do sistema
 * @returns Array contendo apenas os pagamentos de ontem
 */
export const getYesterdayPayments = (payments: IPayment[] = []): IPayment[] => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);
  
  return payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    return paymentDate >= yesterday && paymentDate <= yesterdayEnd;
  });
};

/**
 * Retorna a quantidade de pedidos criados hoje.
 * @param orders Array com todos os pedidos do sistema
 * @returns Número de pedidos criados hoje
 */
export const getTodayOrdersCount = (orders: Order[] = []): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt || order.orderDate);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  }).length;
};

/**
 * Retorna o horário de abertura do caixa atual ou uma string padrão.
 * @param cashRegister Dados do caixa atual
 * @returns String formatada com o horário de abertura
 */
export const getCashOpenTime = (cashRegister: any): string => {
  if (!cashRegister?.openedAt) return "08:00";
  
  const openTime = new Date(cashRegister.openedAt);
  return openTime.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};