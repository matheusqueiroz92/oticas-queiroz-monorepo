import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const reportController = new ReportController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do relatório
 *         name:
 *           type: string
 *           description: Nome do relatório
 *         type:
 *           type: string
 *           enum: [sales, inventory, customers, orders, financial]
 *           description: Tipo do relatório
 *         filters:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *               description: Data inicial para filtro
 *             endDate:
 *               type: string
 *               format: date
 *               description: Data final para filtro
 *             status:
 *               type: array
 *               items:
 *                 type: string
 *               description: Status para filtro
 *             paymentMethod:
 *               type: array
 *               items:
 *                 type: string
 *               description: Métodos de pagamento para filtro
 *             productCategory:
 *               type: array
 *               items:
 *                 type: string
 *               description: Categorias de produto para filtro
 *             minValue:
 *               type: number
 *               description: Valor mínimo para filtro
 *             maxValue:
 *               type: number
 *               description: Valor máximo para filtro
 *         data:
 *           type: object
 *           description: Dados do relatório gerado
 *         createdBy:
 *           type: string
 *           description: ID do usuário que criou o relatório
 *         format:
 *           type: string
 *           enum: [json, pdf, excel]
 *           description: Formato do relatório
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, error]
 *           description: Status atual do relatório
 *         errorMessage:
 *           type: string
 *           description: Mensagem de erro (se status for error)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do relatório
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização do relatório
 */

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Cria um novo relatório
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     description: Permite que administradores e funcionários criem novos relatórios personalizados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do relatório
 *                 example: "Relatório de Vendas Mensal"
 *               type:
 *                 type: string
 *                 enum: [sales, inventory, customers, orders, financial]
 *                 description: Tipo do relatório
 *                 example: "sales"
 *               filters:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date
 *                     example: "2023-01-01"
 *                   endDate:
 *                     type: string
 *                     format: date
 *                     example: "2023-01-31"
 *                   status:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["completed"]
 *                   paymentMethod:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["credit", "debit"]
 *                   productCategory:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["sunglasses"]
 *                   minValue:
 *                     type: number
 *                     example: 100
 *                   maxValue:
 *                     type: number
 *                     example: 1000
 *               format:
 *                 type: string
 *                 enum: [json, pdf, excel]
 *                 description: Formato do relatório
 *                 example: "excel"
 *     responses:
 *       201:
 *         description: Relatório criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/reports",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(reportController.createReport.bind(reportController))
);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Lista os relatórios do usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     description: Retorna uma lista paginada dos relatórios criados pelo usuário logado
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
 *           enum: [sales, inventory, customers, orders, financial]
 *         description: Filtrar por tipo de relatório
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, error]
 *         description: Filtrar por status do relatório
 *     responses:
 *       200:
 *         description: Lista de relatórios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
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
  "/reports",
  authenticate,
  asyncHandler(reportController.getUserReports.bind(reportController))
);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Obtém um relatório pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     description: Retorna os detalhes e dados de um relatório específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do relatório
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalhes do relatório
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Relatório não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. O relatório pertence a outro usuário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/reports/:id",
  authenticate,
  asyncHandler(reportController.getReport.bind(reportController))
);

export default router;
