import type { IOrder } from "../interfaces/IOrder";

/** Valor total de venda usado no fluxo de débitos (alinhado a pedidos parcelados no ERP). */
export function getOrderListTotalPrice(order: IOrder): number {
  return order.finalPrice ?? order.totalPrice;
}

/**
 * Total já pago conforme entradas gravadas no pedido (entrada + histórico embutido).
 * Mantém paridade com ClientDebtQueryService / painel de débitos.
 */
export function getOrderPaidFromEmbeddedPayments(order: IOrder): number {
  const entry = order.paymentEntry ?? 0;
  const history = order.paymentHistory ?? [];
  return entry + history.reduce((sum, e) => sum + e.amount, 0);
}

export function getOrderRemainingDebt(order: IOrder): number {
  const total = getOrderListTotalPrice(order);
  const paid = getOrderPaidFromEmbeddedPayments(order);
  return Math.max(0, total - paid);
}

export function orderHasEmbeddedDebt(order: IOrder): boolean {
  if (order.status === "cancelled") return false;
  const total = getOrderListTotalPrice(order);
  const paid = getOrderPaidFromEmbeddedPayments(order);
  return paid < total;
}
