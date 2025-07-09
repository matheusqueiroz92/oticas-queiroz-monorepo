import { useMemo } from 'react';
import type { Order } from '@/app/_types/order';

export function useCustomerOrderFilters(orders: Order[], statusFilter: string) {
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter === "todos") return true;
      if (statusFilter === "realizado") return order.status === "delivered";
      if (statusFilter === "pendente") return ["pending", "in_production", "ready"].includes(order.status);
      if (statusFilter === "cancelado") return order.status === "cancelled";
      return true;
    });
  }, [orders, statusFilter]);

  return {
    filteredOrders,
  };
} 