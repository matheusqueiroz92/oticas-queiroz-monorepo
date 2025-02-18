import express from "express";
import { LaboratoryController } from "../controllers/LaboratoryController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const laboratoryController = new LaboratoryController();

/**
 * @swagger
 * /api/laboratories:
 *   post:
 *     summary: Cria um novo laboratório
 *     security:
 *       - bearerAuth: []
 *     tags: [Laboratories]
 *     description: Apenas administradores podem criar laboratórios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
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
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               contactName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Laboratório criado com sucesso
 */
router.post(
  "/laboratories",
  authenticate,
  authorize(["admin"]),
  asyncHandler(laboratoryController.createLaboratory.bind(laboratoryController))
);

/**
 * @swagger
 * /api/laboratories:
 *   get:
 *     summary: Lista todos os laboratórios
 *     security:
 *       - bearerAuth: []
 *     tags: [Laboratories]
 *     description: Administradores e funcionários podem ver todos os laboratórios
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de itens por página
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por laboratórios ativos/inativos
 *     responses:
 *       200:
 *         description: Lista de laboratórios
 */
router.get(
  "/laboratories",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    laboratoryController.getAllLaboratories.bind(laboratoryController)
  )
);

/**
 * @swagger
 * /api/laboratories/{id}:
 *   get:
 *     summary: Obtém um laboratório pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Laboratories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Laboratório encontrado
 */
router.get(
  "/laboratories/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(
    laboratoryController.getLaboratoryById.bind(laboratoryController)
  )
);

/**
 * @swagger
 * /api/laboratories/{id}:
 *   put:
 *     summary: Atualiza um laboratório
 *     security:
 *       - bearerAuth: []
 *     tags: [Laboratories]
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
 *     responses:
 *       200:
 *         description: Laboratório atualizado
 */
router.put(
  "/laboratories/:id",
  authenticate,
  authorize(["admin"]),
  asyncHandler(laboratoryController.updateLaboratory.bind(laboratoryController))
);

/**
 * @swagger
 * /api/laboratories/{id}:
 *   delete:
 *     summary: Remove um laboratório
 *     security:
 *       - bearerAuth: []
 *     tags: [Laboratories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Laboratório removido
 */
router.delete(
  "/laboratories/:id",
  authenticate,
  authorize(["admin"]),
  asyncHandler(laboratoryController.deleteLaboratory.bind(laboratoryController))
);

/**
 * @swagger
 * /api/laboratories/{id}/toggle-status:
 *   patch:
 *     summary: Altera o status de um laboratório (ativo/inativo)
 *     security:
 *       - bearerAuth: []
 *     tags: [Laboratories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status do laboratório alterado
 */
router.patch(
  "/laboratories/:id/toggle-status",
  authenticate,
  authorize(["admin"]),
  asyncHandler(
    laboratoryController.toggleLaboratoryStatus.bind(laboratoryController)
  )
);

export default router;
