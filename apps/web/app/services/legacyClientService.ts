import { api } from "./authService";
import type { LegacyClient } from "../types/legacy-client";

/**
 * Busca todos os clientes legados com opções de filtro
 */
export async function getAllLegacyClients(filters: Record<string, any> = {}): Promise<LegacyClient[]> {
  try {
    const response = await api.get("/api/legacy-clients", { params: filters });
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
    const response = await api.get(`/api/legacy-clients/${id}`);
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
    const response = await api.get(`/api/legacy-clients/search`, { 
      params: { identifier } 
    });
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
    const response = await api.get("/api/legacy-clients/debtors");
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
    const response = await api.get(`/api/legacy-clients/${id}/payment-history`);
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
    const response = await api.put(`/api/legacy-clients/${id}`, data);
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
    const response = await api.patch(`/api/legacy-clients/${id}/toggle-status`);
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
    const response = await api.post("/api/legacy-clients", clientData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar cliente legado:", error);
    return null;
  }
}