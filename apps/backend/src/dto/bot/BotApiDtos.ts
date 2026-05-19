import type { IOrder } from "../../interfaces/IOrder";
import type { ClientDebtsData } from "../../services/ClientDebtQueryService";
import {
  getOrderListTotalPrice,
  getOrderPaidFromEmbeddedPayments,
  getOrderRemainingDebt,
} from "../../utils/orderDebtMath";

export interface BotOrderSummaryResponse {
  serviceOrder: string;
  status: IOrder["status"];
  paymentStatus: IOrder["paymentStatus"];
  orderDate: string;
  deliveryDate: string | null;
  totalPrice: number;
  totalPaid: number;
  remainingAmount: number;
}

export interface BotDebtItemDto {
  orderId: string;
  serviceOrder: string | null;
  status: IOrder["status"];
  totalPrice: number;
  totalPaid: number;
  remainingAmount: number;
}

export interface BotCustomerDebtsResponse {
  cpf: string;
  totalDebt: number;
  pendingDebts: BotDebtItemDto[];
}

export function mapOrderToBotSummary(order: IOrder): BotOrderSummaryResponse {
  const serviceOrder = order.serviceOrder ?? "";
  const totalPrice = getOrderListTotalPrice(order);
  const totalPaid = getOrderPaidFromEmbeddedPayments(order);
  const remainingAmount = getOrderRemainingDebt(order);

  return {
    serviceOrder,
    status: order.status,
    paymentStatus: order.paymentStatus,
    orderDate:
      order.orderDate instanceof Date
        ? order.orderDate.toISOString()
        : new Date(order.orderDate).toISOString(),
    deliveryDate: order.deliveryDate
      ? order.deliveryDate instanceof Date
        ? order.deliveryDate.toISOString()
        : new Date(order.deliveryDate).toISOString()
      : null,
    totalPrice,
    totalPaid,
    remainingAmount,
  };
}

export function pickLatestOrder(orders: IOrder[]): IOrder {
  return [...orders].sort((a, b) => {
    const ta = a.updatedAt
      ? new Date(a.updatedAt).getTime()
      : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
    const tb = b.updatedAt
      ? new Date(b.updatedAt).getTime()
      : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;
    return tb - ta;
  })[0];
}

export function mapClientDebtsToBotDto(
  cpf: string,
  data: ClientDebtsData
): BotCustomerDebtsResponse {
  const pendingDebts: BotDebtItemDto[] = data.orders.map((row) => {
    const totalPrice = row.finalPrice;
    const totalPaid = row.paymentEntry;
    const remainingAmount = Math.max(0, totalPrice - totalPaid);
    const id = row._id != null ? String(row._id) : "";
    return {
      orderId: id,
      serviceOrder: row.serviceOrder ?? null,
      status: row.status,
      totalPrice,
      totalPaid,
      remainingAmount,
    };
  });

  return {
    cpf,
    totalDebt: data.totalDebt,
    pendingDebts,
  };
}
