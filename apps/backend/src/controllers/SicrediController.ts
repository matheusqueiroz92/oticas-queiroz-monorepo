import type { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { SicrediService } from "../services/SicrediService";
import { getSicrediConfig } from "../config/sicredi";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Schema de validação para geração de boleto
const generateBoletoSchema = z.object({
  paymentId: z.string().min(1, "ID do pagamento é obrigatório"),
  customerData: z.object({
    cpfCnpj: z.string().min(11, "CPF/CNPJ é obrigatório"),
    nome: z.string().min(2, "Nome é obrigatório"),
    endereco: z.object({
      logradouro: z.string().min(1, "Logradouro é obrigatório"),
      numero: z.string().min(1, "Número é obrigatório"),
      complemento: z.string().optional(),
      bairro: z.string().min(1, "Bairro é obrigatório"),
      cidade: z.string().min(1, "Cidade é obrigatória"),
      uf: z.string().length(2, "UF deve ter 2 caracteres"),
      cep: z.string().min(8, "CEP é obrigatório"),
    }),
  }),
});

// Schema de validação para cancelamento de boleto
const cancelBoletoSchema = z.object({
  paymentId: z.string().min(1, "ID do pagamento é obrigatório"),
  motivo: z.enum([
    "ACERTOS",
    "APEDIDODOCLIENTE", 
    "PAGODIRETOAOCLIENTE",
    "SUBSTITUICAO",
    "FALTADESOLUCAO",
    "APEDIDODOBENEFICIARIO"
  ], {
    errorMap: () => ({ message: "Motivo de cancelamento inválido" }),
  }),
});

export class SicrediController {
  private paymentService: PaymentService;
  private sicrediService: SicrediService;

  constructor() {
    this.paymentService = new PaymentService();
    this.sicrediService = new SicrediService();
  }

  /**
   * @swagger
   * /api/sicredi/test-connection:
   *   get:
   *     summary: Testa conexão com SICREDI
   *     security:
   *       - bearerAuth: []
   *     tags: [SICREDI]
   *     responses:
   *       200:
   *         description: Resultado do teste de conexão
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       500:
   *         description: Erro interno do servidor
   */
  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      // Endpoint público para teste de conexão - não requer autenticação

      const result = await this.paymentService.testSicrediConnection();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Conexão com SICREDI estabelecida com sucesso"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Falha na conexão com SICREDI",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão SICREDI:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }

  /**
   * @swagger
   * /api/sicredi/generate-boleto:
   *   post:
   *     summary: Gera boleto via SICREDI
   *     security:
   *       - bearerAuth: []
   *     tags: [SICREDI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - paymentId
   *               - customerData
   *             properties:
   *               paymentId:
   *                 type: string
   *                 description: ID do pagamento
   *               customerData:
   *                 type: object
   *                 properties:
   *                   cpfCnpj:
   *                     type: string
   *                   nome:
   *                     type: string
   *                   endereco:
   *                     type: object
   *                     properties:
   *                       logradouro:
   *                         type: string
   *                       numero:
   *                         type: string
   *                       complemento:
   *                         type: string
   *                       bairro:
   *                         type: string
   *                       cidade:
   *                         type: string
   *                       uf:
   *                         type: string
   *                       cep:
   *                         type: string
   *     responses:
   *       200:
   *         description: Boleto gerado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     nossoNumero:
   *                       type: string
   *                     codigoBarras:
   *                       type: string
   *                     linhaDigitavel:
   *                       type: string
   *                     pdfUrl:
   *                       type: string
   *                     qrCode:
   *                       type: string
   *       400:
   *         description: Dados inválidos
   *       500:
   *         description: Erro interno do servidor
   */
  async generateBoleto(req: Request, res: Response): Promise<void> {
    try {
      // Endpoint público para teste - não requer autenticação

      // Validar dados de entrada
      const validatedData = generateBoletoSchema.parse(req.body);

      // Para teste, vamos gerar o boleto diretamente via SICREDI
      // sem depender de um pagamento existente
      const boletoRequest = {
        pagador: validatedData.customerData,
        boleto: {
          seuNumero: validatedData.paymentId,
          valor: 100.00, // Valor fixo para teste
          dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
          dataEmissao: new Date().toISOString().split('T')[0],
          dataLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
          mensagem: "Pagamento de teste - Óticas Queiroz"
        },
        cobranca: {
          codigoBeneficiario: getSicrediConfig().cooperativeCode,
          codigoPosto: getSicrediConfig().postCode,
          especieDocumento: "01" // Duplicata
        }
      };

      const result = await this.sicrediService.generateBoleto(boletoRequest);

      if (result.status === 'success') {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Boleto gerado com sucesso"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Erro ao gerar boleto",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Erro ao gerar boleto SICREDI:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }

  /**
   * @swagger
   * /api/sicredi/check-status/{paymentId}:
   *   get:
   *     summary: Consulta status de boleto SICREDI
   *     security:
   *       - bearerAuth: []
   *     tags: [SICREDI]
   *     parameters:
   *       - in: path
   *         name: paymentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do pagamento
   *     responses:
   *       200:
   *         description: Status consultado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                     valorPago:
   *                       type: number
   *                     dataPagamento:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Dados inválidos
   *       500:
   *         description: Erro interno do servidor
   */
  async checkBoletoStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const { paymentId } = req.params;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: "ID do pagamento é obrigatório"
        });
        return;
      }

      const result = await this.paymentService.checkSicrediBoletoStatus(paymentId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Status consultado com sucesso"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Erro ao consultar status",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Erro ao consultar status do boleto SICREDI:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }

  /**
   * @swagger
   * /api/sicredi/cancel-boleto:
   *   post:
   *     summary: Cancela boleto SICREDI
   *     security:
   *       - bearerAuth: []
   *     tags: [SICREDI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - paymentId
   *               - motivo
   *             properties:
   *               paymentId:
   *                 type: string
   *                 description: ID do pagamento
   *               motivo:
   *                 type: string
   *                 enum: [ACERTOS, APEDIDODOCLIENTE, PAGODIRETOAOCLIENTE, SUBSTITUICAO, FALTADESOLUCAO, APEDIDODOBENEFICIARIO]
   *                 description: Motivo do cancelamento
   *     responses:
   *       200:
   *         description: Boleto cancelado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Dados inválidos
   *       500:
   *         description: Erro interno do servidor
   */
  async cancelBoleto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      // Validar dados de entrada
      const validatedData = cancelBoletoSchema.parse(req.body);

      const result = await this.paymentService.cancelSicrediBoleto(
        validatedData.paymentId,
        validatedData.motivo
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Boleto cancelado com sucesso"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Erro ao cancelar boleto",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar boleto SICREDI:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }
}
