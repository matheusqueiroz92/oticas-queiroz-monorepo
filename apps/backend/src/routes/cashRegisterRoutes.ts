import express from "express";
import { CashRegisterController } from "../controllers/CashRegisterController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const cashRegisterController = new CashRegisterController();

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
 *               observations:
 *                 type: string
 *                 description: Observações sobre a abertura do caixa
 *     responses:
 *       201:
 *         description: Caixa aberto com sucesso
 *       400:
 *         description: Já existe um caixa aberto
 *       401:
 *         description: Não autorizado
 */
router.post(
  "/cash-registers/open",
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
 *               observations:
 *                 type: string
 *                 description: Observações sobre o fechamento do caixa
 *     responses:
 *       200:
 *         description: Caixa fechado com sucesso
 *       400:
 *         description: Não há caixa aberto
 *       401:
 *         description: Não autorizado
 */
router.post(
  "/cash-registers/close",
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
 *       404:
 *         description: Não há caixa aberto
 */
router.get(
  "/cash-registers/current",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.getCurrentRegister.bind(cashRegisterController)
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *     responses:
 *       200:
 *         description: Informações do caixa
 *       404:
 *         description: Caixa não encontrado
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caixa
 *     responses:
 *       200:
 *         description: Resumo do caixa
 *       404:
 *         description: Caixa não encontrado
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
 * /api/cash-registers/summary/daily:
 *   get:
 *     summary: Retorna o resumo diário dos caixas
 *     security:
 *       - bearerAuth: []
 *     tags: [Cash Register]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data para consulta (default é a data atual)
 *     responses:
 *       200:
 *         description: Resumo diário dos caixas
 *       404:
 *         description: Nenhum caixa encontrado para a data
 */
router.get(
  "/cash-registers/summary/daily",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    cashRegisterController.getDailySummary.bind(cashRegisterController)
  )
);

export default router;
