import express from "express";
import { ProductController } from "../controllers/ProductController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import upload from "../config/multerConfig";

const router = express.Router();
const productController = new ProductController();

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Cria um novo produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 */
router.post(
  "/products",
  authenticate,
  authorize(["admin", "employee"]),
  upload.single("productImage"), // Middleware para upload de imagem
  (req, res) => productController.createProduct(req, res)
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtém um produto pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get(
  "/products/:id",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => productController.getProductById(req, res)
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtém todos os produtos
 *     responses:
 *       200:
 *         description: Produtos encontrados
 *       404:
 *         description: Nenhum produto encontrado
 */
router.get(
  "/products",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => productController.getAllProducts(req, res)
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Atualiza um produto pelo ID
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.put(
  "/products/:id",
  authenticate,
  authorize(["admin", "employee"]),
  upload.single("productImage"),
  (req, res) => productController.updateProduct(req, res)
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Remove um produto pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Produto removido com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.delete(
  "/products/:id",
  authenticate,
  authorize(["admin", "employee"]),
  (req, res) => productController.deleteProduct(req, res)
);

export default router;
