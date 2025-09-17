import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
export function translatePaymentType(type: string): string {
  switch (type) {
    case "sale":
      return "Venda";
    case "debt_payment":
      return "Pagamento de Débito";
    case "expense":
      return "Despesa";
    default:
      return type;
  }
}

/**
 * Traduz o método de pagamento
 */
export function translatePaymentMethod(method: string): string {
  switch (method) {
    case "credit":
      return "Cartão de Crédito";
    case "debit":
      return "Cartão de Débito";
    case "cash":
      return "Dinheiro";
    case "pix":
      return "PIX";
    case "bank_slip":
      return "Boleto Bancário";
    case "promissory_note":
      return "Nota Promissória";
    case "check":
      return "Cheque";
    case "mercado_pago":
      return "Mercado Pago";
    case "sicredi_boleto":
      return "Boleto SICREDI";
    default:
      return method;
  }
}

/**
 * Traduz o status do pagamento
 */
export function translatePaymentStatus(status: string): string {
  switch (status) {
    case "pending":
      return "Pendente";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    case "approved":
      return "Aprovado"; // Status do Mercado Pago
    case "in_process":
      return "Em Processamento"; // Status do Mercado Pago
    case "rejected":
      return "Rejeitado"; // Status do Mercado Pago
    case "refunded":
      return "Reembolsado"; // Status do Mercado Pago
    case "charged_back":
      return "Estornado"; // Status do Mercado Pago
    default:
      return status;
  }
}

/**
 * Traduz o status do pedido
 */
export function translateOrderStatus(status: string): string {
  const statuses: Record<string, string> = {
    pending: "Pendente",
    in_production: "Em Produção",
    ready: "Pronto",
    delivered: "Entregue",
  };

  return statuses[status] || status;
}

/**
 * Obtém a classe CSS para o status do pedido
 */
export function getOrderStatusClass(status: string): string {
  switch (status) {
    case "pending":
      return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
    case "in_production":
      return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
    case "ready":
      return "text-green-600 bg-green-100 px-2 py-1 rounded";
    case "delivered":
      return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
    default:
      return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
  }
}

/**
 * Formata valores de grau
 */
// Em formatters.ts ou no componente onde formatRefractionValue está definido
export function formatRefractionValue(value?: string | number): string {
  if (value === undefined || value === null || value === "") return "N/A";

  // Se o valor for exatamente zero, mostrar como "Neutro"
  if (value === 0 || value === "0" || value === "+0" || value === "-0") return "Neutro";

  // Para string, primeiro converter para número
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Se não foi possível converter, retornar o valor original
  if (isNaN(numValue)) return String(value);

  // Para outros valores, mostrar sinal de + para positivos
  const prefix = numValue > 0 ? "+" : "";
  return `${prefix}${numValue.toFixed(2).replace(".", ",")}`;
}

/**
 * Obtém a classe CSS para o status do pagamento
 */
export function getPaymentStatusClass(status: string): string {
  switch (status) {
    case "completed":
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
    case "in_process":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
    case "rejected":
    case "refunded":
    case "charged_back":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Obtém a classe CSS para o tipo de pagamento
 */
export function getPaymentTypeClass(type: string): string {
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

/**
 * Função utilitária para combinar nomes de classes com tailwind
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}


/**
 * Função utilitária para buscar o dia de amanhã
 */
export const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  /**
 * Formata um CNPJ adicionando pontos, barra e traço
 * Formato: XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(value: string): string {
  const cnpj = value.replace(/\D/g, '');
  
  if (cnpj.length <= 2) {
    return cnpj;
  }
  if (cnpj.length <= 5) {
    return cnpj.replace(/^(\d{2})(\d+)/, '$1.$2');
  }
  if (cnpj.length <= 8) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  }
  if (cnpj.length <= 12) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  }
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
}


// export const getStatusIcon = (status: string) => {
//   switch (status) {
//     case "completed":
//       return <CheckCircle className="h-5 w-5 text-green-600" />;
//     case "pending":
//       return <Loader2 className="h-5 w-5 text-yellow-600" />;
//     case "cancelled":
//       return <Ban className="h-5 w-5 text-red-600" />;
//     default:
//       return null;
//   }
// };