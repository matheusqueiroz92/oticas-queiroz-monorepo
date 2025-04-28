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
      console.log("[MercadoPagoController] Webhook recebido:", JSON.stringify(req.body, null, 2));
      
      // Verificar se é uma notificação válida
      if (!req.body || (!req.body.type && !req.body.action)) {
        console.log("[MercadoPagoController] Webhook inválido, ignorando");
        res.status(200).send("OK");
        return;
      }
      
      // Processar o webhook
      await this.mercadoPagoService.processWebhook(req.body);
      
      // Responder com sucesso
      res.status(200).send("OK");
    } catch (error) {
      console.error("[MercadoPagoController] Erro ao processar webhook:", error);
      
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
}