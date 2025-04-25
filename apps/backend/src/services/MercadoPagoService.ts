import mercadopago from "../config/mercadoPago";
import type { 
  IMercadoPagoPreference, 
  IMercadoPagoPreferenceResponse,
  IMercadoPagoPaymentInfo
} from "../interfaces/IMercadoPago";
import type { IOrder } from "../interfaces/IOrder";
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

      // Preparar os items do pedido para o Mercado Pago
      const items = order.products.map((product, index) => {
        // Se o produto for um ID (string), não temos informações detalhadas
        // Neste caso vamos usar informações genéricas
        if (typeof product === 'string' || product instanceof Object) {
          const productObj = typeof product === 'object' ? product : { _id: product };
          return {
            id: productObj._id?.toString() || `product-${index}`,
            title: productObj.name || `Produto #${index + 1}`,
            description: productObj.description || `Produto do pedido ${order._id}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: typeof productObj.sellPrice === 'number' ? productObj.sellPrice : 0
          };
        }
        
        return {
          id: product._id,
          title: product.name,
          description: product.description || `Produto do pedido ${order._id}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: product.sellPrice
        };
      });

      // Criar uma preferência de pagamento
      const preference: IMercadoPagoPreference = {
        items,
        external_reference: order._id,
        payment_methods: {
          excluded_payment_methods: [], // Aqui você pode excluir métodos de pagamento
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

      const response = await mercadopago.preferences.create(preference);
      
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
      const orderId = paymentInfo.external_reference || paymentInfo.metadata?.order_id;
      if (!orderId) {
        throw new MercadoPagoError("Referência do pedido não encontrada no pagamento");
      }
      
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new MercadoPagoError(`Pedido ${orderId} não encontrado`);
      }
      
      // Verificar se há caixa aberto
      const openRegister = await this.cashRegisterModel.findOpenRegister();
      if (!openRegister) {
        throw new MercadoPagoError("Não há caixa aberto para registrar pagamentos");
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
        cashRegisterId: openRegister._id,
        orderId: order._id,
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
      
      // Atualizar o status de pagamento do pedido
      const updatedOrder = await this.orderModel.update(order._id, {
        paymentStatus: "paid",
        paymentHistory: [
          ...(order.paymentHistory || []),
          {
            paymentId: createdPayment._id,
            amount: createdPayment.amount,
            date: createdPayment.date,
            method: createdPayment.paymentMethod
          }
        ]
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
      const response = await mercadopago.payment.get(paymentId);
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