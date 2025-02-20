import express from "express";
import { LegacyClientController } from "../controllers/LegacyClientController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const legacyClientController = new LegacyClientController();

/**
 * @swagger
 * /api/legacy-clients:
 *   post:
 *     summary: Cadastra um novo cliente legado
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     description: Cria um novo registro de cliente legado com dívidas existentes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - documentId
 *               - totalDebt
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do cliente
 *               documentId:
 *                 type: string
 *                 description: CPF ou CNPJ (apenas números)
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   number:
 *                     type: string
 *                   complement:
 *                     type: string
 *                   neighborhood:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               totalDebt:
 *                 type: number
 *                 description: Valor total da dívida
 *               observations:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente legado criado com sucesso
 *       400:
 *         description: Dados inválidos ou cliente já cadastrado
 */
router.post(
  "/legacy-clients",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    legacyClientController.createLegacyClient.bind(legacyClientController)
  )
);

/**
 * @swagger
 * /api/legacy-clients:
 *   get:
 *     summary: Lista todos os clientes legados
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista paginada de clientes legados
 */
router.get(
  "/legacy-clients",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    legacyClientController.getAllLegacyClients.bind(legacyClientController)
  )
);

/**
 * @swagger
 * /api/legacy-clients/search:
 *   get:
 *     summary: Busca cliente por documento
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     parameters:
 *       - in: query
 *         name: document
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF ou CNPJ do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente não encontrado
 */
router.get(
  "/legacy-clients/search",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    legacyClientController.findByDocument.bind(legacyClientController)
  )
);

/**
 * @swagger
 * /api/legacy-clients/debtors:
 *   get:
 *     summary: Lista clientes com dívidas
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     parameters:
 *       - in: query
 *         name: minDebt
 *         schema:
 *           type: number
 *         description: Valor mínimo da dívida
 *       - in: query
 *         name: maxDebt
 *         schema:
 *           type: number
 *         description: Valor máximo da dívida
 *     responses:
 *       200:
 *         description: Lista de clientes devedores
 */
router.get(
  "/legacy-clients/debtors",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(legacyClientController.getDebtors.bind(legacyClientController))
);

/**
 * @swagger
 * /api/legacy-clients/{id}:
 *   get:
 *     summary: Retorna um cliente específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Detalhes do cliente
 *       404:
 *         description: Cliente não encontrado
 */
router.get(
  "/legacy-clients/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    legacyClientController.getLegacyClientById.bind(legacyClientController)
  )
);

/**
 * @swagger
 * /api/legacy-clients/{id}:
 *   put:
 *     summary: Atualiza um cliente
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               totalDebt:
 *                 type: number
 *               observations:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.put(
  "/legacy-clients/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    legacyClientController.updateLegacyClient.bind(legacyClientController)
  )
);

/**
 * @swagger
 * /api/legacy-clients/{id}/payment-history:
 *   get:
 *     summary: Retorna histórico de pagamentos
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Histórico de pagamentos do cliente
 */
router.get(
  "/legacy-clients/:id/payment-history",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    legacyClientController.getPaymentHistory.bind(legacyClientController)
  )
);

/**
 * @swagger
 * /api/legacy-clients/{id}/toggle-status:
 *   patch:
 *     summary: Altera o status do cliente
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status alterado com sucesso
 *       400:
 *         description: Não é possível inativar cliente com dívidas
 */
router.patch(
  "/legacy-clients/:id/toggle-status",
  authenticate,
  authorize(["admin"]),
  asyncHandler(
    legacyClientController.toggleClientStatus.bind(legacyClientController)
  )
);

export default router;
