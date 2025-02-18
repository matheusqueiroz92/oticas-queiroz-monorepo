import express from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token JWT gerado com sucesso
 */
router.post("/login", asyncHandler(authController.login.bind(authController)));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registro de novo usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Apenas administradores podem criar novos usuários
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
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, employee, customer]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso proibido
 */
router.post(
  "/register",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(authController.register.bind(authController))
);

export default router;
