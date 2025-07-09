import { IPayment } from "@/app/_types/payment";

export type SalesPeriod = 7 | 30 | 180;

export interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
  label: string;
}

/**
 * Gera um array de datas para o período especificado.
 * @param days Número de dias para gerar
 * @returns Array de datas em formato ISO
 */
export const generateDateRange = (days: SalesPeriod): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  
  return dates;
};

/**
 * Calcula as vendas por dia para o período especificado.
 * @param payments Array de pagamentos
 * @param period Período em dias (7, 30, 180)
 * @returns Array com dados de vendas por dia
 */
export const calculateSalesByPeriod = (
  payments: IPayment[] = [], 
  period: SalesPeriod = 7
): SalesDataPoint[] => {
  const dateRange = generateDateRange(period);
  
  return dateRange.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Filtrar pagamentos do dia específico
    const dayPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.toISOString().split('T')[0] === dateStr;
    });
    
    // Calcular vendas do dia (apenas pagamentos de venda)
    const dailySales = dayPayments
      .filter(p => p.type === 'sale')
      .reduce((total, p) => total + p.amount, 0);
    
    // Contar número de transações
    const ordersCount = dayPayments.filter(p => p.type === 'sale').length;
    
    // Formato da label baseado no período
    let label: string;
    if (period === 7) {
      label = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
    } else if (period === 30) {
      label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } else {
      label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
    
    return {
      date: dateStr,
      sales: dailySales,
      orders: ordersCount,
      label: label
    };
  });
};

/**
 * Calcula estatísticas resumidas do período.
 * @param salesData Array de dados de vendas
 * @returns Objeto com estatísticas do período
 */
export const calculatePeriodStats = (salesData: SalesDataPoint[]) => {
  // Se não há dados, retornar valores padrão
  if (!salesData || salesData.length === 0) {
    return {
      totalSales: 0,
      totalOrders: 0,
      averageDailySales: 0,
      averageDailyOrders: 0,
      bestDay: { date: '', sales: 0, orders: 0, label: '' },
      growthPercentage: 0
    };
  }

  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
  const averageDailySales = totalSales / salesData.length;
  const averageDailyOrders = totalOrders / salesData.length;
  
  // Encontrar o melhor dia
  const bestDay = salesData.reduce((best, current) => 
    current.sales > best.sales ? current : best
  );
  
  // Calcular crescimento (comparar primeira metade com segunda metade)
  const halfPoint = Math.floor(salesData.length / 2);
  const firstHalf = salesData.slice(0, halfPoint);
  const secondHalf = salesData.slice(halfPoint);
  
  const firstHalfAvg = firstHalf.length > 0 
    ? firstHalf.reduce((sum, day) => sum + day.sales, 0) / firstHalf.length
    : 0;
  const secondHalfAvg = secondHalf.length > 0 
    ? secondHalf.reduce((sum, day) => sum + day.sales, 0) / secondHalf.length
    : 0;
  
  const growthPercentage = firstHalfAvg > 0 
    ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
    : 0;
  
  return {
    totalSales,
    totalOrders,
    averageDailySales,
    averageDailyOrders,
    bestDay,
    growthPercentage
  };
};

/**
 * Formata valor monetário para exibição.
 * @param value Valor a ser formatado
 * @returns String formatada em Real brasileiro
 */
export const formatSalesValue = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Formata valor monetário compacto para o gráfico.
 * @param value Valor a ser formatado
 * @returns String formatada de forma compacta (ex: R$ 1,2K)
 */
export const formatCompactValue = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  } else {
    return `R$ ${value.toFixed(0)}`;
  }
};

/**
 * Obtém o texto descritivo do período selecionado.
 * @param period Período em dias
 * @returns String descritiva do período
 */
export const getPeriodLabel = (period: SalesPeriod): string => {
  switch (period) {
    case 7:
      return "Últimos 7 dias";
    case 30:
      return "Últimos 30 dias";
    case 180:
      return "Últimos 6 meses";
    default:
      return "Período";
  }
};

/**
 * Calcula vendas agrupadas por semana para períodos longos.
 * @param payments Array de pagamentos
 * @param period Período em dias
 * @returns Array com dados agrupados por semana
 */
export const calculateWeeklySales = (
  payments: IPayment[] = [], 
  period: SalesPeriod = 180
): SalesDataPoint[] => {
  if (period <= 30) {
    return calculateSalesByPeriod(payments, period);
  }
  
  const weeks: SalesDataPoint[] = [];
  const today = new Date();
  const weeksCount = Math.ceil(period / 7);
  
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7) - 6);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (i * 7));
    
    // Filtrar pagamentos da semana
    const weekPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= weekStart && paymentDate <= weekEnd;
    });
    
    const weeklySales = weekPayments
      .filter(p => p.type === 'sale')
      .reduce((total, p) => total + p.amount, 0);
    
    const weeklyOrders = weekPayments.filter(p => p.type === 'sale').length;
    
    weeks.push({
      date: weekStart.toISOString().split('T')[0],
      sales: weeklySales,
      orders: weeklyOrders,
      label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
    });
  }
  
  return weeks;
}; 