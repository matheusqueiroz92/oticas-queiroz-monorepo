import { api } from "./authService";
import { API_ROUTES } from "../_constants/api-routes";
import type {
  EmitOrderSicrediBoletoResponse,
  SicrediBoletoData,
  SicrediCustomerData,
} from "../_types/sicredi";
import type { IPayment } from "../_types/payment";

export const emitBoletoForOrder = async (
  orderId: string,
  customerData: SicrediCustomerData,
  options?: { dataVencimento?: string; cashRegisterId?: string }
): Promise<EmitOrderSicrediBoletoResponse> => {
  const response = await api.post(API_ROUTES.ORDERS.SICREDI_BOLETOS(orderId), {
    customerData,
    ...(options?.dataVencimento ? { dataVencimento: options.dataVencimento } : {}),
    ...(options?.cashRegisterId ? { cashRegisterId: options.cashRegisterId } : {}),
  });
  return response.data;
};

export const downloadAllOrderBoletosPdf = async (orderId: string): Promise<Blob> => {
  const response = await api.get(API_ROUTES.ORDERS.SICREDI_BOLETOS_PDF(orderId), {
    responseType: "blob",
  });
  return response.data;
};

export const generateBoleto = async (
  paymentId: string,
  customerData: SicrediCustomerData
): Promise<{ success: boolean; data?: SicrediBoletoData; error?: string }> => {
  const response = await api.post(API_ROUTES.SICREDI.GENERATE_BOLETO, {
    paymentId,
    customerData,
  });
  return response.data;
};

export const checkBoletoStatus = async (
  paymentId: string
): Promise<{
  success: boolean;
  data?: { status: string; valorPago?: number; dataPagamento?: string };
  error?: string;
}> => {
  const response = await api.get(API_ROUTES.SICREDI.CHECK_STATUS(paymentId));
  return response.data;
};

export const cancelBoleto = async (
  paymentId: string,
  motivo: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const response = await api.post(API_ROUTES.SICREDI.CANCEL_BOLETO, {
    paymentId,
    motivo,
  });
  return response.data;
};

export const downloadBoletoPdf = async (paymentId: string): Promise<Blob> => {
  const response = await api.get(API_ROUTES.SICREDI.BOLETO_PDF(paymentId), {
    responseType: "blob",
  });
  return response.data;
};

export const testSicrediConnection = async (): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  const response = await api.get(API_ROUTES.SICREDI.TEST_CONNECTION);
  return response.data;
};

export type { IPayment };
