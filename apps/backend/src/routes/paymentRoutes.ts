import express from "express";
import { PaymentController } from "../controllers/PaymentController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const paymentController = new PaymentController();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Cria um novo pagamento
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Registra um novo pagamento (venda, recebimento de dívida ou despesa)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Valor do pagamento
 *               type:
 *                 type: string
 *                 enum: [sale, debt_payment, expense]
 *                 description: Tipo do pagamento
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit, debit, cash, pix, installment]
 *                 description: Método de pagamento
 *               installments:
 *                 type: object
 *                 properties:
 *                   current:
 *                     type: number
 *                   total:
 *                     type: number
 *                   value:
 *                     type: number
 *               orderId:
 *                 type: string
 *               userId:
 *                 type: string
 *               legacyClientId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pagamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post(
  "/payments",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.createPayment.bind(paymentController))
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Lista todos os pagamentos
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de itens por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, debt_payment, expense]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [credit, debit, cash, pix, installment]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/payments",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.getAllPayments.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/daily:
 *   get:
 *     summary: Retorna os pagamentos do dia
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data para consulta (default é a data atual)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, debt_payment, expense]
 *         description: Filtrar por tipo de pagamento
 *     responses:
 *       200:
 *         description: Lista de pagamentos do dia
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/payments/daily",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.getDailyPayments.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Retorna um pagamento específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Detalhes do pagamento
 *       404:
 *         description: Pagamento não encontrado
 */
router.get(
  "/payments/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.getPaymentById.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/{id}/cancel:
 *   post:
 *     summary: Cancela um pagamento
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Pagamento cancelado com sucesso
 *       400:
 *         description: Pagamento não pode ser cancelado
 *       404:
 *         description: Pagamento não encontrado
 */
router.post(
  "/payments/:id/cancel",
  authenticate,
  authorize(["admin"]),
  asyncHandler(paymentController.cancelPayment.bind(paymentController))
);

export default router;
