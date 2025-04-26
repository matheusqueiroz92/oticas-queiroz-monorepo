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
import mongoose from "mongoose";

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

      // Preparar os items do pedido para o Mercado Pago
      const items = order.products.map((product, index) => {
        // Se o produto for um objeto com nome e preço
        if (typeof product === 'object' && 
            product !== null && 
            '_id' in product && 
            'name' in product && 
            'sellPrice' in product) {
          return {
            id: product._id.toString(),
            title: product.name,
            description: (product.description || `Item do pedido ${order._id}`).toString(),
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(product.sellPrice)
          };
        }
        
        // Caso contrário, usa uma representação genérica
        return {
          id: typeof product === 'object' && product && '_id' in product ? 
              product._id.toString() : 
              typeof product === 'string' ? 
                  product : 
                  `unknown-${index}`,
          title: `Produto #${index + 1}`,
          description: `Item do pedido ${order._id}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: order.finalPrice / order.products.length // Divide o valor igualmente
        };
      });

      // Criar uma preferência de pagamento
      const preference: IMercadoPagoPreference = {
        items,
        external_reference: order._id.toString(),
        payment_methods: {
          excluded_payment_methods: [],
          installments: order.installments || 1
        },
        back_urls: {
          success: `${baseUrl}/payment/success`,
          pending: `${baseUrl}/payment/pending`,
          failure: `${baseUrl}/payment/failure`
        },
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        auto_return: "approved",
        statement_descriptor: "Óticas Queiroz"
      };

      // Usar a API direta para criar a preferência
      const response = await MercadoPagoAPI.createPreference(preference);
      
      return {
        id: response.body.id,
        init_point: response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point
      };
    } catch (error) {
      console.error("Erro ao criar preferência de pagamento:", error);
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
      // Buscar informações do pagamento no Mercado Pago
      const paymentInfo = await this.getPaymentInfo(paymentId);
      
      // Verificar se o pagamento foi aprovado
      if (paymentInfo.status !== "approved") {
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
      };
      
      // Se for cartão de crédito com parcelamento, adicionar informações
      if (paymentMethod === "credit" && paymentInfo.installments > 1) {
        payment.creditCardInstallments = {
          current: 1,
          total: paymentInfo.installments,
          value: paymentInfo.transaction_details.installment_amount
        };
      }
      
      // Criar o pagamento no sistema
      const createdPayment = await this.paymentModel.create(payment);
      
      // Verificar se o pagamento criado tem _id
      if (!createdPayment._id) {
        throw new MercadoPagoError("Erro ao criar pagamento: ID não gerado");
      }
      
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
      
      // Atualizar o status de pagamento do pedido
      await this.orderModel.update(order._id.toString(), {
        paymentStatus: "paid",
        paymentHistory: newPaymentHistory
      });
      
      return createdPayment;
    } catch (error) {
      console.error("Erro ao processar pagamento do Mercado Pago:", error);
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