import { useMemo } from 'react';
import type { Order } from '@/app/_types/order';

export function useOrdersStats(orders: Order[]) {
  const stats = useMemo(() => {
    const totalOrdersLength = orders.length;
    
    const ordersToday = orders.filter(order => {
      const created = new Date(order.createdAt || order.orderDate);
      const today = new Date();
      return (
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      );
    }).length;
    
    const ordersInProduction = orders.filter(order => order.status === "in_production").length;
    
    const ordersReady = orders.filter(order => order.status === "ready").length;
    
    const totalOrdersMonth = orders.filter(order => {
      const created = new Date(order.createdAt || order.orderDate);
      const hoje = new Date();
      return (
        created.getMonth() === hoje.getMonth() &&
        created.getFullYear() === hoje.getFullYear()
      );
    }).reduce((sum, order) => sum + (order.finalPrice || order.totalPrice), 0);

    return {
      totalOrdersLength,
      ordersToday,
      ordersInProduction,
      ordersReady,
      totalOrdersMonth,
    };
  }, [orders]);

  return stats;
} 