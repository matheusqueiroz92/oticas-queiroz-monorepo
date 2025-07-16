import { useMemo } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Order } from '@/app/_types/order';
import type { User } from '@/app/_types/user';

export function useCustomerDetailsStats(customer: User | undefined | null, orders: Order[]) {
  const stats = useMemo(() => {
    if (!customer || !orders.length) {
      return {
        totalSpent: 0,
        totalOrders: 0,
        totalGlasses: 0,
        loyaltyPoints: 0,
        customerSince: "N/A",
        currentMonthSpent: 0,
        currentMonthOrders: 0,
        lastDeliveryDate: null as string | null,
        deliveredOrdersCount: 0,
      };
    }

    const totalSpent = orders.reduce((sum, order) => sum + (order.finalPrice || 0), 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(order => order.status === "delivered");
    const totalGlasses = deliveredOrders.reduce((sum, order) => sum + order.products.length, 0);
    const loyaltyPoints = Math.floor(totalSpent * 0.1); // 10% of total spent
    const customerSince = customer.createdAt 
      ? format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR }) 
      : "N/A";

    // Calcular dados do mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    const currentMonthSpent = currentMonthOrders.reduce((sum, order) => sum + (order.finalPrice || 0), 0);

    // Data da última entrega
    const lastDeliveryDate = deliveredOrders.length > 0 
      ? (deliveredOrders[0].createdAt || deliveredOrders[0].orderDate) as string | null
      : null;

    return {
      totalSpent,
      totalOrders,
      totalGlasses,
      loyaltyPoints,
      customerSince,
      currentMonthSpent,
      currentMonthOrders: currentMonthOrders.length,
      lastDeliveryDate,
      deliveredOrdersCount: deliveredOrders.length,
    };
  }, [customer, orders]);

  return stats;
} 