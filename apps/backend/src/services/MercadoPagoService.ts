import { MercadoPagoAPI } from "../utils/mercadoPagoDirectApi";
import type { 
  IMercadoPagoPreference, 
  IMercadoPagoPreferenceResponse,
  IMercadoPagoPaymentInfo
} from "../interfaces/IMercadoPago";
import type { IOrder, IPaymentHistoryEntry } from "../interfaces/IOrder";
import { IPayment } from "../interfaces/IPayment";
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

  constructor() {
    this.paymentModel = new PaymentModel();
    this.orderModel = new OrderModel();
    this.cashRegisterModel = new CashRegisterModel();
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
      // Verificar se há caixa aberto
      const openRegister = await this.cashRegisterModel.findOpenRegister();
      if (!openRegister) {
        throw new MercadoPagoError("Não há caixa aberto para registrar pagamentos");
      }
  
      // Verificar se o pedido tem _id
      if (!order._id) {
        throw new MercadoPagoError("Pedido sem ID válido");
      }
  
      // Abordagem simplificada: criar apenas um item para o pedido inteiro
      const items = [{
        id: order._id.toString(),
        title: `Pedido Óticas Queiroz #${order._id.toString().substring(0, 8)}`,
        description: `Pedido de produtos Óticas Queiroz`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(order.finalPrice) || 100 // Fallback para um valor padrão se finalPrice não estiver definido
      }];
  
      console.log("Items para Mercado Pago:", JSON.stringify(items, null, 2));
  
      // Criar uma preferência de pagamento simplificada
      const preference: IMercadoPagoPreference = {
        items,
        external_reference: order._id.toString(),
        back_urls: {
          success: `${baseUrl}/payment/success`,
          pending: `${baseUrl}/payment/pending`,
          failure: `${baseUrl}/payment/failure`
        },
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        auto_return: "approved",
        statement_descriptor: "Óticas Queiroz"
      };
  
      console.log("Preferência a ser enviada:", JSON.stringify(preference, null, 2));
  
      // Usar a API direta para criar a preferência
      const response = await MercadoPagoAPI.createPreference(preference);
      
      console.log("Resposta do Mercado Pago:", JSON.stringify(response, null, 2));
      
      return {
        id: response.body.id,
        init_point: response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point
      };
    } catch (error) {
      console.error("Erro detalhado ao criar preferência de pagamento:", error);
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
      console.log(`[MercadoPagoService] Processando pagamento: ${paymentId}`);
      
      // Verificar se já processamos este pagamento antes
      const existingPayments = await this.paymentModel.findAllWithMongoFilters(1, 10, {
        description: new RegExp(`Pagamento via Mercado Pago.*${paymentId}`)
      });
      
      if (existingPayments.total > 0) {
        console.log(`[MercadoPagoService] Pagamento ${paymentId} já foi processado anteriormente`);
        return existingPayments.payments[0];
      }
      
      // Buscar informações do pagamento no Mercado Pago
      console.log(`[MercadoPagoService] Buscando informações do pagamento ${paymentId} no Mercado Pago`);
      const paymentInfo = await this.getPaymentInfo(paymentId);
      console.log(`[MercadoPagoService] Status do pagamento: ${paymentInfo.status}`);
      
      // Log detalhado das informações do pagamento
      console.log(`[MercadoPagoService] Detalhes do pagamento:
        - Método: ${paymentInfo.payment_method_id}
        - Tipo: ${paymentInfo.payment_type_id}
        - Status: ${paymentInfo.status}
        - Valor: ${paymentInfo.transaction_amount}
        - Referência externa: ${paymentInfo.external_reference}
      `);
      
      // Verificar se o pagamento foi aprovado
      if (paymentInfo.status !== "approved") {
        console.log(`[MercadoPagoService] Pagamento não aprovado. Status: ${paymentInfo.status}`);
        throw new MercadoPagoError(`Pagamento não aprovado. Status: ${paymentInfo.status}`);
      }
      
      // Buscar o pedido relacionado
      const orderId = paymentInfo.metadata?.order_id || paymentInfo.external_reference;
      if (!orderId) {
        throw new MercadoPagoError("Referência do pedido não encontrada no pagamento");
      }
      
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new MercadoPagoError(`Pedido ${orderId} não encontrado`);
      }
      
      // Verificar se o pedido tem _id
      if (!order._id) {
        throw new MercadoPagoError(`Pedido encontrado não possui ID válido`);
      }
      
      // Verificar se há caixa aberto
      const openRegister = await this.cashRegisterModel.findOpenRegister();
      if (!openRegister) {
        throw new MercadoPagoError("Não há caixa aberto para registrar pagamentos");
      }
      
      // Verificar se o caixa aberto tem _id
      if (!openRegister._id) {
        throw new MercadoPagoError("Caixa encontrado não possui ID válido");
      }
      
      // Mapear o tipo de pagamento do Mercado Pago para o tipo de pagamento do sistema
      let paymentMethod: IPayment["paymentMethod"];
      switch (paymentInfo.payment_method_id) {
        case "pix":
          paymentMethod = "pix";
          break;
        case "credit_card":
          paymentMethod = "credit";
          break;
        case "debit_card":
          paymentMethod = "debit";
          break;
        case "ticket":
        case "bank_transfer":
          paymentMethod = "bank_slip";
          break;
        default:
          paymentMethod = "cash"; // Fallback
      }
      
      // Criar o pagamento no sistema
      const payment: Omit<IPayment, "_id"> = {
        createdBy: order.employeeId.toString(),
        customerId: order.clientId.toString(),
        cashRegisterId: openRegister._id.toString(),
        orderId: order._id.toString(),
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
      if (paymentMethod === "credit" && paymentInfo.installments > 1) {
        payment.creditCardInstallments = {
          current: 1,
          total: paymentInfo.installments,
          value: paymentInfo.transaction_details.installment_amount
        };
      }
      
      console.log(`[MercadoPagoService] Criando registro de pagamento no sistema:`, JSON.stringify(payment, null, 2));
      
      // Criar o pagamento no sistema
      const createdPayment = await this.paymentModel.create(payment);
      
      // Verificar se o pagamento criado tem _id
      if (!createdPayment._id) {
        throw new MercadoPagoError("Erro ao criar pagamento: ID não gerado");
      }
      
      console.log(`[MercadoPagoService] Pagamento registrado com ID: ${createdPayment._id}`);
      
      // Preparar o histórico de pagamento
      const newPaymentHistory: IPaymentHistoryEntry[] = [
        ...(order.paymentHistory || []),
      ];
      
      // Adicionar o novo pagamento ao histórico
      newPaymentHistory.push({
        paymentId: createdPayment._id,
        amount: createdPayment.amount,
        date: createdPayment.date,
        method: createdPayment.paymentMethod
      });
      
      // Calcular o total pago
      const totalPaid = newPaymentHistory.reduce((sum, entry) => sum + entry.amount, 0);
      
      // Determinar o novo status de pagamento
      let paymentStatus: "pending" | "partially_paid" | "paid" = "pending";
      if (totalPaid >= order.finalPrice) {
        paymentStatus = "paid";
      } else if (totalPaid > 0) {
        paymentStatus = "partially_paid";
      }
      
      console.log(`[MercadoPagoService] Atualizando status de pagamento do pedido ${order._id}:
        - Valor total: ${order.finalPrice}
        - Total pago: ${totalPaid}
        - Novo status: ${paymentStatus}
      `);
      
      // Atualizar o status de pagamento do pedido
      const updatedOrder = await this.orderModel.update(order._id.toString(), {
        paymentStatus,
        paymentHistory: newPaymentHistory
      });
      
      if (!updatedOrder) {
        console.warn(`[MercadoPagoService] Falha ao atualizar o pedido ${order._id}, mas o pagamento foi registrado`);
      } else {
        console.log(`[MercadoPagoService] Pedido ${order._id} atualizado com sucesso`);
      }
      
      // Atualizar o caixa com o valor do pagamento
      try {
        // Mapear o método de pagamento para o tipo aceito pelo caixa
        let registerMethod: "credit" | "debit" | "cash" | "pix";
        switch (paymentMethod) {
          case "credit":
            registerMethod = "credit";
            break;
          case "debit":
            registerMethod = "debit";
            break;
          case "cash":
            registerMethod = "cash";
            break;
          case "pix":
            registerMethod = "pix";
            break;
          default:
            // Para outros métodos, registrar como "cash"
            registerMethod = "cash";
        }
        
        await this.cashRegisterModel.updateSalesAndPayments(
          openRegister._id.toString(),
          "sale",
          payment.amount,
          registerMethod
        );
        
        console.log(`[MercadoPagoService] Caixa ${openRegister._id} atualizado com o pagamento`);
      } catch (error) {
        console.error(`[MercadoPagoService] Erro ao atualizar o caixa:`, error);
        // Não lançar erro aqui, pois o pagamento já foi processado
      }
      
      console.log(`[MercadoPagoService] Processamento de pagamento ${paymentId} concluído com sucesso`);
      return createdPayment;
    } catch (error) {
      console.error(`[MercadoPagoService] Erro ao processar pagamento:`, error);
      throw new MercadoPagoError(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao processar pagamento"
      );
    }
  }

  /**
   * Obtém informações de um pagamento no Mercado Pago
   * @param paymentId ID do pagamento no Mercado Pago
   * @returns Informações detalhadas do pagamento
   */
  async getPaymentInfo(paymentId: string): Promise<IMercadoPagoPaymentInfo> {
    try {
      // Usar a API direta para obter informações do pagamento
      const response = await MercadoPagoAPI.getPayment(paymentId);
      return response.body as IMercadoPagoPaymentInfo;
    } catch (error) {
      console.error("Erro ao obter informações do pagamento:", error);
      throw new MercadoPagoError(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao obter informações do pagamento"
      );
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
        console.log(`Notificação ignorada: ${data.type}`);
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
}