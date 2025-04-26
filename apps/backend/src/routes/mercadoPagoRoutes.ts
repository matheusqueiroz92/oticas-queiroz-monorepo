import express from "express";
import { MercadoPagoController } from "../controllers/MercadoPagoController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const mercadoPagoController = new MercadoPagoController();

/**
 * @swagger
 * components:
 *   schemas:
 *     MercadoPagoPreference:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID da preferência de pagamento
 *         init_point:
 *           type: string
 *           description: URL para checkout no ambiente de produção
 *         sandbox_init_point:
 *           type: string
 *           description: URL para checkout no ambiente de sandbox
 */

/**
 * @swagger
 * /api/mercadopago/preference/{orderId}:
 *   post:
 *     summary: Cria uma preferência de pagamento no Mercado Pago
 *     security:
 *       - bearerAuth: []
 *     tags: [MercadoPago]
 *     description: Cria uma preferência de pagamento para um pedido no Mercado Pago
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Preferência de pagamento criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MercadoPagoPreference'
 *       400:
 *         description: Erro ao criar preferência de pagamento
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/mercadopago/preference/:orderId",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(mercadoPagoController.createPaymentPreference.bind(mercadoPagoController))
);

/**
 * @swagger
 * /api/mercadopago/webhook:
 *   post:
 *     summary: Recebe notificações do Mercado Pago
 *     tags: [MercadoPago]
 *     description: Endpoint para receber notificações (webhooks) do Mercado Pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notificação recebida com sucesso
 */
router.post(
  "/mercadopago/webhook",
  asyncHandler(mercadoPagoController.webhook.bind(mercadoPagoController))
);

/**
 * @swagger
 * /api/mercadopago/payment/{paymentId}:
 *   get:
 *     summary: Obtém informações de um pagamento
 *     security:
 *       - bearerAuth: []
 *     tags: [MercadoPago]
 *     description: Busca informações de um pagamento no Mercado Pago
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento no Mercado Pago
 *     responses:
 *       200:
 *         description: Informações do pagamento
 *       400:
 *         description: Erro ao obter informações do pagamento
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/mercadopago/payment/:paymentId",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(mercadoPagoController.getPaymentInfo.bind(mercadoPagoController))
);

/**
 * @swagger
 * /api/mercadopago/test-payment:
 *   get:
 *     summary: Página para testar pagamentos via Mercado Pago
 *     security:
 *       - bearerAuth: []
 *     tags: [MercadoPago]
 *     description: Retorna uma página HTML para testar pagamentos via Mercado Pago
 *     responses:
 *       200:
 *         description: Página HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get(
  "/mercadopago/test-payment",
  authenticate,
  authorize(["admin"]),
  asyncHandler(mercadoPagoController.getTestPaymentPage.bind(mercadoPagoController))
);

export default router;