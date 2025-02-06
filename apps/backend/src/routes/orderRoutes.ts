import express from "express";
import { OrderController } from "../controllers/OrderController";

const router = express.Router();
const orderController = new OrderController();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Cria um novo pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               totalPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 */
router.post("/orders", (req, res) => orderController.createOrder(req, res));

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtém um pedido pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         description: Pedido não encontrado
 */
router.get("/orders/:id", (req, res) => orderController.getOrderById(req, res));

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Atualiza o status de um pedido
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
 *               status:
 *                 type: string
 *                 enum: [pending, in_production, ready, delivered]
 *     responses:
 *       200:
 *         description: Status do pedido atualizado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
router.put("/orders/:id/status", (req, res) =>
  orderController.updateOrderStatus(req, res)
);

export default router;
