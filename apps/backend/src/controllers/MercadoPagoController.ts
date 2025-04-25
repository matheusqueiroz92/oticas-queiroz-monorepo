import type { Request, Response } from "express";
import { MercadoPagoService, MercadoPagoError } from "../services/MercadoPagoService";
import { OrderService } from "../services/OrderService";
import type { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class MercadoPagoController {
  private mercadoPagoService: MercadoPagoService;
  private orderService: OrderService;

  constructor() {
    this.mercadoPagoService = new MercadoPagoService();
    this.orderService = new OrderService();
  }

  /**
   * Cria uma preferência de pagamento para um pedido
   * @param req Requisição
   * @param res Resposta
   */
  async createPaymentPreference(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      // Verificar autenticação
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }
      
      // Obter o pedido
      const order = await this.orderService.getOrderById(orderId);
      
      // Construir a URL base
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.HOST_URL || req.get('host') || 'localhost:3333';
      const baseUrl = `${protocol}://${host}`;
      
      // Criar a preferência de pagamento
      const preference = await this.mercadoPagoService.createPaymentPreference(
        order,
        baseUrl
      );
      
      res.status(200).json(preference);
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        res.status(400).json({ message: error.message });
        return;
      }
      
      console.error("Erro ao criar preferência de pagamento:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      });
    }
  }

  /**
   * Recebe notificações (webhooks) do Mercado Pago
   * @param req Requisição
   * @param res Resposta
   */
  async webhook(req: Request, res: Response): Promise<void> {
    try {
      console.log("Webhook do Mercado Pago recebido:", req.body);
      
      // Processar o webhook
      await this.mercadoPagoService.processWebhook(req.body);
      
      // Responder com sucesso (mesmo que não tenha processado nada)
      res.status(200).send("OK");
    } catch (error) {
      console.error("Erro ao processar webhook do Mercado Pago:", error);
      
      // Mercado Pago espera um status 200 mesmo em caso de erro
      // para evitar que tente novamente
      res.status(200).send("Error");
    }
  }

  /**
   * Busca informações de um pagamento no Mercado Pago
   * @param req Requisição
   * @param res Resposta
   */
  async getPaymentInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      
      // Verificar autenticação
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }
      
      // Obter informações do pagamento
      const paymentInfo = await this.mercadoPagoService.getPaymentInfo(paymentId);
      
      res.status(200).json(paymentInfo);
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        res.status(400).json({ message: error.message });
        return;
      }
      
      console.error("Erro ao obter informações do pagamento:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      });
    }
  }
}