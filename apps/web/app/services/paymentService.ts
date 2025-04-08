import { api } from "./authService";
import type {
  IPayment,
  CreatePaymentDTO,
  PaymentType,
  PaymentStatus,
} from "../types/payment";

interface PaymentFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: PaymentType;
  paymentMethod?: string;
  status?: PaymentStatus;
  search?: string;
  cashRegisterId?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DailyFinancialReportData {
  date: string;
  totalSales: number;
  totalDebtPayments: number;
  totalExpenses: number;
  dailyBalance: number;
  totalByCreditCard: number;
  totalByDebitCard: number;
  totalByCash: number;
  totalByPix: number;
  payments: IPayment[];
}

/**
 * Cria um novo pagamento
 */
export async function createPayment(data: CreatePaymentDTO): Promise<IPayment> {
  const response = await api.post("/api/payments", data);
  return response.data;
}

/**
 * Busca um pagamento por ID
 */
export async function getPaymentById(id: string): Promise<IPayment | null> {
  try {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar pagamento com ID ${id}:`, error);
    return null;
  }
}

/**
 * Busca todos os pagamentos com filtros opcionais
 */
export async function getAllPayments(filters: PaymentFilters = {}): Promise<{
  payments: IPayment[];
  pagination?: PaginationInfo;
}> {
  try {
    const response = await api.get("/api/payments", { params: filters });

    // Normalizar a resposta para garantir consistência
    let payments: IPayment[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      payments = response.data;
    } else if (response.data?.payments) {
      payments = response.data.payments;
      pagination = response.data.pagination;
    }

    return { payments, pagination };
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    return { payments: [] };
  }
}

/**
 * Busca pagamentos de um dia específico
 */
export async function getDailyPayments(
  date?: Date,
  type?: PaymentType
): Promise<IPayment[]> {
  try {
    const params: { date?: string; type?: PaymentType } = {};

    if (date) {
      params.date = date.toISOString().split("T")[0];
    }

    if (type) {
      params.type = type;
    }

    const response = await api.get("/api/payments/daily", { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar pagamentos diários:", error);
    return [];
  }
}

/**
 * Cancela um pagamento
 */
export async function cancelPayment(id: string): Promise<IPayment | null> {
  try {
    const response = await api.post(`/api/payments/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao cancelar pagamento com ID ${id}:`, error);
    return null;
  }
}

/**
 * Busca pagamentos por caixa
 */
export async function getPaymentsByCashRegister(
  cashRegisterId: string
): Promise<IPayment[]> {
  try {
    const response = await api.get("/api/payments", {
      params: { 
        cashRegisterId, 
        limit: 1000
      },
    });

    let payments: IPayment[] = [];

    if (Array.isArray(response.data)) {
      payments = response.data;
    } else if (response.data?.payments) {
      payments = response.data.payments;
    }

    return payments;
  } catch (error) {
    console.error(
      `Erro ao buscar pagamentos do caixa ${cashRegisterId}:`,
      error
    );
    return [];
  }
}

/**
 * Exporta pagamentos em um formato específico
 */
export async function exportPayments(
  filters: PaymentFilters = {},
  format: "excel" | "pdf" | "csv" | "json" = "excel",
  title?: string
): Promise<Blob> {
  const params = {
    ...filters,
    format,
    title,
  };

  const response = await api.get("/api/payments/export", {
    params,
    responseType: "blob",
  });

  return response.data;
}

/**
 * Gera relatório financeiro diário
 */
export async function getDailyFinancialReport(
  date?: Date,
  format: "excel" | "pdf" | "csv" | "json" = "json"
): Promise<DailyFinancialReportData | Blob> {
  const params: { date?: string; format: string } = { format };

  if (date) {
    params.date = date.toISOString().split("T")[0];
  }

  const response = await api.get("/api/payments/report/daily", {
    params,
    responseType: format === "json" ? "json" : "blob",
  });

  return response.data;
}
