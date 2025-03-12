import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  PaymentType,
  PaymentMethod,
  PaymentStatus,
} from "../types/payment";

/**
 * Formata um valor numérico como moeda (R$)
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata uma data no formato DD/MM/YYYY
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return "Data não disponível";

  try {
    // Se for string, converter para Date
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Verificar se a data é válida
    if (Number.isNaN(dateObj.getTime())) {
      return "Data inválida";
    }

    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
}

/**
 * Formata uma data e hora no formato DD/MM/YYYY HH:MM
 */
export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return "Data não disponível";

  try {
    // Se for string, converter para Date
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Verificar se a data é válida
    if (Number.isNaN(dateObj.getTime())) {
      return "Data inválida";
    }

    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data e hora:", error);
    return "Data inválida";
  }
}

/**
 * Traduz o tipo de pagamento
 */
export function translatePaymentType(type: PaymentType | string): string {
  const types: Record<string, string> = {
    sale: "Venda",
    debt_payment: "Pagamento de Dívida",
    expense: "Despesa",
  };

  return types[type] || type;
}

/**
 * Traduz o método de pagamento
 */
export function translatePaymentMethod(method: PaymentMethod | string): string {
  const methods: Record<string, string> = {
    credit: "Cartão de Crédito",
    debit: "Cartão de Débito",
    cash: "Dinheiro",
    pix: "PIX",
    installment: "Parcelado",
    check: "Cheque",
  };

  return methods[method] || method;
}

/**
 * Traduz o status do pagamento
 */
export function translatePaymentStatus(status: PaymentStatus | string): string {
  const statuses: Record<string, string> = {
    pending: "Pendente",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  return statuses[status] || status;
}

/**
 * Obtém a classe CSS para o status do pagamento
 */
export function getPaymentStatusClass(status: PaymentStatus | string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Obtém a classe CSS para o tipo de pagamento
 */
export function getPaymentTypeClass(type: PaymentType | string): string {
  switch (type) {
    case "sale":
      return "bg-green-100 text-green-800";
    case "debt_payment":
      return "bg-blue-100 text-blue-800";
    case "expense":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
