import type { IPayment } from "../interfaces/IPayment";
import type { IOrder } from "../interfaces/IOrder";
import { OrderService } from "./OrderService";
import { PaymentService } from "./PaymentService";
import { UserService } from "./UserService";
import {
  getOrderListTotalPrice,
  getOrderPaidFromEmbeddedPayments,
  getOrderRemainingDebt,
  orderHasEmbeddedDebt,
} from "../utils/orderDebtMath";

export interface ClientDebtsOrderRow {
  _id: IOrder["_id"];
  serviceOrder: IOrder["serviceOrder"];
  createdAt: IOrder["createdAt"];
  status: IOrder["status"];
  finalPrice: number;
  /** Total pago (entrada + histórico no pedido); nome legado mantido para compatibilidade com a API existente. */
  paymentEntry: number;
}

export interface ClientDebtsData {
  totalDebt: number;
  paymentHistory: IPayment[];
  orders: ClientDebtsOrderRow[];
}

export class ClientDebtQueryService {
  constructor(
    private readonly orderService: OrderService = new OrderService(),
    private readonly paymentService: PaymentService = new PaymentService(),
    private readonly userService: UserService = new UserService()
  ) {}

  /**
   * Débitos e histórico de pagamentos do cliente (cálculo em tempo real a partir dos pedidos).
   */
  async getClientDebtsData(clientId: string): Promise<ClientDebtsData> {
    await this.userService.getUserById(clientId);

    const allOrders = await this.orderService.getOrdersByClientId(clientId);

    const ordersWithDebt = allOrders.filter((order) => orderHasEmbeddedDebt(order));

    const calculatedTotalDebt = ordersWithDebt.reduce(
      (total, order) => total + getOrderRemainingDebt(order),
      0
    );

    const paymentHistory = await this.paymentService.getAllPayments(1, 100, {
      customerId: clientId,
    });

    return {
      totalDebt: calculatedTotalDebt,
      paymentHistory: paymentHistory.payments || [],
      orders: ordersWithDebt.map((order) => ({
        _id: order._id,
        serviceOrder: order.serviceOrder,
        createdAt: order.createdAt,
        status: order.status,
        finalPrice: getOrderListTotalPrice(order),
        paymentEntry: getOrderPaidFromEmbeddedPayments(order),
      })),
    };
  }
}
