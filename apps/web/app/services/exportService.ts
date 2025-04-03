import { api } from "./authService";
import { API_ROUTES } from "../constants/api-routes";
import { formatDate } from "../utils/formatters";

export interface ExportOptions {
  format: "excel" | "pdf" | "csv" | "json";
  title?: string;
  filename?: string;
}

export const exportService = {
  /**
   * Exporta relatórios utilizando a API do backend
   */
  exportReport: async (
    id: string, 
    options: ExportOptions
  ): Promise<Blob> => {
    const response = await api.get(
      API_ROUTES.REPORTS.DOWNLOAD(id), 
      {
        params: { format: options.format },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * Exporta pedidos utilizando a API do backend
   */
  exportOrders: async (
    filters: Record<string, any> = {},
    options: ExportOptions
  ): Promise<Blob> => {
    const response = await api.get(
      API_ROUTES.ORDERS.EXPORT, 
      {
        params: { 
          ...filters,
          format: options.format,
          title: options.title 
        },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * Exporta detalhes de um pedido específico usando a rota já existente
   */
  exportOrderDetails: async (
    orderId: string,
    options: ExportOptions
  ): Promise<Blob> => {
    const response = await api.get(
      API_ROUTES.ORDERS.EXPORT_BY_ID(orderId),
      {
        params: { format: options.format },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * Exporta o resumo diário de pedidos
   */
  exportDailySummary: async (
    date: string | Date,
    options: ExportOptions
  ): Promise<Blob> => {
    const formattedDate = typeof date === 'string' ? date : formatDate(date);
    
    const response = await api.get(
      API_ROUTES.ORDERS.EXPORT_DAILY,
      {
        params: { 
          date: formattedDate,
          format: options.format
        },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * Função genérica para realizar o download de um Blob
   */
  downloadBlob: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Função para gerar nome de arquivo baseado em timestamp
   */
  generateFilename: (baseName: string, format: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${baseName}-${timestamp}.${format}`;
  }
};