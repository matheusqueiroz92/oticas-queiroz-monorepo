import express from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadUserImage } from "../config/multerConfig";
import { PasswordResetController } from "../controllers/PasswordResetController";

const router = express.Router();
const authController = new AuthController();
const passwordResetController = new PasswordResetController();

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
  uploadUserImage,
  asyncHandler(authController.register.bind(authController))
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicita redefinição de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instruções enviadas por email
 */
router.post(
  "/forgot-password",
  asyncHandler(
    passwordResetController.requestReset.bind(passwordResetController)
  )
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Redefine a senha usando token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.post(
  "/reset-password",
  asyncHandler(
    passwordResetController.resetPassword.bind(passwordResetController)
  )
);

/**
 * @swagger
 * /api/auth/validate-reset-token/{token}:
 *   get:
 *     summary: Valida se um token de redefinição é válido
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token válido
 *       400:
 *         description: Token inválido ou expirado
 */
router.get(
  "/validate-reset-token/:token",
  asyncHandler(
    passwordResetController.validateToken.bind(passwordResetController)
  )
);

export default router;
