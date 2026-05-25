import { UserService } from "./UserService";
import { LegacyClientService } from "./LegacyClientService";
import { PaymentStatusService } from "./PaymentStatusService";
import { getRepositories } from "../repositories/RepositoryFactory";
import type { IPayment } from "../interfaces/IPayment";
import { logger } from "../config/logger";

export class SicrediPaymentSettlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SicrediPaymentSettlementError";
  }
}

/**
 * Centraliza efeitos colaterais quando um boleto SICREDI é confirmado como PAGO:
 * recálculo do pedido, histórico e redução idempotente do débito do cliente.
 */
export class SicrediPaymentSettlementService {
  private userService: UserService;
  private legacyClientService: LegacyClientService;
  private paymentStatusService: PaymentStatusService;
  private paymentRepository: ReturnType<typeof getRepositories>["paymentRepository"];

  constructor() {
    this.userService = new UserService();
    this.legacyClientService = new LegacyClientService();
    this.paymentStatusService = new PaymentStatusService();
    this.paymentRepository = getRepositories().paymentRepository;
  }

  async settlePaidBoleto(
    payment: IPayment,
    valorPago: number,
    dataPagamento?: Date
  ): Promise<{ debtAdjusted: boolean; orderUpdated: boolean }> {
    const paymentId = payment._id?.toString();
    if (!paymentId) {
      throw new SicrediPaymentSettlementError("Pagamento sem ID");
    }

    let debtAdjusted = false;
    let orderUpdated = false;

    const alreadySettled = Boolean(payment.bank_slip?.sicredi?.debtSettledAt);
    if (!alreadySettled && valorPago > 0) {
      await this.adjustClientDebt(payment, valorPago);
      await this.paymentRepository.update(paymentId, {
        bank_slip: {
          ...payment.bank_slip,
          sicredi: {
            ...payment.bank_slip?.sicredi,
            debtSettledAt: dataPagamento ?? new Date(),
          },
        },
      });
      debtAdjusted = true;
    }

    if (payment.orderId) {
      const orderId = payment.orderId.toString();
      const freshPayment = (await this.paymentRepository.findById(paymentId)) ?? payment;

      if (freshPayment.status === "completed") {
        await this.paymentStatusService.recalculateOrderPaymentStatus(orderId);

        const order = await getRepositories().orderRepository.findById(orderId);
        const history = order?.paymentHistory ?? [];
        const alreadyInHistory = history.some(
          (entry) => entry.paymentId?.toString() === paymentId
        );

        if (!alreadyInHistory) {
          await this.paymentStatusService.updateOrderPaymentStatus(
            orderId,
            paymentId,
            freshPayment.amount,
            freshPayment.paymentMethod,
            "add"
          );
        }
        orderUpdated = true;
      }
    }

    return { debtAdjusted, orderUpdated };
  }

  private async adjustClientDebt(payment: IPayment, valorPago: number): Promise<void> {
    const clientId = payment.customerId;
    const legacyClientId = payment.legacyClientId;

    if (!clientId && !legacyClientId) {
      logger.warn("SICREDI Settlement: pagamento sem cliente associado", {
        paymentId: payment._id,
      });
      return;
    }

    if (clientId) {
      const client = await this.userService.getUserById(clientId);
      if (client) {
        const currentDebt = client.debts || 0;
        const newDebt = Math.max(0, currentDebt - valorPago);
        await this.userService.updateUser(clientId, { debts: newDebt });
        logger.info("SICREDI Settlement: débito do cliente atualizado", {
          clientId,
          from: currentDebt,
          to: newDebt,
        });
      }
      return;
    }

    if (legacyClientId) {
      const legacyClient = await this.legacyClientService.getLegacyClientById(legacyClientId);
      if (legacyClient) {
        const currentDebt = legacyClient.totalDebt || 0;
        const newDebt = Math.max(0, currentDebt - valorPago);
        await this.legacyClientService.updateLegacyClient(legacyClientId, {
          totalDebt: newDebt,
        });
        logger.info("SICREDI Settlement: débito do cliente legado atualizado", {
          legacyClientId,
          from: currentDebt,
          to: newDebt,
        });
      }
    }
  }
}
