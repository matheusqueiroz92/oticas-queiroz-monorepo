// utils/cash-register-utils.ts

import { api } from "../services/auth";
import { toast } from "@/hooks/use-toast";

export interface CashRegister {
  _id: string;
  date: string;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  openedBy: string;
  closedBy?: string;
  totalSales: number;
  totalPayments: number;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Verifica o estado atual do caixa e força uma atualização se necessário
 * @returns {Promise<{ hasOpenRegister: boolean, activeCashRegister: CashRegister | null }>} - Estado do caixa
 */
export async function checkCashRegisterStatus(): Promise<{
  hasOpenRegister: boolean;
  activeCashRegister: CashRegister | null;
}> {
  try {
    // Primeiro, verifica o estado atual do caixa pelo endpoint específico
    let activeCashRegister: CashRegister | null = null;
    let hasOpenRegister = false;

    try {
      const currentResponse = await api.get("/api/cash-registers/current");
      if (currentResponse.data && currentResponse.data.status === "open") {
        hasOpenRegister = true;
        activeCashRegister = currentResponse.data;
      }
    } catch (error) {
      console.log("Não há caixa aberto pelo endpoint current");
      // Se o endpoint retornar 404, significa que não há caixa aberto
      hasOpenRegister = false;
    }

    // Se não encontrou caixa aberto, verifica a lista de caixas para garantir
    if (!hasOpenRegister) {
      const response = await api.get("/api/cash-registers");

      // Extrair os registros, lidando com diferentes formatos de resposta
      const registers = Array.isArray(response.data)
        ? response.data
        : response.data?.cashRegisters || [];

      // Procurar por um caixa aberto
      const openRegister = registers.find(
        (register: CashRegister) => register.status === "open"
      );

      if (openRegister) {
        hasOpenRegister = true;
        activeCashRegister = openRegister;
        console.log("Encontrou caixa aberto na listagem", openRegister);
      }
    }

    return { hasOpenRegister, activeCashRegister };
  } catch (error) {
    console.error("Erro ao verificar estado do caixa:", error);
    return { hasOpenRegister: false, activeCashRegister: null };
  }
}

/**
 * Força o fechamento de um caixa que está causando conflito
 * @param {string} cashRegisterId - ID do caixa para forçar fechamento
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function forceCloseCashRegister(
  cashRegisterId: string
): Promise<boolean> {
  try {
    const currentBalance = await getCashRegisterBalance(cashRegisterId);

    // Envia requisição para forçar fechamento
    await api.post("/api/cash-registers/close", {
      cashRegisterId,
      closingBalance: currentBalance,
      observations: "Fechamento automático devido a inconsistência de estado",
    });

    return true;
  } catch (error) {
    console.error("Erro ao forçar fechamento do caixa:", error);
    return false;
  }
}

/**
 * Obtém o saldo atual de um caixa
 * @param {string} cashRegisterId - ID do caixa
 * @returns {Promise<number>} - Saldo atual
 */
async function getCashRegisterBalance(cashRegisterId: string): Promise<number> {
  try {
    const response = await api.get(`/api/cash-registers/${cashRegisterId}`);
    return response.data.currentBalance || 0;
  } catch (error) {
    console.error("Erro ao obter saldo do caixa:", error);
    return 0;
  }
}

/**
 * Função de reparo para corrigir inconsistências no estado do caixa
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function repairCashRegisterState(): Promise<boolean> {
  try {
    // Verificar estado atual
    const { hasOpenRegister, activeCashRegister } =
      await checkCashRegisterStatus();

    // Se há um caixa aberto mas ele está em estado inconsistente, força o fechamento
    if (hasOpenRegister && activeCashRegister) {
      console.log("Reparando estado do caixa", activeCashRegister);

      // Verifica se o caixa realmente existe e está aberto, para garantir
      try {
        const verifyResponse = await api.get(
          `/api/cash-registers/${activeCashRegister._id}`
        );
        if (verifyResponse.data.status !== "open") {
          // Se não está aberto no backend individual, mas aparece como aberto na lista,
          // há uma inconsistência que precisamos consertar
          return await forceCloseCashRegister(activeCashRegister._id);
        }
      } catch (error) {
        // Se o caixa não existe, mas está listado como aberto, é uma inconsistência
        console.error("Caixa inconsistente detectado:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao reparar estado do caixa:", error);
    return false;
  }
}

/**
 * Lista todos os caixas disponíveis
 * @returns {Promise<CashRegister[]>} - Lista de caixas
 */
export async function listAvailableCashRegisters(): Promise<CashRegister[]> {
  try {
    const response = await api.get("/api/cash-registers");

    // Extrair os registros, lidando com diferentes formatos de resposta
    const registers = Array.isArray(response.data)
      ? response.data
      : response.data?.cashRegisters || [];

    return registers;
  } catch (error) {
    console.error("Erro ao listar caixas disponíveis:", error);
    return [];
  }
}
