import express from "express";
import { LensTypeController } from "../controllers/LensTypeController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = express.Router();
const lensTypeController = new LensTypeController();

/**
 * @swagger
 * /api/lens-type:
 *   post:
 *     summary: Cria um novo tipo de lente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *     responses:
 *       201:
 *         description: Tipo de lente criado com sucesso
 */
router.post(
  "/lens-type",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => lensTypeController.createLensType(req, res)
);

/**
 * @swagger
 * /api/lens-type:
 *   get:
 *     summary: Obtém todos os tipos de lente
 *     responses:
 *       200:
 *         description: Tipos de lente encontrados
 *       404:
 *         description: Nenhum tipo de lente encontrado
 */
router.get(
  "/lens-type",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => lensTypeController.getAllLensType(req, res)
);

/**
 * @swagger
 * /api/lens-type/{id}:
 *   get:
 *     summary: Obtém um tipo de lente pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tipo de lente encontrado
 *       404:
 *         description: Tipo de lente não encontrado
 */
router.get(
  "/lens-type/:id",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => lensTypeController.getLensTypeById(req, res)
);

/**
 * @swagger
 * /api/lens-type/{id}:
 *   put:
 *     summary: Atualiza o tipo de lente pelo ID
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
 *         description: Tipo de lente atualizado com sucesso
 *       404:
 *         description: Tipo de lente não encontrado
 */
router.put(
  "/lens-type/:id",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => lensTypeController.updateLensType(req, res)
);

/**
 * @swagger
 * /api/lens-type/{id}:
 *   delete:
 *     summary: Remove um tipo de lente pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Tipo de lente removido com sucesso
 *       404:
 *         description: Tipo de lente não encontrado
 */
router.delete(
  "/lens-type/:id",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => lensTypeController.deleteLensType(req, res)
);

export default router;
