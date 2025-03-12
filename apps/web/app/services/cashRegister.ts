"use client";

import { api } from "../services/auth";
import { AxiosError } from "axios";
import type { CashRegister } from "../types/cash-register";

interface OpenCashRegisterData {
  openingBalance: number;
  observations?: string;
}

interface CloseCashRegisterData {
  closingBalance: number;
  observations?: string;
}

interface CashRegisterCheckResult {
  hasCashRegister: boolean;
  data: CashRegister | null;
}

interface CashRegisterFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
}

/**
 * Verifica se existe um caixa aberto no sistema
 * @returns Promise que resolve para um objeto com o caixa aberto ou null se não houver caixa
 */
export async function checkOpenCashRegister(): Promise<CashRegisterCheckResult> {
  try {
    // Primeiro tenta buscar diretamente o caixa atual
    try {
      const response = await api.get("/api/cash-registers/current");
      if (response.data && response.data.status === "open") {
        return {
          hasCashRegister: true,
          data: response.data as CashRegister,
        };
      }
    } catch (directError) {
      console.log("Erro ao buscar caixa diretamente:", directError);
      // Se falhar, continua com o método alternativo
    }

    // Método alternativo: buscar todos os caixas e filtrar pelo aberto
    try {
      const allRegistersResponse = await api.get("/api/cash-registers");
      let registers: CashRegister[] = [];

      if (Array.isArray(allRegistersResponse.data)) {
        registers = allRegistersResponse.data as CashRegister[];
      } else if (
        allRegistersResponse.data?.cashRegisters &&
        Array.isArray(allRegistersResponse.data.cashRegisters)
      ) {
        registers = allRegistersResponse.data.cashRegisters as CashRegister[];
      }

      const openRegister = registers.find(
        (register) => register.status === "open"
      );

      if (openRegister) {
        return {
          hasCashRegister: true,
          data: openRegister,
        };
      }
    } catch (listError) {
      console.log("Erro ao buscar lista de caixas:", listError);
    }

    // Se nenhum método funcionou, retorna que não há caixa aberto
    return {
      hasCashRegister: false,
      data: null,
    };
  } catch (error) {
    // Se retornar 404, significa que não há caixa aberto
    if (error instanceof AxiosError && error.response?.status === 404) {
      return {
        hasCashRegister: false,
        data: null,
      };
    }

    // Se for outro erro, propagar para tratamento adequado
    throw error;
  }
}

/**
 * Abre um novo caixa
 * @param data Dados para abertura do caixa
 * @returns Promise que resolve para a resposta da API
 */
export async function openCashRegister(data: OpenCashRegisterData) {
  return api.post("/api/cash-registers/open", data);
}

/**
 * Fecha um caixa existente
 * @param cashRegisterId ID do caixa a ser fechado
 * @param data Dados para fechamento do caixa
 * @returns Promise que resolve para a resposta da API
 */
export async function closeCashRegister(
  cashRegisterId: string,
  data: CloseCashRegisterData
) {
  return api.post("/api/cash-registers/close", {
    cashRegisterId,
    ...data,
  });
}

/**
 * Busca todos os caixas com filtragem opcional
 * @param filters Filtros opcionais para busca
 * @returns Promise que resolve para um array de caixas
 */
export async function getAllCashRegisters(filters: CashRegisterFilters = {}) {
  try {
    const response = await api.get("/api/cash-registers", { params: filters });

    // Normaliza a resposta para garantir consistência
    let registers: CashRegister[] = [];

    if (Array.isArray(response.data)) {
      registers = response.data as CashRegister[];
    } else if (
      response.data?.cashRegisters &&
      Array.isArray(response.data.cashRegisters)
    ) {
      registers = response.data.cashRegisters as CashRegister[];
    } else {
      // Caso não encontre um formato reconhecido, retorna array vazio
      registers = [];
    }

    return registers;
  } catch (error) {
    console.error("Erro ao buscar caixas:", error);
    return [] as CashRegister[];
  }
}
