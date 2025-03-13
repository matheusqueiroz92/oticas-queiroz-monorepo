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
    console.log("Verificando caixas abertos...");

    // Usar a rota /api/cash-registers/current que retorna apenas o caixa aberto
    const response = await api.get("/api/cash-registers/current");

    return {
      isOpen: true,
      data: response.data,
    };
  } catch (error: unknown) {
    console.error("Erro ao verificar caixa aberto:", error);

    // Verificar se o erro é uma instância de Error com a propriedade response
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as { response?: { status?: number } };

      // Se receber um erro 404, significa que não há caixa aberto (comportamento esperado da API)
      if (apiError.response && apiError.response.status === 404) {
        return {
          isOpen: false,
          data: null,
        };
      }
    }

    return {
      isOpen: false,
      data: null,
      error: "Não foi possível verificar o status do caixa",
    };
  }
}

/**
 * Abre um novo caixa
 * Corrigido para usar o padrão do backend com 's' (cash-registers)
 */
export async function openCashRegister(
  data: OpenCashRegisterDTO
): Promise<ICashRegister> {
  console.log("Abrindo caixa com dados:", data);
  const response = await api.post("/api/cash-registers/open", data);
  return response.data;
}

/**
 * Fecha um caixa aberto
 * Corrigido para usar o padrão do backend com 's' (cash-registers)
 */
export async function closeCashRegister(
  id: string,
  data: CloseCashRegisterDTO
): Promise<ICashRegister> {
  console.log(`Fechando caixa ${id} com dados:`, data);
  // O backend espera os dados no corpo da requisição, sem o ID
  const response = await api.post("/api/cash-registers/close", data);
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
    console.log("Buscando registros de caixa com filtros:", filters);
    const response = await api.get("/api/cash-registers", { params: filters });

    // Normalizar a resposta para garantir consistência
    let registers: ICashRegister[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      registers = response.data;
    } else if (response.data?.registers) {
      registers = response.data.registers;
      pagination = response.data.pagination;
    } else if (response.data?.cashRegisters) {
      registers = response.data.cashRegisters;
      pagination = response.data.pagination;
    }

    return { registers, pagination };
  } catch (error: unknown) {
    console.error("Erro ao buscar registros de caixa:", error);
    // Em caso de erro, retornar lista vazia
    return { registers: [] };
  }
}

/**
 * Busca um registro de caixa específico por ID
 * Corrigido para usar o padrão do backend com 's' (cash-registers)
 */
export async function getCashRegisterById(
  id: string
): Promise<ICashRegister | null> {
  try {
    console.log(`Buscando caixa com ID ${id}`);
    const response = await api.get(`/api/cash-registers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar caixa com ID ${id}:`, error);
    return null;
  }
}

/**
 * Busca o resumo de um registro de caixa
 * Corrigido para usar o padrão do backend com 's' (cash-registers)
 */
export async function getCashRegisterSummary(
  id: string
): Promise<CashRegisterSummary | null> {
  try {
    console.log(`Buscando resumo do caixa com ID ${id}`);
    const response = await api.get(`/api/cash-registers/${id}/summary`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar resumo do caixa com ID ${id}:`, error);
    return null;
  }
}

/**
 * Exporta um resumo de caixa em um formato específico
 * Corrigido para usar o padrão do backend com 's' (cash-registers)
 */
export async function exportCashRegisterSummary(
  id: string,
  format: "excel" | "pdf" | "csv" | "json" = "excel",
  title?: string
): Promise<Blob> {
  console.log(`Exportando resumo do caixa ${id} em formato ${format}`);
  const response = await api.get(`/api/cash-registers/${id}/export`, {
    params: { format, title },
    responseType: "blob",
  });

  return response.data;
}
