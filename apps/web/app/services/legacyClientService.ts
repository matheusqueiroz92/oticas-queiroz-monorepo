import { api } from "./authService";
import type { LegacyClient } from "../types/legacy-client";
import { API_ROUTES } from "../constants/api-routes";

/**
 * Busca todos os clientes legados com opções de filtro
 */
export async function getAllLegacyClients(filters: Record<string, any> = {}): Promise<LegacyClient[]> {
  try {
    const response = await api.get(API_ROUTES.LEGACY_CLIENTS.BASE, { params: filters });
    return Array.isArray(response.data) ? response.data : response.data?.clients || [];
  } catch (error) {
    console.error("Erro ao buscar clientes legados:", error);
    return [];
  }
}

/**
 * Busca cliente legado pelo ID
 */
export async function getLegacyClientById(id: string): Promise<LegacyClient | null> {
  try {
    const response = await api.get(API_ROUTES.LEGACY_CLIENTS.BY_ID(id));
    return response.data || null;
  } catch (error) {
    console.error(`Erro ao buscar cliente legado com ID ${id}:`, error);
    return null;
  }
}

/**
 * Busca um cliente legado pelo documento (CPF/CNPJ)
 */
export async function searchLegacyClientByIdentifier(identifier: string): Promise<LegacyClient | null> {
  try {
    const response = await api.get(API_ROUTES.LEGACY_CLIENTS.SEARCH(identifier));
    return response.data || null;
  } catch (error) {
    console.error(`Erro ao buscar cliente legado pelo documento ${identifier}:`, error);
    return null;
  }
}

/**
 * Busca os clientes com dívidas
 */
export async function getDebtors(): Promise<LegacyClient[]> {
  try {
    const response = await api.get(API_ROUTES.LEGACY_CLIENTS.DEBTORS);
    return Array.isArray(response.data) ? response.data : response.data?.clients || [];
  } catch (error) {
    console.error("Erro ao buscar clientes com dívidas:", error);
    return [];
  }
}

/**
 * Busca o histórico de pagamentos de um cliente legado
 */
export async function getPaymentHistory(id: string): Promise<any[]> {
  try {
    const response = await api.get(API_ROUTES.LEGACY_CLIENTS.PAYMENT_HISTORY(id));
    return response.data?.paymentHistory || [];
  } catch (error) {
    console.error(`Erro ao buscar histórico de pagamentos para cliente ${id}:`, error);
    return [];
  }
}

/**
 * Atualiza um cliente legado
 */
export async function updateLegacyClient(id: string, data: Partial<LegacyClient>): Promise<LegacyClient | null> {
  try {
    const response = await api.put(API_ROUTES.LEGACY_CLIENTS.UPDATE(id), data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar cliente legado ${id}:`, error);
    return null;
  }
}

/**
 * Altera o status de um cliente legado (ativo/inativo)
 */
export async function toggleLegacyClientStatus(id: string): Promise<LegacyClient | null> {
  try {
    const response = await api.patch(API_ROUTES.LEGACY_CLIENTS.TOGGLE_STATUS(id));
    return response.data;
  } catch (error) {
    console.error(`Erro ao alterar status do cliente legado ${id}:`, error);
    return null;
  }
}

/**
 * Cria um novo cliente legado
 */
export async function createLegacyClient(clientData: Omit<LegacyClient, "_id">): Promise<LegacyClient | null> {
  try {
    const response = await api.post(API_ROUTES.LEGACY_CLIENTS.CREATE, clientData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar cliente legado:", error);
    return null;
  }
}