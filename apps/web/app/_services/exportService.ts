import { api } from "./authService";

export interface ExportOptions {
  format: "pdf" | "excel" | "csv" | "json";
  title?: string;
  search?: string;
  status?: string;
  salesRange?: string;
  totalSalesRange?: string;
}

export class ExportService {
  static async exportEmployees(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams();
    
    params.append("format", options.format);
    if (options.title) params.append("title", options.title);
    if (options.search) params.append("search", options.search);
    if (options.status) params.append("status", options.status);
    if (options.salesRange) params.append("salesRange", options.salesRange);
    if (options.totalSalesRange) params.append("totalSalesRange", options.totalSalesRange);

    const response = await api.get(`/users/export?${params.toString()}`, {
      responseType: "blob",
    });

    return response.data;
  }

  static async exportOrders(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams();
    
    params.append("format", options.format);
    if (options.title) params.append("title", options.title);
    if (options.search) params.append("search", options.search);
    if (options.status) params.append("status", options.status);

    const response = await api.get(`/orders/export?${params.toString()}`, {
      responseType: "blob",
    });

    return response.data;
  }

  static async exportPayments(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams();
    
    params.append("format", options.format);
    if (options.title) params.append("title", options.title);
    if (options.search) params.append("search", options.search);
    if (options.status) params.append("status", options.status);

    const response = await api.get(`/payments/export?${params.toString()}`, {
      responseType: "blob",
    });

    return response.data;
  }

  static async exportCashRegister(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams();
    
    params.append("format", options.format);
    if (options.title) params.append("title", options.title);

    const response = await api.get(`/cash-register/export?${params.toString()}`, {
      responseType: "blob",
    });

    return response.data;
  }

  static async exportReport(
    reportId: string, 
    options: { format?: "pdf" | "excel" | "csv" | "json" } = {}
  ): Promise<Blob> {
    const format = options.format || "excel";
    const params = new URLSearchParams();
    params.append("format", format);

    const response = await api.get(`/reports/${reportId}/download?${params.toString()}`, {
      responseType: "blob",
    });

    return response.data;
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static generateFilename(
    baseName: string, 
    format: "pdf" | "excel" | "csv" | "json"
  ): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedBaseName = baseName
      .replace(/[^\w\-]/g, '_')
      .replace(/_+/g, '_');
    
    const extension = format === 'excel' ? 'xlsx' : format;
    return `${sanitizedBaseName}_${timestamp}.${extension}`;
  }

  static async isErrorBlob(blob: Blob): Promise<boolean> {
    if (blob.type.includes('application/json')) {
      try {
        const text = await blob.text();
        const data = JSON.parse(text);
        return Boolean(data.error || data.message);
      } catch (e) {
        console.error('Erro ao analisar blob:', e);
        return false;
      }
    }
    return false;
  }
}