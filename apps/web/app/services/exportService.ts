import { api } from "./authService";
import { API_ROUTES } from '../constants/api-routes';

export type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json';

export interface ExportOptions {
  format?: ExportFormat;
  title?: string;
  filename?: string;
  filters?: Record<string, any>;
}

/**
 * Exporta pedidos aplicando os filtros e formato especificados
 * @param options Opções de exportação (formato, título, filtros)
 * @param onProgress Callback opcional para monitorar o progresso
 * @returns Uma Promise que resolve para um Blob contendo o arquivo exportado
 */
export const exportOrders = async (
  options: ExportOptions, 
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    console.log('Iniciando exportação de pedidos com opções:', options);
    
    if (typeof options.filters === 'function') {
      console.warn('Filtros fornecidos como função, isso pode causar problemas de serialização');
      options.filters = {};
    }
    
    const params = new URLSearchParams();
    
    params.append('format', options.format || 'excel');

    if (options.title) {
      params.append('title', options.title);
    }
    
    if (options.filters && typeof options.filters === 'object') {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && typeof value !== 'function') {
          params.append(key, String(value));
        }
      });
    }
    
    const url = `/api/orders/export?${params.toString()}`;
    console.log('URL de exportação:', url);
    
    const response = await api.get(url, {
      responseType: 'blob',
      timeout: 60000,
      onDownloadProgress: progressEvent => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('Resposta inválida do servidor');
    }
    
    if (response.data.type.includes('application/json')) {
      try {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);
        
        if (jsonData.message) {
          console.error('Conteúdo do erro (blob):', jsonData.message);
          throw new Error(jsonData.message);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
          throw e;
        }
      }
    }
    
    console.log('Exportação concluída com sucesso!');
    return response.data;
  } catch (error) {
    console.error("Erro detalhado ao exportar pedidos:", error);
    
    if ((error as any).response?.data instanceof Blob) {
      try {
        const text = await (error as any).response.data.text();
        console.error('Conteúdo do erro (blob):', text);
        
        try {
          const jsonData = JSON.parse(text);
          if (jsonData.message) {
            throw new Error(jsonData.message);
          }
        } catch (e) {
          console.error('Erro ao analisar o blob como JSON:', e);
        }
      } catch (e) {
        console.error('Não foi possível ler o conteúdo do blob:', e);
      }
    }
    
    throw error;
  }
};

/**
 * Exporta os detalhes de um pedido específico
 * @param orderId ID do pedido a ser exportado
 * @param format Formato do arquivo exportado
 * @returns Uma Promise que resolve para um Blob contendo o arquivo exportado
 */
export const exportOrderDetails = async (
  orderId: string, 
  format: ExportFormat = 'excel'
): Promise<Blob> => {
  try {
    const url = `${API_ROUTES.ORDERS.EXPORT_DETAILS(orderId)}?format=${format}`;
    
    const response = await api.get(url, {
      responseType: 'blob',
      timeout: 30000 // 30 segundos
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao exportar detalhes do pedido ${orderId}:`, error);
    throw error;
  }
};

/**
 * Exporta o resumo diário de pedidos
 * @param date Data opcional para o resumo (padrão: data atual)
 * @param format Formato do arquivo exportado
 * @returns Uma Promise que resolve para um Blob contendo o arquivo exportado
 */
export const exportDailySummary = async (
  date?: Date, 
  format: ExportFormat = 'excel'
): Promise<Blob> => {
  try {
    let url = `${API_ROUTES.ORDERS.EXPORT_DAILY}?format=${format}`;
    
    if (date) {
      const dateStr = date.toISOString().split('T')[0]; // formato YYYY-MM-DD
      url += `&date=${dateStr}`;
    }
    
    const response = await api.get(url, {
      responseType: 'blob',
      timeout: 30000
    });
    
    return response.data;
  } catch (error) {
    console.error("Erro ao exportar resumo diário:", error);
    throw error;
  }
};

/**
 * Exporta relatórios gerados
 * @param reportId ID do relatório a ser exportado
 * @param options Opções de exportação (formato)
 * @returns Uma Promise que resolve para um Blob contendo o arquivo exportado
 */
export const exportReport = async (
  reportId: string, 
  options: { format?: ExportFormat } = {}
): Promise<Blob> => {
  try {
    const format = options.format || 'excel';
    const url = `${API_ROUTES.REPORTS.DOWNLOAD(reportId)}?format=${format}`;
    
    console.log(`Exportando relatório ${reportId} no formato ${format}`);
    
    const response = await api.get(url, {
      responseType: 'blob',
      timeout: 60000 // 1 minuto para relatórios maiores
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao exportar relatório ${reportId}:`, error);
    throw error;
  }
};

/**
 * Gera um nome de arquivo para download baseado no conteúdo e formato
 * @param baseName Nome base do arquivo (sem extensão)
 * @param format Formato do arquivo
 * @returns Nome do arquivo com extensão apropriada
 */
export const generateFilename = (
  baseName: string, 
  format: ExportFormat
): string => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedBaseName = baseName
    .replace(/[^\w\-]/g, '_') // Substituir caracteres não alfanuméricos por _
    .replace(/_+/g, '_'); // Evitar múltiplos _ consecutivos
  
  const extension = format === 'excel' ? 'xlsx' : format;
  return `${sanitizedBaseName}_${timestamp}.${extension}`;
};

/**
 * Efetua o download de um blob como arquivo
 * @param blob O blob a ser baixado
 * @param filename Nome do arquivo para download
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  // Criar URL do objeto
  const url = window.URL.createObjectURL(blob);
  
  // Criar elemento <a> temporário para download
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  
  // Anexar ao DOM, clicar e remover
  document.body.appendChild(a);
  a.click();
  
  // Limpar recursos após o download
  window.setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Utilitário para verificar se um blob contém uma mensagem de erro
 * @param blob O blob a verificar
 * @returns Promise que resolve para true se o blob contiver um erro
 */
export const isErrorBlob = async (blob: Blob): Promise<boolean> => {
  // Verificar se o tipo de conteúdo é JSON
  if (blob.type.includes('application/json')) {
    try {
      // Tentar ler o blob como texto
      const text = await blob.text();
      const data = JSON.parse(text);
      
      // Verificar se há uma propriedade de erro
      return Boolean(data.error || data.message);
    } catch (e) {
      console.error('Erro ao analisar blob:', e);
      return false;
    }
  }
  
  return false;
};

export const exportService = {
  exportOrders,
  exportOrderDetails,
  exportDailySummary,
  exportReport,
  generateFilename,
  downloadBlob,
  isErrorBlob
};