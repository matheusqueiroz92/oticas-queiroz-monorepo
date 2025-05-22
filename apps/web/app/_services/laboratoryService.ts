import { api } from "./authService";
import type { Laboratory } from "../_types/laboratory";

interface LaboratoryFilters {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Busca todos os laboratórios com opções de filtro
 */
export async function getAllLaboratories(
  filters: LaboratoryFilters = {}
): Promise<{
  laboratories: Laboratory[];
  pagination?: PaginationInfo;
}> {
  try {
    const response = await api.get("/api/laboratories", { params: filters });

    // Normalizar a resposta para garantir consistência
    let laboratories: Laboratory[] = [];
    let pagination: PaginationInfo | undefined = undefined;

    if (Array.isArray(response.data)) {
      laboratories = response.data;
    } else if (response.data?.laboratories) {
      laboratories = response.data.laboratories;
      pagination = response.data.pagination;
    }

    return { laboratories, pagination };
  } catch (error) {
    console.error("Erro ao buscar laboratórios:", error);
    throw error;
  }
}

/**
 * Busca um laboratório específico pelo ID
 */
export async function getLaboratoryById(
  id: string
): Promise<Laboratory | null> {
  try {
    const response = await api.get(`/api/laboratories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar laboratório com ID ${id}:`, error);
    return null;
  }
}

/**
 * Cria um novo laboratório
 */
export async function createLaboratory(
  data: Omit<Laboratory, "_id">
): Promise<Laboratory> {
  try {
    const response = await api.post("/api/laboratories", data);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar laboratório:", error);
    throw error;
  }
}

/**
 * Atualiza um laboratório existente
 */
export async function updateLaboratory(
  id: string,
  data: Partial<Laboratory>
): Promise<Laboratory> {
  try {
    const response = await api.put(`/api/laboratories/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar laboratório com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Alterna o status de um laboratório (ativo/inativo)
 */
export async function toggleLaboratoryStatus(id: string): Promise<Laboratory> {
  try {
    const response = await api.patch(`/api/laboratories/${id}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error(
      `Erro ao alternar status do laboratório com ID ${id}:`,
      error
    );
    throw error;
  }
}

/**
 * Exclui um laboratório
 */
export async function deleteLaboratory(id: string): Promise<void> {
  try {
    await api.delete(`/api/laboratories/${id}`);
  } catch (error) {
    console.error(`Erro ao excluir laboratório com ID ${id}:`, error);
    throw error;
  }
}
