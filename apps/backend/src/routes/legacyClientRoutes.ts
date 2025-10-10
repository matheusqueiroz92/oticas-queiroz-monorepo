import express from "express";
import { LegacyClientController } from "../controllers/LegacyClientController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const legacyClientController = new LegacyClientController();

/**
 * @swagger
 * components:
 *   schemas:
 *     LegacyClient:
 *       type: object
 *       required:
 *         - name
 *         - identifier
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do cliente legado
 *         name:
 *           type: string
 *           description: Nome completo do cliente
 *         identifier:
 *           type: string
 *           description: CPF ou CNPJ do cliente (apenas números)
 *         phone:
 *           type: string
 *           description: Telefone de contato
 *         address:
 *           type: string
 *           description: Endereço completo
 *         totalDebt:
 *           type: number
 *           description: Valor total da dívida
 *           default: 0
 *         lastPayment:
 *           type: object
 *           properties:
 *             date:
 *               type: string
 *               format: date-time
 *               description: Data do último pagamento
 *             amount:
 *               type: number
 *               description: Valor do último pagamento
 *         paymentHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Data do pagamento
 *               amount:
 *                 type: number
 *                 description: Valor do pagamento
 *               paymentId:
 *                 type: string
 *                 description: ID do registro de pagamento
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Status do cliente
 *           default: active
 *         observations:
 *           type: string
 *           description: Observações adicionais
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
 * /api/legacy-clients:
 *   post:
 *     summary: Cadastra um novo cliente legado
 *     security:
 *       - bearerAuth: []
 *     tags: [Legacy Clients]
 *     description: Permite que administradores e funcionários cadastrem clientes legados com dívidas existentes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - identifier
 *               - totalDebt
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do cliente
 *                 example: "Maria Oliveira"
 *               identifier:
 *                 type: string
 *                 description: CPF ou CNPJ (apenas números)
 *                 example: "12345678900"
 *               phone:
 *                 type: string
 *                 description: Telefone de contato
 *                 example: "(11) 98765-4321"
 *               email:
 *                 type: string
 *                 description: Email de contato
 *                 example: "maria.oliveira@exemplo.com"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "Rua das Flores"
 *                   number:
 *                     type: string
 *                     example: "123"
 *                   complement:
 *                     type: string
 *                     example: "Apto 45"
 *                   neighborhood:
 *                     type: string
 *                     example: "Jardim Paulista"
 *                   city:
 *                     type: string
 *                     example: "São Paulo"
 *                   state:
 *                     type: string
 *                     example: "SP"
 *                   zipCode:
 *                     type: string
 *                     example: "01453-000"
 *               totalDebt:
 *                 type: number
 *                 description: Valor total da dívida
 *                 example: 1250.50
 *               observations:
 *                 type: string
 *                 description: Observações adicionais
 *                 example: "Cliente antigo, compras feitas em 2022"
 *     responses:
 *       201:
 *         description: Cliente legado criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LegacyClient'
 *       400:
 *         description: Dados inválidos ou cliente já cadastrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/",
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
 *     description: Retorna uma lista paginada de todos os clientes legados com opções de filtro
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
 *           enum: [active, inactive]
 *         description: Filtrar por status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca para nome ou identificador
 *       - in: query
 *         name: hasDebt
 *         schema:
 *           type: boolean
 *         description: Filtrar clientes com ou sem dívidas
 *     responses:
 *       200:
 *         description: Lista de clientes legados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LegacyClient'
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
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/",
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
 *     description: Permite buscar um cliente legado pelo CPF ou CNPJ
 *     parameters:
 *       - in: query
 *         name: document
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF ou CNPJ do cliente (apenas números)
 *         example: "12345678900"
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LegacyClient'
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/search",
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
 *     description: Retorna uma lista filtrada de clientes legados que possuem dívidas
 *     parameters:
 *       - in: query
 *         name: minDebt
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Valor mínimo da dívida
 *         example: 100
 *       - in: query
 *         name: maxDebt
 *         schema:
 *           type: number
 *         description: Valor máximo da dívida
 *         example: 1000
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
 *         description: Lista de clientes devedores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LegacyClient'
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
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/debtors",
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
 *     description: Retorna os detalhes de um cliente legado específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalhes do cliente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LegacyClient'
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/:id",
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
 *     description: Permite que administradores e funcionários atualizem os dados de um cliente legado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *         example: "60d21b4667d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do cliente
 *               email:
 *                 type: string
 *                 description: Email de contato
 *               phone:
 *                 type: string
 *                 description: Telefone de contato
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
 *                 description: Observações adicionais
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LegacyClient'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/:id",
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
 *     description: Retorna o histórico detalhado de pagamentos de um cliente legado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *         example: "60d21b4667d0d8992e610c85"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *         example: "2023-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *         example: "2023-12-31"
 *     responses:
 *       200:
 *         description: Histórico de pagamentos do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   amount:
 *                     type: number
 *                   paymentId:
 *                     type: string
 *                   paymentDetails:
 *                     type: object
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/:id/payment-history",
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
 *     description: Permite que administradores ativem ou desativem um cliente legado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Status alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LegacyClient'
 *       400:
 *         description: Não é possível inativar cliente com dívidas
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 *       500:
 *         description: Erro interno do servidor
 */
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize(["admin"]),
  asyncHandler(
    legacyClientController.toggleClientStatus.bind(legacyClientController)
  )
);

export default router;
