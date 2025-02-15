import express from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

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
router.post("/login", (req, res) => authController.login(req, res));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registro de usuário
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
 */
router.post(
  "/register",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => authController.register(req, res)
);

export default router;
