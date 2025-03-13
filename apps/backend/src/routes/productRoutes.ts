import express from "express";
import { ProductController } from "../controllers/ProductController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { uploadProductImage } from "../config/multerConfig";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const productController = new ProductController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - productType
 *         - category
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do produto
 *         name:
 *           type: string
 *           description: Nome do produto
 *         productType:
 *           type: string
 *           description: Tipo do produto
 *         category:
 *           type: string
 *           description: Categoria do produto
 *         description:
 *           type: string
 *           description: Descrição detalhada do produto
 *         brand:
 *           type: string
 *           description: Marca do produto
 *         image:
 *           type: string
 *           description: URL da imagem do produto
 *         modelGlasses:
 *           type: string
 *           description: Modelo dos óculos (se aplicável)
 *         price:
 *           type: number
 *           description: Preço do produto
 *         stock:
 *           type: number
 *           description: Quantidade em estoque
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
 * /api/products:
 *   post:
 *     summary: Cria um novo produto
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     description: Permite que administradores e funcionários criem novos produtos
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - productType
 *               - category
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do produto
 *                 example: "Óculos Ray-Ban Aviador"
 *               productType:
 *                 type: string
 *                 description: Tipo do produto
 *                 example: "glasses"
 *               category:
 *                 type: string
 *                 description: Categoria do produto
 *                 example: "sunglasses"
 *               description:
 *                 type: string
 *                 description: Descrição detalhada do produto
 *                 example: "Modelo clássico aviador com lentes polarizadas"
 *               brand:
 *                 type: string
 *                 description: Marca do produto
 *                 example: "Ray-Ban"
 *               modelGlasses:
 *                 type: string
 *                 description: Modelo dos óculos
 *                 example: "Aviador"
 *               price:
 *                 type: number
 *                 description: Preço do produto
 *                 example: 499.90
 *               stock:
 *                 type: number
 *                 description: Quantidade em estoque
 *                 example: 15
 *               productImage:
 *                 type: string
 *                 format: binary
 *                 description: Imagem do produto
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
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
  "/products",
  authenticate,
  authorize(["admin", "employee"]),
  uploadProductImage,
  asyncHandler(productController.createProduct.bind(productController))
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lista todos os produtos
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     description: Retorna uma lista paginada de todos os produtos com opções de filtro
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtrar por marca
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de produto
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Preço máximo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca para nome ou descrição
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
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
  "/products",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(productController.getAllProducts.bind(productController))
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtém um produto pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     description: Retorna os detalhes de um produto específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalhes do produto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/products/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(productController.getProductById.bind(productController))
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Atualiza um produto
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     description: Permite que administradores e funcionários atualizem um produto existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
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
 *                 description: Nome do produto
 *               productType:
 *                 type: string
 *                 description: Tipo do produto
 *               category:
 *                 type: string
 *                 description: Categoria do produto
 *               description:
 *                 type: string
 *                 description: Descrição detalhada do produto
 *               brand:
 *                 type: string
 *                 description: Marca do produto
 *               modelGlasses:
 *                 type: string
 *                 description: Modelo dos óculos
 *               price:
 *                 type: number
 *                 description: Preço do produto
 *               stock:
 *                 type: number
 *                 description: Quantidade em estoque
 *               productImage:
 *                 type: string
 *                 format: binary
 *                 description: Nova imagem do produto (opcional)
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/products/:id",
  authenticate,
  authorize(["admin", "employee"]),
  uploadProductImage,
  asyncHandler(productController.updateProduct.bind(productController))
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Remove um produto
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     description: Permite que administradores e funcionários removam um produto existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       204:
 *         description: Produto removido com sucesso
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.delete(
  "/products/:id",
  authenticate,
  authorize(["admin", "employee"]),
  asyncHandler(productController.deleteProduct.bind(productController))
);

export default router;
