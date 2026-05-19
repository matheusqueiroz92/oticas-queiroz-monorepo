import {
  mapOrderToBotSummary,
  pickLatestOrder,
  type BotOrderSummaryResponse,
} from "../../dto/bot/BotApiDtos";
import type { IOrder } from "../../interfaces/IOrder";
import { OrderService } from "../../services/OrderService";
import { NotFoundError, ValidationError } from "../../utils/AppError";
import { ErrorCode } from "../../utils/errorCodes";

const ORDER_NOT_FOUND_MESSAGE =
  "Não encontramos um pedido com este número de ordem de serviço (O.S.). Verifique o número e tente novamente.";

function normalizeServiceOrder(raw: string): string {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .trim();
}

export class GetBotOrderByOsUseCase {
  constructor(private readonly orderService: OrderService = new OrderService()) {}

  async execute(osNumberRaw: string): Promise<BotOrderSummaryResponse> {
    const serviceOrder = normalizeServiceOrder(osNumberRaw);
    if (!serviceOrder) {
      throw new ValidationError(
        "Número da O.S. inválido. Informe apenas os dígitos da ordem de serviço.",
        ErrorCode.VALIDATION_ERROR
      );
    }
    if (serviceOrder.length > 20) {
      throw new ValidationError(
        "Número da O.S. inválido.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    const orders: IOrder[] = await this.orderService.getOrdersByServiceOrder(
      serviceOrder
    );
    if (orders.length === 0) {
      throw new NotFoundError(
        ORDER_NOT_FOUND_MESSAGE,
        ErrorCode.RESOURCE_NOT_FOUND
      );
    }

    const order: IOrder =
      orders.length === 1 ? orders[0] : pickLatestOrder(orders);
    return mapOrderToBotSummary(order);
  }
}
