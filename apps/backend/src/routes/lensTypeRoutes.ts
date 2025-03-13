import express from "express";
import { LensTypeController } from "../controllers/LensTypeController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const lensTypeController = new LensTypeController();

/**
 * @swagger
 * components:
 *   schemas:
 *     LensType:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - brand
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do tipo de lente
 *         name:
 *           type: string
 *           description: Nome do tipo de lente
 *         description:
 *           type: string
 *           description: Descrição detalhada do tipo de lente
 *         brand:
 *           type: string
 *           description: Marca da lente
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
 * /api/lens-type:
 *   post:
 *     summary: Cria um novo tipo de lente
 *     security:
 *       - bearerAuth: []
 *     tags: [Lens Types]
 *     description: Permite que administradores e funcionários criem novos tipos de lente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - brand
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do tipo de lente
 *                 example: "Multifocal Premium"
 *               description:
 *                 type: string
 *                 description: Descrição detalhada do tipo de lente
 *                 example: "Lente multifocal de alta qualidade com transição"
 *               brand:
 *                 type: string
 *                 description: Marca da lente
 *                 example: "Zeiss"
 *     responses:
 *       201:
 *         description: Tipo de lente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LensType'
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
  "/lens-type",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(lensTypeController.createLensType.bind(lensTypeController))
);

/**
 * @swagger
 * /api/lens-type:
 *   get:
 *     summary: Lista todos os tipos de lente
 *     security:
 *       - bearerAuth: []
 *     tags: [Lens Types]
 *     description: Retorna uma lista de todos os tipos de lente disponíveis
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtrar por marca
 *     responses:
 *       200:
 *         description: Lista de tipos de lente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LensType'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/lens-type",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(lensTypeController.getAllLensType.bind(lensTypeController))
);

/**
 * @swagger
 * /api/lens-type/{id}:
 *   get:
 *     summary: Obtém um tipo de lente pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Lens Types]
 *     description: Retorna os detalhes de um tipo de lente específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de lente
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalhes do tipo de lente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LensType'
 *       404:
 *         description: Tipo de lente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/lens-type/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(lensTypeController.getLensTypeById.bind(lensTypeController))
);

/**
 * @swagger
 * /api/lens-type/{id}:
 *   put:
 *     summary: Atualiza um tipo de lente
 *     security:
 *       - bearerAuth: []
 *     tags: [Lens Types]
 *     description: Permite que administradores e funcionários atualizem um tipo de lente existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de lente
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
 *                 example: "Multifocal Ultra Premium"
 *               description:
 *                 type: string
 *                 example: "Lente multifocal de alta qualidade com transição e proteção UV avançada"
 *               brand:
 *                 type: string
 *                 example: "Zeiss"
 *     responses:
 *       200:
 *         description: Tipo de lente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LensType'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Tipo de lente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/lens-type/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(lensTypeController.updateLensType.bind(lensTypeController))
);

/**
 * @swagger
 * /api/lens-type/{id}:
 *   delete:
 *     summary: Remove um tipo de lente
 *     security:
 *       - bearerAuth: []
 *     tags: [Lens Types]
 *     description: Permite que administradores e funcionários removam um tipo de lente existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do tipo de lente
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       204:
 *         description: Tipo de lente removido com sucesso
 *       404:
 *         description: Tipo de lente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.delete(
  "/lens-type/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(lensTypeController.deleteLensType.bind(lensTypeController))
);

export default router;
