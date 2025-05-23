import type { Request, Response } from "express";
import { MercadoPagoService, MercadoPagoError } from "../services/MercadoPagoService";
import { OrderService } from "../services/OrderService";
import { CashRegisterModel } from "../models/CashRegisterModel";
import type { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { MercadoPagoAPI } from "../utils/mercadoPagoDirectApi";

dotenv.config();

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class MercadoPagoController {
  private mercadoPagoService: MercadoPagoService;
  private orderService: OrderService;
  private cashRegisterModel: CashRegisterModel

  constructor() {
    this.mercadoPagoService = new MercadoPagoService();
    this.orderService = new OrderService();
    this.cashRegisterModel = new CashRegisterModel();
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
      if (!order) {
        res.status(404).json({ message: "Pedido não encontrado" });
        return;
      }
      
      // Construir a URL base - IMPORTANTE: verificar se está correto
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      
      // Use HOST_URL se definido ou obtenha da requisição
      let host = process.env.HOST_URL;
      if (!host) {
        host = req.get('host') || 'localhost:3333';
      }
      
      // Certifique-se de não ter barras duplicadas
      const baseUrl = `${protocol}://${host.replace(/\/$/, '')}`;
      
      // Criar a preferência de pagamento usando o service
      try {
        const preference = await this.mercadoPagoService.createPaymentPreference(
          order,
          baseUrl
        );
        
        res.status(200).json(preference);
      } catch (error: any) {
        if (error instanceof MercadoPagoError) {
          res.status(400).json({ message: error.message });
          return;
        }
        
        throw error; // Relançar para tratamento global
      }
    } catch (error: any) {
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
      // Verificação mais robusta da estrutura da notificação
      if (!req.body) {
        res.status(200).send("OK"); // Retornar 200 para não gerar reenvios
        return;
      }
      
      // Verificar se é uma notificação de pagamento
      if (req.body.type === "payment" || 
        (req.body.action === "payment.created" || req.body.action === "payment.updated")) {
        
        // Verificar ID do pagamento
        const paymentId = req.body.data?.id;
        
        if (!paymentId) {
          console.error("[MercadoPagoController] ID do pagamento não encontrado na notificação", req.body);
          res.status(200).send("OK");
          return;
        }
        // Processar o pagamento
        try {
          await this.mercadoPagoService.processPayment(paymentId);
        } catch (paymentError) {
          // Apenas logamos o erro, não retornamos erro para o Mercado Pago
          console.error(`[MercadoPagoController] Erro ao processar pagamento ${paymentId}:`, paymentError);
        }
      } else {
      }
      
      // Sempre responder com sucesso para o Mercado Pago
      res.status(200).send("OK");
    } catch (error) {
      console.error("[MercadoPagoController] Erro ao processar webhook:", error);
      
      // Mercado Pago espera um status 200 mesmo em caso de erro
      // para evitar que tente novamente
      res.status(200).send("Error but acknowledged");
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

  /**
   * Retorna uma página HTML para testar pagamentos
   * @param req Requisição
   * @param res Resposta
   */
  async getTestPaymentPage(req: Request, res: Response): Promise<void> {
    try {
      // Buscar os últimos 10 pedidos
      const orderService = new OrderService();
      const result = await orderService.getAllOrders(1, 10);
      
      // HTML da página de teste
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste de Pagamentos - Mercado Pago</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          h1 { color: #333; }
          .order { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin-bottom: 10px; 
            border-radius: 4px;
          }
          .order:hover { background-color: #f5f5f5; }
          button {
            background-color: #009ee3;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover { background-color: #008dd0; }
          .result {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f9f9f9;
            display: none;
          }
          .loading { display: none; }
        </style>
      </head>
      <body>
        <h1>Teste de Pagamentos - Mercado Pago</h1>
        <p>Selecione um pedido para criar uma preferência de pagamento:</p>
        
        <div id="orders">
          ${result.orders.map(order => `
            <div class="order">
              <h3>Pedido: ${order._id}</h3>
              <p>Cliente: ${order.clientId}</p>
              <p>Valor: R$ ${order.finalPrice.toFixed(2)}</p>
              <p>Status: ${order.status}</p>
              <button onclick="createPreference('${order._id}')">Gerar Link de Pagamento</button>
            </div>
          `).join('')}
        </div>
        
        <div id="loading" class="loading">
          <p>Gerando link de pagamento...</p>
        </div>
        
        <div id="result" class="result">
          <h3>Link de Pagamento Gerado:</h3>
          <p id="preference-id"></p>
          <p><a id="payment-link" href="#" target="_blank">Abrir Página de Pagamento</a></p>
        </div>
        
        <script>
          async function createPreference(orderId) {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').style.display = 'none';
            
            try {
              // Obter o token do localStorage
              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
              
              const response = await fetch(\`/api/mercadopago/preference/\${orderId}\`, {
                method: 'POST',
                headers: {
                  'Authorization': \`Bearer \${token}\`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                throw new Error(\`Erro HTTP: \${response.status}\`);
              }
              
              const data = await response.json();
              
              // Verificar se o data.id existe antes de exibi-lo
              if (!data.id) {
                throw new Error('ID da preferência não retornado pelo servidor');
              }
              
              // Atualizar o texto para exibir o ID
              document.getElementById('preference-id').textContent = \`ID: \${data.id}\`;
              
              // Usar o sandbox_init_point para ambiente de teste
              const paymentLink = data.sandbox_init_point || data.init_point;
              
              // Atualizar o link
              const paymentLinkElement = document.getElementById('payment-link');
              paymentLinkElement.href = paymentLink;
              paymentLinkElement.textContent = 'Abrir Página de Pagamento (' + paymentLink + ')';
              
              document.getElementById('result').style.display = 'block';
            } catch (error) {
              alert(\`Erro ao gerar link de pagamento: \${error.message}\`);
              console.error('Erro detalhado:', error);
            } finally {
              document.getElementById('loading').style.display = 'none';
            }
          }
        </script>
      </body>
      </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Erro ao gerar página de teste:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      });
    }
  }

  /**
   * Testa a conexão com o Mercado Pago
   * @param req Requisição
   * @param res Resposta
   */
  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      // Tenta obter os métodos de pagamento para verificar se o token está válido
      const response = await MercadoPagoAPI.getPaymentMethods();
      
      if (response && response.body) {
        res.status(200).json({
          success: true,
          message: "Conexão com Mercado Pago estabelecida com sucesso",
          data: {
            paymentMethodsCount: Array.isArray(response.body) ? response.body.length : 0,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Resposta inválida do Mercado Pago",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão com Mercado Pago:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao conectar com o Mercado Pago",
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      });
    }
  }

  /**
   * Cria uma preferência de teste direta, sem precisar de um pedido existente
   * @param req Requisição
   * @param res Resposta
   */
  async createTestPreference(req: Request, res: Response): Promise<void> {
    try {
      // Obter parâmetros da requisição
      const { amount = 100, description = "Teste Óticas Queiroz" } = req.body;
      
      // Verificar se o valor é um número válido
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        res.status(400).json({ 
          message: "Valor inválido para o pagamento" 
        });
        return;
      }
      
      // Construir a URL base
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.HOST_URL || req.get('host') || 'localhost:3333';
      const baseUrl = `${protocol}://${host}`;

      // Criar uma preferência simples
      try {
        // Verificar se há caixa aberto (manter isso)
        const openRegister = await this.cashRegisterModel.findOpenRegister();
        if (!openRegister) {
          throw new MercadoPagoError("Não há caixa aberto para registrar pagamentos");
        }
        
        // Criar item para a preferência com validação de tipos
        const testItem = {
          id: `test-${Date.now()}`,
          title: `Teste Óticas Queiroz`,
          description: String(description || "Pagamento de teste"),
          quantity: 1,
          currency_id: 'BRL',
          unit_price: numericAmount
        };
        
        // Criar preferência
        const preference = {
          items: [testItem],
          external_reference: `test-${Date.now()}`,
          back_urls: {
            success: `${baseUrl}/payment/success`,
            pending: `${baseUrl}/payment/pending`,
            failure: `${baseUrl}/payment/failure`
          },
          notification_url: `${baseUrl}/api/mercadopago/webhook`,
          // auto_return: "approved",
          statement_descriptor: "Óticas Queiroz"
        };
        
        // Usar a API direta para criar a preferência
        const response = await MercadoPagoAPI.createPreference(preference);
        
        // Retornar a preferência criada
        res.status(200).json({
          id: response.body.id,
          init_point: response.body.init_point,
          sandbox_init_point: response.body.sandbox_init_point
        });
      } catch (error: any) { // Tipando como any para evitar erro
        console.error("Erro detalhado ao criar preferência de teste:", error);
        
        if (error.response) {
          console.error("Resposta de erro da API do Mercado Pago:", error.response.data);
        }
        
        if (error instanceof MercadoPagoError) {
          res.status(400).json({ message: error.message });
          return;
        }
        
        throw error;  // Relançar para o tratamento global
      }
    } catch (error: any) { // Tipando como any para evitar erro
      console.error("Erro ao criar preferência de teste:", error);
      
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        details: process.env.NODE_ENV !== "production"
          ? error instanceof Error ? error.message : String(error)
          : undefined
      });
    }
  }
}