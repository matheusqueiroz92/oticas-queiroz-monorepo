import { api } from "./authService";
import { API_ROUTES } from "../_constants/api-routes";
import type {
  IReport,
  CreateReportDTO,
  ReportType,
  ReportStatus,
  ReportFormat,
} from "../_types/report";

interface ReportFilters {
  page?: number;
  limit?: number;
  type?: ReportType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Cria um novo relatório
 */
export const createReport = async (data: CreateReportDTO): Promise<IReport> => {
  try {
    const response = await api.post(API_ROUTES.REPORTS.BASE, data);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar relatório:", error);
    throw error;
  }
};

/**
 * Busca um relatório pelo seu ID
 */
export const getReportById = async (id: string): Promise<IReport> => {
  try {
    const response = await api.get(API_ROUTES.REPORTS.BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar relatório com ID ${id}:`, error);
    throw error;
  }
};

/**
 * Busca os relatórios do usuário com paginação e filtros
 */
export const getUserReports = async (
  page = 1, 
  limit = 10, 
  filters: ReportFilters = {}
): Promise<{ reports: IReport[]; pagination: any }> => {
  try {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`${API_ROUTES.REPORTS.BASE}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    throw error;
  }
};

/**
 * Baixa um relatório no formato especificado
 */
export const downloadReport = async (
  id: string, 
  format: ReportFormat = 'excel'
): Promise<Blob> => {
  try {
    console.log(`Iniciando download do relatório ${id} no formato ${format}`);
    
    const url = `${API_ROUTES.REPORTS.DOWNLOAD(id)}?format=${format}`;
    
    const response = await api.get(url, {
      responseType: 'blob',
      timeout: 60000, // 60 segundos para relatórios maiores
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao baixar relatório ${id}:`, error);
    throw error;
  }
};

// Exportação do serviço como um objeto para facilitar o uso com hooks
export const reportService = {
  createReport,
  getReportById,
  getUserReports,
  downloadReport,
};
