import { api } from "./authService";
import { API_ROUTES } from "../constants/api-routes";
import type {
  IReport,
  CreateReportDTO,
  ReportType,
  ReportStatus,
  ReportFormat,
  ReportsResponse,
} from "../types/report";

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
export async function createReport(data: CreateReportDTO): Promise<IReport> {
  const response = await api.post(API_ROUTES.REPORTS.BASE, data);
  return response.data;
}

/**
 * Busca um relatório por ID
 */
export async function getReportById(id: string): Promise<IReport> {
  const response = await api.get(API_ROUTES.REPORTS.BY_ID(id));
  return response.data;
}

/**
 * Busca todos os relatórios do usuário com filtros opcionais
 */
export async function getUserReports(
  page = 1,
  limit = 10,
  filters: Omit<ReportFilters, "page" | "limit"> = {}
): Promise<ReportsResponse> {
  const params = {
    page,
    limit,
    ...filters,
  };

  const response = await api.get(API_ROUTES.REPORTS.BASE, { params });
  return response.data;
}

/**
 * Faz o download de um relatório em um formato específico
 */
export async function downloadReport(
  id: string,
  format: ReportFormat = "excel"
): Promise<Blob> {
  const response = await api.get(API_ROUTES.REPORTS.DOWNLOAD(id), {
    params: { format },
    responseType: "blob",
  });
  return response.data;
}

// Exportação do serviço como um objeto para facilitar o uso com hooks
export const reportService = {
  createReport,
  getReportById,
  getUserReports,
  downloadReport,
};
