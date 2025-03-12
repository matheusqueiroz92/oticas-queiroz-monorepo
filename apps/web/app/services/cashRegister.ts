import { api } from "./auth";
import type {
  ICashRegister,
  OpenCashRegisterDTO,
  CloseCashRegisterDTO,
} from "../types/cash-register";

interface CashRegisterFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
}

interface CashRegisterCheckResult {
  isOpen: boolean;
  data: ICashRegister | null;
  error?: string;
}

interface CashRegisterSummary {
  register: ICashRegister;
  payments: {
    sales: {
      total: number;
      byMethod: Record<string, number>;
    };
    debts: {
      received: number;
      byMethod: Record<string, number>;
    };
    expenses: {
      total: number;
      byCategory: Record<string, number>;
    };
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Verifica se existe um caixa aberto no sistema
 */
export async function checkOpenCashRegister(): Promise<CashRegisterCheckResult> {
  try {
    const response = await api.get("/api/cash-registers/current");

    if (response.data && response.data.status === "open") {
      return {
        isOpen: true,
        data: response.data,
      };
    }

    return {
      isOpen: false,
      data: null,
    };
  } catch (error) {
    console.error("Erro ao verificar caixa aberto:", error);

    // Tentar método alternativo
    try {
      const allRegistersResponse = await api.get("/api/cash-registers");
      let registers: ICashRegister[] = [];

      if (Array.isArray(allRegistersResponse.data)) {
        registers = allRegistersResponse.data;
      } else if (allRegistersResponse.data?.cashRegisters) {
        registers = allRegistersResponse.data.cashRegisters;
      }

      const openRegister = registers.find(
        (register) => register.status === "open"
      );

      if (openRegister) {
        return {
          isOpen: true,
          data: openRegister,
        };
      }
    } catch (fallbackError) {
      console.error("Erro ao tentar método alternativo:", fallbackError);
    }

    // Se chegou aqui, não encontrou caixa aberto
    return {
      isOpen: false,
      data: null,
      error: "Não foi possível verificar caixa aberto",
    };
  }
}

/**
 * Abre um novo caixa
 */
export async function openCashRegister(
  data: OpenCashRegisterDTO
): Promise<ICashRegister> {
  const response = await api.post("/api/cash-registers/open", data);
  return response.data;
}

/**
 * Fecha um caixa aberto
 */
export async function closeCashRegister(
  id: string,
  data: CloseCashRegisterDTO
): Promise<ICashRegister> {
  const response = await api.post("/api/cash-registers/close", {
    ...data,
  });
  return response.data;
}

/**
 * Busca todos os registros de caixa com filtros opcionais
 */
export async function getAllCashRegisters(
  filters: CashRegisterFilters = {}
): Promise<{
  registers: ICashRegister[];
  pagination?: PaginationInfo;
}> {
  try {
    const response = await api.get("/api/cash-registers", { params: filters });

    // Normalizar a resposta para garantir consistência
    let registers: ICashRegister[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      registers = response.data;
    } else if (response.data?.cashRegisters) {
      registers = response.data.cashRegisters;
      pagination = response.data.pagination;
    }

    return { registers, pagination };
  } catch (error) {
    console.error("Erro ao buscar registros de caixa:", error);
    return { registers: [] };
  }
}

/**
 * Busca um registro de caixa específico por ID
 */
export async function getCashRegisterById(
  id: string
): Promise<ICashRegister | null> {
  try {
    const response = await api.get(`/api/cash-registers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar caixa com ID ${id}:`, error);
    return null;
  }
}

/**
 * Busca o resumo de um registro de caixa
 */
export async function getCashRegisterSummary(
  id: string
): Promise<CashRegisterSummary | null> {
  try {
    const response = await api.get(`/api/cash-registers/${id}/summary`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar resumo do caixa com ID ${id}:`, error);
    return null;
  }
}

/**
 * Exporta um resumo de caixa em um formato específico
 */
export async function exportCashRegisterSummary(
  id: string,
  format: "excel" | "pdf" | "csv" | "json" = "excel",
  title?: string
): Promise<Blob> {
  const response = await api.get(`/api/cash-registers/${id}/export`, {
    params: { format, title },
    responseType: "blob",
  });

  return response.data;
}
