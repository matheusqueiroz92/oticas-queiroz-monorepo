import express from "express";
import { UserController } from "../controllers/UserController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import upload from "../config/multerConfig";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const userController = new UserController();

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
 *           description: CPF do usuário (obrigatório para clientes, funcionários e admin)
 *         cnpj:
 *           type: string
 *           description: CNPJ da instituição (obrigatório para instituições)
 *         password:
 *           type: string
 *           description: Senha do usuário (armazenada com hash)
 *         image:
 *           type: string
 *           description: URL da imagem de perfil do usuário
 *         role:
 *           type: string
 *           enum: [admin, employee, customer, institution]
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
 * /api/users:
 *   get:
 *     summary: Lista todos os usuários
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Retorna uma lista paginada de todos os usuários com opções de filtro
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, employee, customer]
 *         description: Filtrar por função do usuário
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca para nome, email ou CPF
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
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
  "/users",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler((req, res) => userController.getAllUsers(req, res))
);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtém o perfil do usuário logado
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Retorna os detalhes do perfil do usuário atualmente autenticado
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/users/profile",
  authenticate,
  asyncHandler((req, res) => userController.getProfile(req, res))
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Atualiza o perfil do usuário logado
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Permite que um usuário atualize seu próprio perfil
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do usuário
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *                 example: "joao.silva@exemplo.com"
 *               phone:
 *                 type: string
 *                 description: Telefone do usuário
 *                 example: "(11) 98765-4321"
 *               address:
 *                 type: string
 *                 description: Endereço do usuário
 *                 example: "Rua Exemplo, 123 - São Paulo"
 *               password:
 *                 type: string
 *                 description: Nova senha (opcional)
 *                 example: "senha123"
 *               userImage:
 *                 type: string
 *                 format: binary
 *                 description: Nova imagem de perfil (opcional)
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/users/profile",
  authenticate,
  upload.single("userImage"),
  asyncHandler((req, res) => userController.updateProfile(req, res))
);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Altera a senha do usuário logado
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Permite que um usuário altere sua própria senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Senha atual
 *                 example: "senha123"
 *               newPassword:
 *                 type: string
 *                 description: Nova senha
 *                 example: "novaSenha456"
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Senha alterada com sucesso"
 *       400:
 *         description: Dados inválidos ou senha atual incorreta
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/users/change-password",
  authenticate,
  asyncHandler((req, res) => userController.changePassword(req, res))
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtém um usuário pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Retorna os detalhes de um usuário específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalhes do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/users/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler((req, res) => userController.getUserById(req, res))
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Permite que administradores e funcionários atualizem dados de um usuário
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *         example: "60d21b4667d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do usuário
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               cpf:
 *                 type: string
 *                 description: CPF do usuário
 *               role:
 *                 type: string
 *                 enum: [admin, employee, customer]
 *                 description: Função do usuário
 *               phone:
 *                 type: string
 *                 description: Telefone do usuário
 *               address:
 *                 type: string
 *                 description: Endereço do usuário
 *               password:
 *                 type: string
 *                 description: Nova senha (opcional)
 *               userImage:
 *                 type: string
 *                 format: binary
 *                 description: Nova imagem de perfil (opcional)
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/users/:id",
  authenticate,
  upload.single("userImage"),
  authorize(["admin", "employee"]),
  asyncHandler((req, res) => userController.updateUser(req, res))
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Remove um usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Permite que administradores removam um usuário do sistema
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       204:
 *         description: Usuário removido com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 *       500:
 *         description: Erro interno do servidor
 */
router.delete(
  "/users/:id",
  authenticate,
  authorize(["admin"]),
  asyncHandler((req, res) => userController.deleteUser(req, res))
);

export default router;
