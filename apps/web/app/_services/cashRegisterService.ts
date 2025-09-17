import { api } from "./authService";
import type {
  ICashRegister,
  OpenCashRegisterDTO,
  CloseCashRegisterDTO,
  CashRegisterCheckResult,
  CashRegisterSummary,
  CashRegisterFilters,
} from "@/app/_types/cash-register";
import { PaginationInfo } from "@/app/_types/api-response";
import { API_ROUTES } from "@/app/_constants/api-routes";

/**
 * Verifica se existe um caixa aberto no sistema
 */
export async function checkOpenCashRegister(): Promise<CashRegisterCheckResult> {
  try {
    const response = await api.get(API_ROUTES.CASH_REGISTERS.CURRENT);

    return {
      isOpen: true,
      data: response.data,
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as { response?: { status?: number } };

      if (apiError.response && apiError.response.status === 404) {
        // 404 é esperado quando não há caixa aberto - não é um erro
        return {
          isOpen: false,
          data: null,
        };
      }
    }

    // Só logar erros que não sejam 404
    console.error("Erro ao verificar caixa aberto:", error);

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
  const response = await api.post(API_ROUTES.CASH_REGISTERS.OPEN, data);
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
  const response = await api.post(API_ROUTES.CASH_REGISTERS.CLOSE, data);
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
    const response = await api.get(API_ROUTES.CASH_REGISTERS.BASE, {
      params: filters,
    });

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
    return { registers: [] };
  }
}

/**
 * Busca o registro de caixa atual
 */
export async function getCurrentCashRegister(): Promise<ICashRegister | null> {
  try {
    const response = await api.get(API_ROUTES.CASH_REGISTERS.CURRENT);
    return response.data;
  } catch (error) {
    // Não logar erro 404 para verificação de caixa atual (é esperado quando não há caixa aberto)
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status !== 404) {
        console.error(`Erro ao buscar caixa atual:`, error);
      }
    } else {
      console.error(`Erro ao buscar caixa atual:`, error);
    }
    return null;
  }
}

/**
 * Busca um registro de caixa específico por ID
 */
export async function getCashRegisterById(
  id: string
): Promise<ICashRegister | null> {
  try {
    const response = await api.get(API_ROUTES.CASH_REGISTERS.BY_ID(id));
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
    const response = await api.get(API_ROUTES.CASH_REGISTERS.SUMMARY(id));
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
  const response = await api.get(API_ROUTES.CASH_REGISTERS.EXPORT(id), {
    params: { format, title },
    responseType: "blob",
  });

  return response.data;
}
