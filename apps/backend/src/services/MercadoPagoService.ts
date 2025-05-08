import { MercadoPagoAPI } from "../utils/mercadoPagoDirectApi";
import type { 
  IMercadoPagoPreference, 
  IMercadoPagoPreferenceResponse,
  IMercadoPagoPaymentInfo
} from "../interfaces/IMercadoPago";
import type { IOrder, IPaymentHistoryEntry } from "../interfaces/IOrder";
import { IPayment } from "../interfaces/IPayment";
import { OrderService } from "./OrderService";
import { PaymentModel } from "../models/PaymentModel";
import { OrderModel } from "../models/OrderModel";
import { CashRegisterModel } from "../models/CashRegisterModel";

export class MercadoPagoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MercadoPagoError";
  }
}

export class MercadoPagoService {
  private paymentModel: PaymentModel;
  private orderModel: OrderModel;
  private cashRegisterModel: CashRegisterModel;
  private orderService: OrderService;

  constructor() {
    this.paymentModel = new PaymentModel();
    this.orderModel = new OrderModel();
    this.cashRegisterModel = new CashRegisterModel();
    this.orderService = new OrderService();
  }

  /**
   * Cria uma preferência de pagamento no Mercado Pago
   * @param order Dados do pedido
   * @param baseUrl URL base para callbacks
   * @returns Resposta com ID e URLs de pagamento
   */
  async createPaymentPreference(
    order: IOrder,
    baseUrl: string
  ): Promise<IMercadoPagoPreferenceResponse> {
    try {
      // Validação robusta
      if (!order || !order._id) {
        throw new MercadoPagoError("Pedido inválido ou sem ID");
      }

      // Validar valor
      if (!order.finalPrice || order.finalPrice <= 0) {
        throw new MercadoPagoError("Valor do pedido inválido ou não definido");
      }

      // Verificar caixa
      const openRegister = await this.cashRegisterModel.findOpenRegister();
      if (!openRegister) {
        throw new MercadoPagoError("Não há caixa aberto para registrar pagamentos");
      }

      // Items simplificados e validados
      const items = [{
        id: order._id.toString(),
        title: `Pedido Óticas Queiroz #${order._id.toString().substring(0, 8)}`,
        description: `Pagamento de produtos e serviços - OS: ${order.serviceOrder || order._id.toString().substring(0, 8)}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(order.finalPrice)
      }];

      // Configuração básica da preferência
      let preferenceConfig: IMercadoPagoPreference = {
        items,
        external_reference: order._id.toString(),
        statement_descriptor: "Óticas Queiroz",
        back_urls: {
          success: "",
          pending: undefined,
          failure: undefined
        }
      };
      
      // Diferenciação por ambiente
      if (process.env.NODE_ENV === 'production') {
        // Em produção, incluir URLs completas e auto_return
        preferenceConfig.back_urls = {
          success: `${baseUrl}/payment/success`,
          pending: `${baseUrl}/payment/pending`,
          failure: `${baseUrl}/payment/failure`
        };
        preferenceConfig.notification_url = `${baseUrl}/api/mercadopago/webhook`;
        preferenceConfig.auto_return = "approved";
      } else {
        // Em desenvolvimento, usar apenas URLs sem auto_return
        preferenceConfig.back_urls = {
          success: `${baseUrl}/payment/success`,
          pending: `${baseUrl}/payment/pending`,
          failure: `${baseUrl}/payment/failure`
        };
        preferenceConfig.notification_url = `${baseUrl}/api/mercadopago/webhook`;
      }

      try {
        const response = await MercadoPagoAPI.createPreference(preferenceConfig);
        
        return {
          id: response.body.id,
          init_point: response.body.init_point,
          sandbox_init_point: response.body.sandbox_init_point
        };
      } catch (error: any) {
        console.error("[MercadoPagoService] Erro detalhado da API do Mercado Pago:", error);
        
        // Extrair mensagem de erro mais detalhada
        let errorMessage = "Erro desconhecido na API do Mercado Pago";
        
        if (error.response) {
          console.error('Status do erro:', error.response.status);
          console.error('Cabeçalhos da resposta:', error.response.headers);
          console.error('Resposta de erro da API:', error.response.data);
          
          if (error.response.data && typeof error.response.data === 'object') {
            if (error.response.data.cause && Array.isArray(error.response.data.cause)) {
              // Muitas vezes o Mercado Pago retorna um array de causas de erro
              errorMessage = error.response.data.cause.map((c: any) => c.description || c.code).join(', ');
            } else {
              errorMessage = error.response.data.message || error.response.data.error || errorMessage;
            }
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new MercadoPagoError(`Falha na API do Mercado Pago: ${errorMessage}`);
      }
    } catch (error) {
      console.error("[MercadoPagoService] Erro detalhado ao criar preferência de pagamento:", error);
      if (error instanceof MercadoPagoError) {
        throw error;
      }
      throw new MercadoPagoError(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao criar preferência de pagamento"
      );
    }
  }

  /**
   * Processa um pagamento recebido do Mercado Pago
   * @param paymentId ID do pagamento no Mercado Pago
   * @returns Informações do pagamento processado
   */
  async processPayment(paymentId: string): Promise<IPayment> {
    try {
      // Verificar se já processamos este pagamento antes (idempotência)
      const existingPayments = await this.paymentModel.findAllWithMongoFilters(1, 1, {
        mercadoPagoId: paymentId,
        status: "completed"
      });
      
      if (existingPayments.total > 0) {
        return existingPayments.payments[0];
      }
      
      // Buscar informações do pagamento no Mercado Pago
      const paymentInfo = await this.getPaymentInfo(paymentId);
      
      // Log detalhado das informações do pagamento
      
      // Verificar se o pagamento foi aprovado
      if (paymentInfo.status !== "approved") {
        throw new MercadoPagoError(`Pagamento não aprovado. Status: ${paymentInfo.status}`);
      }
      
      // Buscar o pedido relacionado usando external_reference
      const orderId = paymentInfo.external_reference || paymentInfo.metadata?.order_id;
      
      if (!orderId) {
        console.error(`[MercadoPagoService] Referência do pedido não encontrada no pagamento ${paymentId}`);
        throw new MercadoPagoError("Referência do pedido não encontrada no pagamento");
      }

      const order = await this.orderService.getOrderById(orderId);
      
      if (!order) {
        console.error(`[MercadoPagoService] Pedido ${orderId} não encontrado`);
        throw new MercadoPagoError(`Pedido ${orderId} não encontrado`);
      }
      
      // Verificar se há caixa aberto
      const openRegister = await this.cashRegisterModel.findOpenRegister();
      if (!openRegister) {
        console.error(`[MercadoPagoService] Não há caixa aberto para registrar pagamento ${paymentId}`);
        throw new MercadoPagoError("Não há caixa aberto para registrar pagamentos");
      }
      
      // Mapear o tipo de pagamento do Mercado Pago para o tipo de pagamento do sistema
      let paymentMethod: IPayment["paymentMethod"] = "mercado_pago";
      
      // Criar o pagamento no sistema
      const payment: Omit<IPayment, "_id"> = {
        createdBy: order.employeeId.toString(),
        customerId: order.clientId.toString(),
        cashRegisterId: openRegister._id ? openRegister._id.toString() : (() => { throw new MercadoPagoError("ID do caixa aberto é indefinido"); })(),
        orderId: order._id?.toString() ?? (() => { throw new MercadoPagoError("Order ID is undefined"); })(),
        amount: paymentInfo.transaction_amount,
        date: new Date(),
        type: "sale",
        paymentMethod,
        status: "completed",
        description: `Pagamento via Mercado Pago - ID: ${paymentId}`,
        mercadoPagoId: paymentId.toString(),
        mercadoPagoData: paymentInfo
      };
      
      // Se for cartão de crédito com parcelamento, adicionar informações
      if (paymentInfo.payment_method_id === "credit_card" && paymentInfo.installments > 1) {
        payment.creditCardInstallments = {
          current: 1,
          total: paymentInfo.installments,
          value: paymentInfo.transaction_details?.installment_amount || (paymentInfo.transaction_amount / paymentInfo.installments)
        };
      }

      // Criar o pagamento no sistema
      const createdPayment = await this.paymentModel.create(payment);
      
      // Verificar se o pagamento criado tem _id
      if (!createdPayment._id) {
        console.error(`[MercadoPagoService] Erro ao criar pagamento: ID não gerado`);
        throw new MercadoPagoError("Erro ao criar pagamento: ID não gerado");
      }
      
      // Atualizar o status de pagamento do pedido
      
      await this.updateOrderPaymentStatus(order._id.toString(), createdPayment);

      return createdPayment;
    } catch (error) {
      console.error(`[MercadoPagoService] Erro ao processar pagamento ${paymentId}:`, error);
      throw error instanceof MercadoPagoError 
        ? error 
        : new MercadoPagoError(error instanceof Error ? error.message : "Erro desconhecido ao processar pagamento");
    }
  }

  /**
   * Obtém informações de um pagamento no Mercado Pago
   * @param paymentId ID do pagamento no Mercado Pago
   * @returns Informações detalhadas do pagamento
   */
  async getPaymentInfo(paymentId: string): Promise<IMercadoPagoPaymentInfo> {
    try {      
      if (!paymentId) {
        throw new MercadoPagoError("ID do pagamento é obrigatório");
      }
      
      // Usar a API direta para obter informações do pagamento
      try {
        const response = await MercadoPagoAPI.getPayment(paymentId);
        
        if (!response || !response.body) {
          throw new MercadoPagoError("Resposta vazia da API do Mercado Pago");
        }

        return response.body;
      } catch (error: any) {
        console.error(`[MercadoPagoService] Erro ao obter informações do pagamento ${paymentId}:`, error);
        
        // Extrair mensagem de erro mais detalhada
        let errorMessage = "Erro desconhecido ao obter informações do pagamento";
        
        if (error.response) {
          console.error('Status do erro:', error.response.status);
          console.error('Dados do erro:', error.response.data);
          
          if (error.response.data && typeof error.response.data === 'object') {
            errorMessage = error.response.data.message || error.response.data.error || errorMessage;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new MercadoPagoError(`Erro ao obter informações do pagamento: ${errorMessage}`);
      }
    } catch (error) {
      console.error(`[MercadoPagoService] Erro ao obter informações do pagamento:`, error);
      throw error instanceof MercadoPagoError 
        ? error 
        : new MercadoPagoError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  }

  /**
   * Processa uma notificação (webhook) do Mercado Pago
   * @param data Dados da notificação
   * @returns Informações do pagamento processado ou null
   */
  async processWebhook(data: any): Promise<IPayment | null> {
    try {
      // Verificar se é uma notificação de pagamento
      if (data.type !== "payment") {
        return null;
      }
      
      // Obter o ID do pagamento da notificação
      const paymentId = data.data?.id;
      if (!paymentId) {
        throw new MercadoPagoError("ID do pagamento não encontrado na notificação");
      }
      
      // Processar o pagamento
      return await this.processPayment(paymentId);
    } catch (error) {
      console.error("Erro ao processar webhook do Mercado Pago:", error);
      throw new MercadoPagoError(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao processar webhook"
      );
    }
  }

    /**
   * Atualiza o status de pagamento de um pedido
   * @param orderId ID do pedido
   * @param payment Pagamento realizado
   */
  private async updateOrderPaymentStatus(orderId: string, payment: IPayment): Promise<void> {
    try {
      // Buscar o pedido atual
      const order = await this.orderService.getOrderById(orderId);
      if (!order) {
        console.error(`[MercadoPagoService] Pedido ${orderId} não encontrado ao atualizar status`);
        return;
      }
      
      // Preparar o histórico de pagamento
      const paymentHistory = Array.isArray(order.paymentHistory) ? [...order.paymentHistory] : [];
      
      // Verificar se este pagamento já está no histórico
      const existingIndex = paymentHistory.findIndex(
        entry => entry.paymentId && entry.paymentId.toString() === (payment._id?.toString() ?? "")
      );
      
      if (existingIndex === -1) {
        // Adicionar o novo pagamento ao histórico
        paymentHistory.push({
          paymentId: payment._id!,
          amount: payment.amount,
          date: payment.date,
          method: payment.paymentMethod
        });
      } else {
      }
      
      // Calcular o total pago
      const totalPaid = paymentHistory.reduce((sum, entry) => sum + entry.amount, 0);
      
      // Determinar o novo status de pagamento
      let paymentStatus: "pending" | "partially_paid" | "paid" = "pending";
      if (totalPaid >= order.finalPrice) {
        paymentStatus = "paid";
      } else if (totalPaid > 0) {
        paymentStatus = "partially_paid";
      }
      
      // Verificar se o status mudou
      if (paymentStatus !== order.paymentStatus || 
          existingIndex === -1) { // Atualizamos se o status mudou ou se adicionamos um novo pagamento
        
        // Usar o método update do OrderModel
        // Enviamos apenas as propriedades que queremos atualizar
        const updated = await this.orderModel.update(
          orderId,
          {
            paymentStatus: paymentStatus,
            paymentHistory: paymentHistory
          }
        );
        
        if (updated) {
        } else {
          console.error(`[MercadoPagoService] Falha ao atualizar pedido ${orderId}`);
        }
      } else {
      }
    } catch (error) {
      console.error(`[MercadoPagoService] Erro ao atualizar status de pagamento do pedido ${orderId}:`, error);
      // Não relançamos o erro para não interromper o fluxo principal
    }
  }
}