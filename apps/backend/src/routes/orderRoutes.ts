import express from "express";
import { OrderController } from "../controllers/OrderController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validateAndUpdateRelationships } from "../middlewares/relationshipMiddleware";

const router = express.Router();

const orderController = new OrderController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - _id
 *         - name
 *         - productType
 *         - description
 *         - sellPrice
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do produto
 *         name:
 *           type: string
 *           description: Nome do produto
 *         productType:
 *           type: string
 *           enum: [lenses, clean_lenses, prescription_frame, sunglasses_frame]
 *           description: Tipo do produto
 *         description:
 *           type: string
 *           description: Descrição detalhada do produto
 *         brand:
 *           type: string
 *           description: Marca do produto
 *         sellPrice:
 *           type: number
 *           description: Preço de venda do produto
 *         costPrice:
 *           type: number
 *           description: Preço de custo (opcional)
 *         lensType:
 *           type: string
 *           description: Tipo de lente (para produtos do tipo lentes)
 *         typeFrame:
 *           type: string
 *           description: Tipo de armação (para produtos do tipo armação)
 *         color:
 *           type: string
 *           description: Cor da armação (para produtos do tipo armação)
 *         shape:
 *           type: string
 *           description: Formato da armação (para produtos do tipo armação)
 *         reference:
 *           type: string
 *           description: Referência da armação (para produtos do tipo armação)
 *         model:
 *           type: string
 *           description: Modelo da armação (para produtos do tipo armação de sol)
 *         
 *     Order:
 *       type: object
 *       required:
 *         - clientId
 *         - employeeId
 *         - product
 *         - totalPrice
 *         - finalPrice
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do pedido
 *         clientId:
 *           type: string
 *           description: ID do cliente que fez o pedido
 *         employeeId:
 *           type: string
 *           description: ID do funcionário que registrou o pedido
 *         institutionId:
 *           type: string
 *           description: ID da instituição (obrigatório para pedidos institucionais)
 *         isInstitutionalOrder:
 *           type: boolean
 *           description: Indica se o pedido é institucional (ex. APAE)
 *           default: false
 *         product:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Produtos incluídos no pedido
 *         paymentMethod:
 *           type: string
 *           description: Método de pagamento utilizado
 *         paymentEntry:
 *           type: number
 *           description: Valor de entrada pago
 *         installments:
 *           type: number
 *           description: Número de parcelas (se aplicável)
 *         deliveryDate:
 *           type: string
 *           format: date-time
 *           description: Data prevista para entrega
 *         orderDate:
 *           type: string
 *           format: date-time
 *           description: Data do pedido
 *         status:
 *           type: string
 *           enum: [pending, in_production, ready, delivered, cancelled]
 *           description: Status atual do pedido
 *         laboratoryId:
 *           type: string
 *           description: ID do laboratório responsável pelo pedido (se aplicável)
 *         prescriptionData:
 *           type: object
 *           properties:
 *             doctorName:
 *               type: string
 *             clinicName:
 *               type: string
 *             appointmentDate:
 *               type: string
 *               format: date
 *             leftEye:
 *               type: object
 *               properties:
 *                 sph:
 *                   type: number
 *                 cyl:
 *                   type: number
 *                 axis:
 *                   type: number
 *                 pd:
 *                   type: number
 *             rightEye:
 *               type: object
 *               properties:
 *                 sph:
 *                   type: number
 *                 cyl:
 *                   type: number
 *                 axis:
 *                   type: number
 *                 pd:
 *                   type: number
 *             nd:
 *               type: number
 *             oc:
 *               type: number
 *             addition:
 *               type: number
 *         totalPrice:
 *           type: number
 *           description: Valor total do pedido
 *         discount:
 *           type: number
 *           description: Valor do desconto aplicado
 *         finalPrice:
 *           type: number
 *           description: Valor final (totalPrice - discount)
 *         observations:
 *           type: string
 *           description: Observações sobre o pedido
 *         isDeleted:
 *           type: boolean
 *           description: Indica se o pedido foi excluído logicamente
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: Data da exclusão lógica
 *         deletedBy:
 *           type: string
 *           description: ID do usuário que excluiu o pedido
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do pedido
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização do pedido
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Cria um novo pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Permite que administradores e funcionários criem novos pedidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - employeeId
 *               - product
 *               - paymentMethod
 *               - orderDate
 *               - totalPrice
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: ID do cliente
 *               employeeId:
 *                 type: string
 *                 description: ID do funcionário
 *               product:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - _id
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID do produto
 *                 description: Lista de produtos do pedido
 *               paymentMethod:
 *                 type: string
 *                 description: Método de pagamento
 *               paymentEntry:
 *                 type: number
 *                 description: Valor de entrada
 *               installments:
 *                 type: number
 *                 description: Número de parcelas
 *               deliveryDate:
 *                 type: string
 *                 format: date
 *                 description: Data de entrega prevista
 *               orderDate:
 *                  type: string
 *                  format: date
 *                  description: Data do pedido
 *               status:
 *                 type: string
 *                 enum: [pending, in_production, ready, delivered, cancelled]
 *                 default: pending
 *                 description: Status inicial do pedido
 *               laboratoryId:
 *                 type: string
 *                 description: ID do laboratório (se aplicável)
 *               prescriptionData:
 *                 type: object
 *                 properties:
 *                   doctorName:
 *                     type: string
 *                   clinicName:
 *                     type: string
 *                   appointmentDate:
 *                     type: string
 *                     format: date
 *                   leftEye:
 *                     type: object
 *                     properties:
 *                       sph:
 *                         type: number
 *                       cyl:
 *                         type: number
 *                       axis:
 *                         type: number
 *                       pd:
 *                         type: number
 *                   rightEye:
 *                     type: object
 *                     properties:
 *                       sph:
 *                         type: number
 *                       cyl:
 *                         type: number
 *                       axis:
 *                         type: number
 *                       pd:
 *                         type: number
 *                   nd:
 *                     type: number
 *                   oc:
 *                     type: number
 *                   addition:
 *                     type: number
 *               totalPrice:
 *                 type: number
 *                 description: Valor total do pedido
 *               discount:
 *                 type: number
 *                 description: Valor do desconto aplicado
 *               finalPrice:
 *                 type: number
 *                 description: Valor final (totalPrice - discount)
 *               observations:
 *                 type: string
 *                 description: Observações adicionais
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
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
  "/orders",
  authenticate,
  authorize(["admin", "employee"]),
  validateAndUpdateRelationships,
  asyncHandler(orderController.createOrder.bind(orderController))
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lista todos os pedidos
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Retorna uma lista paginada de todos os pedidos com opções de filtro
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
 *           enum: [pending, in_production, ready, delivered, cancelled]
 *         description: Filtrar por status do pedido
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *       - in: query
 *         name: laboratoryId
 *         schema:
 *           type: string
 *         description: Filtrar por laboratório
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
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
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
  "/orders",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(orderController.getAllOrders.bind(orderController))
);

/**
 * @swagger
 * /api/orders/deleted:
 *   get:
 *     summary: Lista pedidos excluídos logicamente
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Retorna uma lista paginada de pedidos marcados como excluídos
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
 *           enum: [pending, in_production, ready, delivered, cancelled]
 *         description: Filtrar por status
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *     responses:
 *       200:
 *         description: Lista de pedidos excluídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
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
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/deleted",
  authenticate,
  authorize(["admin"]),
  asyncHandler(orderController.getDeletedOrders.bind(orderController))
);

/**
 * @swagger
 * /api/orders/daily:
 *   get:
 *     summary: Retorna os pedidos do dia
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Busca todos os pedidos de uma data específica ou da data atual
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Data para consulta (default é a data atual)
 *     responses:
 *       200:
 *         description: Lista de pedidos do dia
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/daily",
  authenticate,
  
  authorize(["admin", "employee"]),
  asyncHandler(orderController.getDailyOrders.bind(orderController))
);

/**
 * @swagger
 * /api/orders/export:
 *   get:
 *     summary: Exporta pedidos filtrados
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Gera um arquivo de exportação dos pedidos com base nos filtros
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_production, ready, delivered, cancelled]
 *         description: Filtrar por status do pedido
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *       - in: query
 *         name: laboratoryId
 *         schema:
 *           type: string
 *         description: Filtrar por laboratório
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
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/export",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(orderController.exportOrders.bind(orderController))
);

/**
 * @swagger
 * /api/orders/export/daily:
 *   get:
 *     summary: Exporta o resumo diário dos pedidos
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Gera um arquivo com o resumo de todos os pedidos de um dia específico
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
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/export/daily",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(orderController.exportDailySummary.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtém um pedido pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Retorna os detalhes de um pedido específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalhes do pedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(orderController.getOrderById.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Atualiza o pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Permite que administradores e funcionários atualizem o pedido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *         example: "60d21b4667d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Pedido inválido ou transição não permitida
 *       404:
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/orders/:id",
  authenticate,
  authorize(["admin", "employee"]),
  validateAndUpdateRelationships,
  asyncHandler(orderController.updateOrder.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Atualiza o status de um pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Permite que administradores e funcionários atualizem o status de um pedido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *         example: "60d21b4667d0d8992e610c85"
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
 *                 enum: [pending, in_production, ready, delivered, cancelled]
 *                 description: Novo status do pedido
 *                 example: "ready"
 *     responses:
 *       200:
 *         description: Status do pedido atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Status inválido ou transição não permitida
 *       404:
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/orders/:id/status",
  authenticate,
  authorize(["admin", "employee"]),
  validateAndUpdateRelationships,
  asyncHandler(orderController.updateOrderStatus.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}/laboratory:
 *   put:
 *     summary: Atualiza o laboratório de um pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Permite que administradores e funcionários associem um laboratório a um pedido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *         example: "60d21b4667d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - laboratoryId
 *             properties:
 *               laboratoryId:
 *                 type: string
 *                 description: ID do laboratório
 *                 example: "60d21b4667d0d8992e610c86"
 *     responses:
 *       200:
 *         description: Laboratório do pedido atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pedido ou laboratório não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/orders/:id/laboratory",
  authenticate,
  authorize(["admin", "employee"]),
  validateAndUpdateRelationships,
  asyncHandler(orderController.updateOrderLaboratory.bind(orderController))
);

/**
 * @swagger
 * /api/orders/client/{clientId}:
 *   get:
 *     summary: Lista pedidos de um cliente específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Retorna todos os pedidos de um cliente específico
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *         example: "60d21b4667d0d8992e610c86"
 *     responses:
 *       200:
 *         description: Lista de pedidos do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       404:
 *         description: Nenhum pedido encontrado para o cliente
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/client/:clientId",
  authenticate,
  asyncHandler(orderController.getOrdersByClient.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancela um pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Permite cancelar um pedido que não esteja entregue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Pedido cancelado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Não é possível cancelar o pedido
 *       404:
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem permissão para cancelar o pedido
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/orders/:id/cancel",
  authenticate,
  validateAndUpdateRelationships,
  asyncHandler(orderController.cancelOrder.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}/delete:
 *   post:
 *     summary: Realiza exclusão lógica (soft delete) de um pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Marca um pedido como excluído sem removê-lo do banco de dados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Pedido excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Pedido não pode ser excluído
 *       404:
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/orders/:id/delete",
  authenticate,
  authorize(["admin", "employee"]),
  validateAndUpdateRelationships,
  asyncHandler(orderController.softDeleteOrder.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}/export:
 *   get:
 *     summary: Exporta os detalhes de um pedido específico
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Gera um arquivo com os detalhes completos de um pedido específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *         example: "60d21b4667d0d8992e610c85"
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf, csv]
 *           default: excel
 *         description: Formato de exportação
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
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/:id/export",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(orderController.exportOrderDetails.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}/payments:
 *   get:
 *     summary: Obtém os pagamentos associados a um pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Retorna todos os pagamentos associados a um pedido específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Lista de pagamentos do pedido
 *       404:
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/:id/payments",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(orderController.getOrderPayments.bind(orderController))
);

/**
 * @swagger
 * /api/orders/{id}/payment-status:
 *   get:
 *     summary: Obtém o resumo de pagamento de um pedido
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     description: Retorna um resumo do status de pagamento de um pedido específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Resumo do status de pagamento
 *       404:
 *         description: Pedido não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/orders/:id/payment-status",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(orderController.getPaymentStatusSummary.bind(orderController))
);

export default router;
