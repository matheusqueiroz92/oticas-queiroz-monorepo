import express from "express";
import { CashRegisterController } from "../controllers/CashRegisterController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const cashRegisterController = new CashRegisterController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CashRegister:
 *       type: object
 *       required:
 *         - openingDate
 *         - openingBalance
 *         - currentBalance
 *         - status
 *         - sales
 *         - payments
 *         - openedBy
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do caixa
 *         openingDate:
 *           type: string
 *           format: date-time
 *           description: Data e hora de abertura do caixa
 *         closingDate:
 *           type: string
 *           format: date-time
 *           description: Data e hora de fechamento do caixa (se estiver fechado)
 *         openingBalance:
 *           type: number
 *           description: Saldo inicial do caixa
 *         currentBalance:
 *           type: number
 *           description: Saldo atual do caixa
 *         closingBalance:
 *           type: number
 *           description: Saldo final do caixa (se estiver fechado)
 *         status:
 *           type: string
 *           enum: [open, closed]
 *           description: Estado atual do caixa
 *         sales:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de vendas
 *             cash:
 *               type: number
 *               description: Total de vendas em dinheiro
 *             credit:
 *               type: number
 *               description: Total de vendas com cartão de crédito
 *             debit:
 *               type: number
 *               description: Total de vendas com cartão de débito
 *             pix:
 *               type: number
 *               description: Total de vendas com PIX
 *         payments:
 *           type: object
 *           properties:
 *             received:
 *               type: number
 *               description: Total de pagamentos recebidos (dívidas)
 *             made:
 *               type: number
 *               description: Total de pagamentos realizados (despesas)
 *         openedBy:
 *           type: string
 *           description: ID do usuário que abriu o caixa
 *         closedBy:
 *           type: string
 *           description: ID do usuário que fechou o caixa (se estiver fechado)
 *         observations:
 *           type: string
 *           description: Observações sobre o caixa
 *         isDeleted:
 *           type: boolean
 *           description: Indica se o caixa foi excluído logicamente
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: Data de exclusão lógica
 *         deletedBy:
 *           type: string
 *           description: ID do usuário que excluiu o caixa
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 */

/**
 * @swagger
 * /api/cash-registers:
 *   get:
 *     summary: Lista todos os registros de caixa
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Retorna uma lista paginada de registros de caixa
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *         description: Filtrar por status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca (ID ou texto nas observações)
 *     responses:
 *       200:
 *         description: Lista de registros de caixa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CashRegister'
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
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 */
router.get(
  "/",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.getAllRegisters.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/open:
 *   post:
 *     summary: Abre um novo caixa
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Abre um novo caixa. Só pode ser aberto se não houver outro caixa aberto.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - openingBalance
 *             properties:
 *               openingBalance:
 *                 type: number
 *                 description: Saldo inicial do caixa
 *                 example: 100.00
 *               observations:
 *                 type: string
 *                 description: Observações sobre a abertura do caixa
 *                 example: "Abertura de caixa para o turno da manhã"
 *     responses:
 *       201:
 *         description: Caixa aberto com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       400:
 *         description: Já existe um caixa aberto ou dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 */
router.post(
  "/open",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(cashRegisterController.openRegister.bind(cashRegisterController))
);

/**
 * @swagger
 * /api/cash-registers/close:
 *   post:
 *     summary: Fecha o caixa atual
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Fecha o caixa atual, calculando a diferença entre o valor esperado e o informado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - closingBalance
 *             properties:
 *               closingBalance:
 *                 type: number
 *                 description: Saldo final do caixa
 *                 example: 350.50
 *               observations:
 *                 type: string
 *                 description: Observações sobre o fechamento do caixa
 *                 example: "Fechamento sem problemas"
 *     responses:
 *       200:
 *         description: Caixa fechado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       400:
 *         description: Não há caixa aberto ou dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 */
router.post(
  "/close",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.closeRegister.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/current:
 *   get:
 *     summary: Retorna o caixa atual
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Retorna informações do caixa aberto atualmente
 *     responses:
 *       200:
 *         description: Informações do caixa atual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       404:
 *         description: Não há caixa aberto
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/current",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.getCurrentRegister.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/summary/daily:
 *   get:
 *     summary: Retorna o resumo diário dos caixas
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Obtém um resumo financeiro de todos os caixas de um dia específico
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data para consulta (default é a data atual)
 *         example: "2023-12-31"
 *     responses:
 *       200:
 *         description: Resumo diário dos caixas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 openingBalance:
 *                   type: number
 *                   description: Saldo inicial total do dia
 *                 currentBalance:
 *                   type: number
 *                   description: Saldo atual total do dia
 *                 totalSales:
 *                   type: number
 *                   description: Total de vendas do dia
 *                 totalPaymentsReceived:
 *                   type: number
 *                   description: Total de pagamentos recebidos do dia
 *                 totalExpenses:
 *                   type: number
 *                   description: Total de despesas do dia
 *                 salesByMethod:
 *                   type: object
 *                   description: Vendas agrupadas por método de pagamento
 *                 expensesByCategory:
 *                   type: object
 *                   description: Despesas agrupadas por categoria
 *       404:
 *         description: Nenhum caixa encontrado para a data
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/summary/daily",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.getDailySummary.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/export/daily:
 *   get:
 *     summary: Exporta o resumo diário dos caixas
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Gera um arquivo com o resumo financeiro de todos os caixas de um dia específico
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data para o relatório (padrão é a data atual)
 *         example: "2023-12-31"
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf, csv]
 *           default: excel
 *         description: Formato de exportação
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Título personalizado para o relatório
 *     responses:
 *       200:
 *         description: Arquivo exportado com sucesso
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
 *       404:
 *         description: Nenhum caixa encontrado para a data
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/export/daily",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.exportDailySummary.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/deleted:
 *   get:
 *     summary: Lista caixas excluídos logicamente
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Retorna uma lista paginada de registros de caixa marcados como excluídos
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
 *     responses:
 *       200:
 *         description: Lista de caixas excluídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CashRegister'
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
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 */
router.get(
  "/deleted",
  authenticate,
  authorize(["admin"]),
  asyncHandler(
    cashRegisterController.getDeletedRegisters.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/{id}:
 *   get:
 *     summary: Retorna um caixa específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Busca informações de um caixa pelo seu ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Informações do caixa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       404:
 *         description: Caixa não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/cash-registers/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.getRegisterById.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/{id}/summary:
 *   get:
 *     summary: Retorna o resumo de um caixa específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Obtém um resumo detalhado das operações de um caixa específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Resumo do caixa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 register:
 *                   $ref: '#/components/schemas/CashRegister'
 *                 payments:
 *                   type: object
 *                   properties:
 *                     sales:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         byMethod:
 *                           type: object
 *                     debts:
 *                       type: object
 *                       properties:
 *                         received:
 *                           type: number
 *                         byMethod:
 *                           type: object
 *                     expenses:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         byCategory:
 *                           type: object
 *       404:
 *         description: Caixa não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/cash-registers/:id/summary",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.getRegisterSummary.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/{id}/delete:
 *   post:
 *     summary: Realiza exclusão lógica (soft delete) de um caixa
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Marca um registro de caixa como excluído sem removê-lo permanentemente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Caixa excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       400:
 *         description: Caixa não pode ser excluído (está aberto)
 *       404:
 *         description: Caixa não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 */
router.post(
  "/cash-registers/:id/delete",
  authenticate,
  authorize(["admin"]),
  asyncHandler(
    cashRegisterController.softDeleteRegister.bind(cashRegisterController)
  )
);

/**
 * @swagger
 * /api/cash-registers/{id}/export:
 *   get:
 *     summary: Exporta o resumo de um caixa específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     description: Gera um arquivo com o resumo detalhado das operações de um caixa específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *         example: "60d21b4667d0d8992e610c85"
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf, csv]
 *           default: excel
 *         description: Formato de exportação
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Título personalizado para o relatório
 *     responses:
 *       200:
 *         description: Arquivo exportado com sucesso
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
 *       404:
 *         description: Caixa não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/cash-registers/:id/export",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.exportRegisterSummary.bind(cashRegisterController)
  )
);

export default router;
