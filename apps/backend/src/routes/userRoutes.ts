import express from "express";
import { UserController } from "../controllers/UserController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = express.Router();
const userController = new UserController();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Cria um novo usuário
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
  "/users",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => userController.createUser(req, res)
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lista todos os usuários
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Apenas administradores podem ver todos os usuários
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso proibido
 */
router.get("/users", authenticate, authorize(["admin"]), (req, res) =>
  userController.getAllUsers(req, res)
);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtém o perfil do usuário logado
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Usuários podem ver seu próprio perfil
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *       401:
 *         description: Não autorizado
 */
router.get("/users/profile", authenticate, (req, res) =>
  userController.getProfile(req, res)
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Atualiza o perfil do usuário logado
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Usuários podem atualizar seu próprio perfil
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
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       401:
 *         description: Não autorizado
 */
router.put("/users/profile", authenticate, (req, res) =>
  userController.updateProfile(req, res)
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtém um usuário pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Admins e funcionários podem ver detalhes dos usuários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso proibido
 *       404:
 *         description: Usuário não encontrado
 */
router.get(
  "/users/:id",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => userController.getUserById(req, res)
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Apenas admins podem atualizar usuários. Clientes podem atualizar apenas seus próprios dados.
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso proibido
 *       404:
 *         description: Usuário não encontrado
 */
router.put(
  "/users/:id",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => userController.updateUser(req, res)
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Remove um usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     description: Apenas administradores podem remover usuários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Usuário removido
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso proibido
 *       404:
 *         description: Usuário não encontrado
 */
router.delete("/users/:id", authenticate, authorize(["admin"]), (req, res) =>
  userController.deleteUser(req, res)
);

export default router;
