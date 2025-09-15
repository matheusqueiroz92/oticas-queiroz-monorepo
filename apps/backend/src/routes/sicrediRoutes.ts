import express from "express";
import { SicrediController } from "../controllers/SicrediController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const sicrediController = new SicrediController();

/**
 * @swagger
 * tags:
 *   name: SICREDI
 *   description: Integração com API de cobrança da SICREDI
 */

/**
 * @swagger
 * /api/sicredi/test-connection:
 *   get:
 *     summary: Testa conexão com SICREDI
 *     tags: [SICREDI]
 *     description: Verifica se a integração com a API da SICREDI está funcionando
 *     responses:
 *       200:
 *         description: Conexão estabelecida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Conexão com SICREDI estabelecida com sucesso"
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/test-connection",
  asyncHandler(sicrediController.testConnection.bind(sicrediController))
);

/**
 * @swagger
 * /api/sicredi/generate-boleto:
 *   post:
 *     summary: Gera boleto via SICREDI
 *     tags: [SICREDI]
 *     description: Gera um boleto bancário através da API da SICREDI
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
 *                 description: ID do pagamento existente
 *                 example: "507f1f77bcf86cd799439011"
 *               customerData:
 *                 type: object
 *                 required:
 *                   - cpfCnpj
 *                   - nome
 *                   - endereco
 *                 properties:
 *                   cpfCnpj:
 *                     type: string
 *                     description: CPF ou CNPJ do pagador
 *                     example: "12345678901"
 *                   nome:
 *                     type: string
 *                     description: Nome completo do pagador
 *                     example: "João Silva"
 *                   endereco:
 *                     type: object
 *                     required:
 *                       - logradouro
 *                       - numero
 *                       - bairro
 *                       - cidade
 *                       - uf
 *                       - cep
 *                     properties:
 *                       logradouro:
 *                         type: string
 *                         description: Nome da rua
 *                         example: "Rua das Flores"
 *                       numero:
 *                         type: string
 *                         description: Número do endereço
 *                         example: "123"
 *                       complemento:
 *                         type: string
 *                         description: Complemento do endereço
 *                         example: "Apto 45"
 *                       bairro:
 *                         type: string
 *                         description: Bairro
 *                         example: "Centro"
 *                       cidade:
 *                         type: string
 *                         description: Cidade
 *                         example: "São Paulo"
 *                       uf:
 *                         type: string
 *                         description: Estado (UF)
 *                         example: "SP"
 *                       cep:
 *                         type: string
 *                         description: CEP
 *                         example: "01234-567"
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     nossoNumero:
 *                       type: string
 *                       description: Número do boleto na SICREDI
 *                       example: "12345678901234567890"
 *                     codigoBarras:
 *                       type: string
 *                       description: Código de barras do boleto
 *                       example: "74891123456789012345678901234567890123456789"
 *                     linhaDigitavel:
 *                       type: string
 *                       description: Linha digitável do boleto
 *                       example: "74891.12345 67890.123456 78901.234567 8 90123456789012"
 *                     pdfUrl:
 *                       type: string
 *                       description: URL para download do PDF do boleto
 *                       example: "https://api.sicredi.com.br/boletos/12345678901234567890.pdf"
 *                     qrCode:
 *                       type: string
 *                       description: Código QR do boleto
 *                       example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *                 message:
 *                   type: string
 *                   example: "Boleto gerado com sucesso"
 *       400:
 *         description: Dados inválidos ou erro na geração
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao gerar boleto"
 *                 error:
 *                   type: string
 *                   example: "Pagamento não encontrado"
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/generate-boleto",
  asyncHandler(sicrediController.generateBoleto.bind(sicrediController))
);

/**
 * @swagger
 * /api/sicredi/check-status/{paymentId}:
 *   get:
 *     summary: Consulta status de boleto SICREDI
 *     security:
 *       - bearerAuth: []
 *     tags: [SICREDI]
 *     description: Consulta o status atual de um boleto gerado via SICREDI
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *         example: "507f1f77bcf86cd799439011"
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       description: Status atual do boleto
 *                       enum: [REGISTRADO, BAIXADO, PAGO, VENCIDO, PROTESTADO, CANCELADO]
 *                       example: "PAGO"
 *                     valorPago:
 *                       type: number
 *                       description: Valor pago (se aplicável)
 *                       example: 150.50
 *                     dataPagamento:
 *                       type: string
 *                       format: date-time
 *                       description: Data do pagamento (se aplicável)
 *                       example: "2024-01-15T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Status consultado com sucesso"
 *       400:
 *         description: Dados inválidos ou erro na consulta
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/check-status/:paymentId",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(sicrediController.checkBoletoStatus.bind(sicrediController))
);

/**
 * @swagger
 * /api/sicredi/cancel-boleto:
 *   post:
 *     summary: Cancela boleto SICREDI
 *     security:
 *       - bearerAuth: []
 *     tags: [SICREDI]
 *     description: Cancela um boleto gerado via SICREDI
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
 *                 example: "507f1f77bcf86cd799439011"
 *               motivo:
 *                 type: string
 *                 enum: [ACERTOS, APEDIDODOCLIENTE, PAGODIRETOAOCLIENTE, SUBSTITUICAO, FALTADESOLUCAO, APEDIDODOBENEFICIARIO]
 *                 description: Motivo do cancelamento
 *                 example: "APEDIDODOCLIENTE"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Boleto cancelado com sucesso"
 *       400:
 *         description: Dados inválidos ou erro no cancelamento
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/cancel-boleto",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(sicrediController.cancelBoleto.bind(sicrediController))
);

export default router;
