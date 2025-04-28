import { API_ROUTES } from "../constants/api-routes";
import { api } from "./authService";

/**
 * Cria uma preferência de pagamento para um pedido
 * @param orderId ID do pedido
 * @returns Preferência de pagamento com links
 */
export async function createPaymentPreference(orderId: string) {
  const response = await api.post(API_ROUTES.MERCADO_PAGO.PREFERENCE(orderId));
  return response.data;
}

/**
 * Obtém informações de um pagamento no Mercado Pago
 * @param paymentId ID do pagamento no Mercado Pago
 * @returns Informações detalhadas do pagamento
 */
export async function getPaymentInfo(paymentId: string) {
  const response = await api.get(API_ROUTES.MERCADO_PAGO.PAYMENT(paymentId));
  return response.data;
}

/**
 * Processa um pagamento recebido
 * @param paymentId ID do pagamento no Mercado Pago
 * @returns Status do processamento
 */
export async function processPayment(paymentId: string) {
  const response = await api.post(API_ROUTES.MERCADO_PAGO.PROCESS_PAYMENT(paymentId));
  return response.data;
}