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
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do usuário
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           description: Email do usuário (utilizado para login)
 *         cpf:
 *           type: string
 *           description: CPF do usuário (pode ser utilizado para login)
 *         password:
 *           type: string
 *           description: Senha do usuário (armazenada com hash)
 *         image:
 *           type: string
 *           description: URL da imagem de perfil do usuário
 *         role:
 *           type: string
 *           enum: [admin, employee, customer]
 *           description: Função do usuário no sistema
 *         address:
 *           type: string
 *           description: Endereço do usuário
 *         phone:
 *           type: string
 *           description: Telefone do usuário
 *         sales:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs das vendas feitas pelo usuário (se funcionário)
 *         purchases:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs das compras feitas pelo usuário (se cliente)
 *         debts:
 *           type: number
 *           description: Valor total de dívidas do cliente
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
 * /api/auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Auth]
 *     description: Permite login com email/cpf e senha, retornando um token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Email ou CPF do usuário
 *                 example: "usuario@exemplo.com"
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     cpf:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, employee, customer]
 *       400:
 *         description: Dados de login inválidos
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/login", asyncHandler(authController.login.bind(authController)));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Permite que administradores e funcionários criem novos usuários
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - cpf
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do usuário
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *                 example: "joao.silva@exemplo.com"
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "senha123"
 *               cpf:
 *                 type: string
 *                 description: CPF do usuário
 *                 example: "12345678900"
 *               role:
 *                 type: string
 *                 enum: [admin, employee, customer]
 *                 description: Função do usuário no sistema
 *                 example: "customer"
 *               phone:
 *                 type: string
 *                 description: Telefone do usuário
 *                 example: "(11) 98765-4321"
 *               address:
 *                 type: string
 *                 description: Endereço do usuário
 *                 example: "Rua Exemplo, 123 - São Paulo"
 *               userImage:
 *                 type: string
 *                 format: binary
 *                 description: Imagem de perfil do usuário
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos ou usuário já existe
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
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
 *     description: Envia um email com instruções para redefinição de senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email cadastrado do usuário
 *                 example: "usuario@exemplo.com"
 *     responses:
 *       200:
 *         description: Instruções enviadas por email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso (mesmo se o email não existir, por segurança)
 *       500:
 *         description: Erro interno do servidor
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
 *     description: Permite redefinir a senha usando um token válido recebido por email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token recebido por email
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               password:
 *                 type: string
 *                 description: Nova senha do usuário
 *                 example: "novaSenha123"
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmação de redefinição
 *       400:
 *         description: Token inválido ou expirado
 *       500:
 *         description: Erro interno do servidor
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
 *     description: Verifica se o token é válido e não expirou
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token recebido por email
 *         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Status de validação do token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   description: Indica se o token é válido e não expirou
 *       400:
 *         description: Token inválido ou expirado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/validate-reset-token/:token",
  asyncHandler(
    passwordResetController.validateToken.bind(passwordResetController)
  )
);

export default router;
