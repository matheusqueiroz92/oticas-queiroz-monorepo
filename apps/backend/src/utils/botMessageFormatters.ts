import { BOT_BACK_TO_MENU_LINE } from "../constants/botChatMessages";
import type {
  BotCustomerDebtsResponse,
  BotOrderSummaryResponse,
} from "../dto/bot/BotApiDtos";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_production: "Em produção",
  ready: "Pronto para retirada",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pagamento pendente",
  partially_paid: "Parcialmente pago",
  paid: "Pago",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatOrderResultMessage(
  order: BotOrderSummaryResponse
): string {
  const statusLabel =
    ORDER_STATUS_LABELS[order.status] ?? order.status;
  const paymentLabel =
    PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus;

  const lines = [
    `*Pedido O.S. ${order.serviceOrder}*`,
    "",
    `Status: *${statusLabel}*`,
    `Pagamento: ${paymentLabel}`,
    `Data do pedido: ${formatDate(order.orderDate)}`,
    `Previsão/entrega: ${formatDate(order.deliveryDate)}`,
    "",
    `Valor total: ${formatCurrency(order.totalPrice)}`,
    `Valor pago: ${formatCurrency(order.totalPaid)}`,
    `Saldo em aberto: ${formatCurrency(order.remainingAmount)}`,
    "",
    BOT_BACK_TO_MENU_LINE,
  ];

  return lines.join("\n");
}

export function formatDebtsResultMessage(
  debts: BotCustomerDebtsResponse
): string {
  if (debts.pendingDebts.length === 0) {
    return [
      `CPF consultado: *${debts.cpf}*`,
      "",
      "Não há débitos em aberto no momento. ✅",
      "",
      BOT_BACK_TO_MENU_LINE,
    ].join("\n");
  }

  const items = debts.pendingDebts
    .map((item, index) => {
      const os = item.serviceOrder ? `O.S. ${item.serviceOrder}` : "Sem O.S.";
      return [
        `*${index + 1}.* ${os}`,
        `   Saldo: ${formatCurrency(item.remainingAmount)}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `*Débitos — CPF ${debts.cpf}*`,
    "",
    `Total em aberto: *${formatCurrency(debts.totalDebt)}*`,
    "",
    items,
    "",
    BOT_BACK_TO_MENU_LINE,
  ].join("\n");
}
