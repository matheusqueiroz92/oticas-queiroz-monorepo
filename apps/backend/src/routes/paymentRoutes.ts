import express from "express";
import { PaymentController } from "../controllers/PaymentController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validateAndUpdateRelationships } from "../middlewares/relationshipMiddleware";

const router = express.Router();
const paymentController = new PaymentController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - amount
 *         - date
 *         - type
 *         - paymentMethod
 *         - createdBy
 *         - cashRegisterId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do pagamento
 *         createdBy:
 *           type: string
 *           description: ID do usuário que criou o pagamento
 *         customerId:
 *           type: string
 *           description: ID do cliente (opcional)
 *         legacyClientId:
 *           type: string
 *           description: ID do cliente legado (opcional)
 *         cashRegisterId:
 *           type: string
 *           description: ID do caixa onde o pagamento foi registrado
 *         orderId:
 *           type: string
 *           description: ID do pedido associado (opcional)
 *         amount:
 *           type: number
 *           description: Valor do pagamento
 *         date:
 *           type: string
 *           format: date-time
 *           description: Data e hora do pagamento
 *         type:
 *           type: string
 *           enum: [sale, debt_payment, expense]
 *           description: Tipo do pagamento
 *         paymentMethod:
 *           type: string
 *           enum: [credit, debit, cash, pix, installment]
 *           description: Método de pagamento
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           description: Status do pagamento
 *         installments:
 *           type: object
 *           properties:
 *             current:
 *               type: number
 *               description: Número da parcela atual
 *             total:
 *               type: number
 *               description: Número total de parcelas
 *             value:
 *               type: number
 *               description: Valor de cada parcela
 *         description:
 *           type: string
 *           description: Descrição do pagamento
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *         isDeleted:
 *           type: boolean
 *           description: Indica se o pagamento foi excluído logicamente
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: Data da exclusão lógica
 *         deletedBy:
 *           type: string
 *           description: ID do usuário que excluiu o pagamento
 */

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
 *                 example: 150.50
 *               type:
 *                 type: string
 *                 enum: [sale, debt_payment, expense]
 *                 description: Tipo do pagamento
 *                 example: sale
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit, debit, cash, pix, installment]
 *                 description: Método de pagamento
 *                 example: credit
 *               installments:
 *                 type: object
 *                 properties:
 *                   current:
 *                     type: number
 *                     example: 1
 *                   total:
 *                     type: number
 *                     example: 3
 *                   value:
 *                     type: number
 *                     example: 50.17
 *               orderId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               customerId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c86
 *               legacyClientId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c87
 *               description:
 *                 type: string
 *                 example: Pagamento de óculos de sol
 *     responses:
 *       201:
 *         description: Pagamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Dados inválidos ou erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/payments",
  authenticate,
  authorize(["admin", "employee"]),
  validateAndUpdateRelationships,
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
 *     description: Retorna uma lista paginada de pagamentos com opções de filtro
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, debt_payment, expense]
 *         description: Filtrar por tipo de pagamento
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [credit, debit, cash, pix, installment]
 *         description: Filtrar por método de pagamento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filtrar por status do pagamento
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
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
 *     description: Busca todos os pagamentos de uma data específica ou da data atual
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/payments/daily",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.getDailyPayments.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/report/daily:
 *   get:
 *     summary: Gera relatório financeiro diário
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Gera um relatório financeiro completo para uma data específica
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data para o relatório (default é a data atual)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf, csv]
 *           default: excel
 *         description: Formato do relatório gerado
 *     responses:
 *       200:
 *         description: Relatório financeiro
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/payments/report/daily",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    paymentController.getDailyFinancialReport.bind(paymentController)
  )
);

/**
 * @swagger
 * /api/payments/export:
 *   get:
 *     summary: Exporta pagamentos filtrados
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Gera um arquivo de exportação dos pagamentos com base nos filtros
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf, csv]
 *           default: excel
 *         description: Formato do arquivo gerado
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, debt_payment, expense]
 *         description: Filtrar por tipo de pagamento
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [credit, debit, cash, pix, installment]
 *         description: Filtrar por método de pagamento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filtrar por status do pagamento
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Título personalizado para o relatório
 *     responses:
 *       200:
 *         description: Arquivo de exportação gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/payments/export",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.exportPayments.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/deleted:
 *   get:
 *     summary: Lista pagamentos excluídos logicamente
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Retorna pagamentos que foram marcados como excluídos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, debt_payment, expense]
 *         description: Filtrar por tipo de pagamento
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [credit, debit, cash, pix, installment]
 *         description: Filtrar por método de pagamento
 *     responses:
 *       200:
 *         description: Lista de pagamentos excluídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/payments/deleted",
  authenticate,
  authorize(["admin"]),
  asyncHandler(paymentController.getDeletedPayments.bind(paymentController))
);

router.get(
  '/api/payments/recalculate-debts',
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.recalculateDebts.bind(paymentController)));

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Retorna um pagamento específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Busca um pagamento pelo seu ID
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Pagamento não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
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
 *     description: Cancela um pagamento existente e reverte suas alterações financeiras
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Pagamento não pode ser cancelado
 *       404:
 *         description: Pagamento não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/payments/:id/cancel",
  authenticate,
  authorize(["admin"]),
  validateAndUpdateRelationships,
  asyncHandler(paymentController.cancelPayment.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/{id}/delete:
 *   post:
 *     summary: Realiza exclusão lógica (soft delete) de um pagamento
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Marca um pagamento como excluído sem removê-lo do banco de dados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Pagamento excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Pagamento não pode ser excluído
 *       404:
 *         description: Pagamento não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/payments/:id/delete",
  authenticate,
  authorize(["admin"]),
  validateAndUpdateRelationships,
  asyncHandler(paymentController.softDeletePayment.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/{id}/check-status:
 *   put:
 *     summary: Atualiza o status de compensação de um cheque
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Permite atualizar o status de compensação de um pagamento feito com cheque
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, compensated, rejected]
 *                 description: Novo status de compensação
 *               rejectionReason:
 *                 type: string
 *                 description: Razão da rejeição (obrigatório se status for rejected)
 *     responses:
 *       200:
 *         description: Status do cheque atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou pagamento não é um cheque
 *       404:
 *         description: Pagamento não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/payments/:id/check-status",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.updateCheckStatus.bind(paymentController))
);

/**
 * @swagger
 * /api/payments/checks/{status}:
 *   get:
 *     summary: Lista cheques por status de compensação
 *     security:
 *       - bearerAuth: []
 *     tags: [Payments]
 *     description: Retorna uma lista de pagamentos realizados com cheque filtrados por status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, compensated, rejected]
 *         description: Status de compensação
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *     responses:
 *       200:
 *         description: Lista de cheques
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/payments/checks/:status",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(paymentController.getChecksByStatus.bind(paymentController))
);

export default router;
