import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

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
 *             endDate:
 *               type: string
 *               format: date
 *             status:
 *               type: array
 *               items:
 *                 type: string
 *             paymentMethod:
 *               type: array
 *               items:
 *                 type: string
 *         format:
 *           type: string
 *           enum: [json, pdf, excel]
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, error]
 */

const router = Router();
const reportController = new ReportController();

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Criar novo relatório
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
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
 *               type:
 *                 type: string
 *                 enum: [sales, inventory, customers, orders, financial]
 *               filters:
 *                 type: object
 *               format:
 *                 type: string
 *                 enum: [json, pdf, excel]
 *     responses:
 *       201:
 *         description: Relatório criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post(
  "/",
  authenticate,
  authorize(["admin", "employee"]),
  reportController.createReport.bind(reportController)
);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Listar relatórios do usuário
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
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
 *         description: Quantidade de itens por página
 *     responses:
 *       200:
 *         description: Lista de relatórios
 *       401:
 *         description: Não autorizado
 */
router.get(
  "/",
  authenticate,
  reportController.getUserReports.bind(reportController)
);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Buscar relatório por ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relatório encontrado
 *       404:
 *         description: Relatório não encontrado
 */
router.get(
  "/:id",
  authenticate,
  reportController.getReport.bind(reportController)
);

export default router;
