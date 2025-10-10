import express from "express";
import { LaboratoryController } from "../controllers/LaboratoryController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const laboratoryController = new LaboratoryController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Laboratory:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - phone
 *         - email
 *         - contactName
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do laboratório
 *         name:
 *           type: string
 *           description: Nome do laboratório
 *         address:
 *           type: object
 *           required:
 *             - street
 *             - number
 *             - neighborhood
 *             - city
 *             - state
 *             - zipCode
 *           properties:
 *             street:
 *               type: string
 *               description: Nome da rua
 *             number:
 *               type: string
 *               description: Número do endereço
 *             complement:
 *               type: string
 *               description: Complemento (opcional)
 *             neighborhood:
 *               type: string
 *               description: Bairro
 *             city:
 *               type: string
 *               description: Cidade
 *             state:
 *               type: string
 *               description: Estado (UF)
 *             zipCode:
 *               type: string
 *               description: CEP
 *         phone:
 *           type: string
 *           description: Telefone de contato
 *         email:
 *           type: string
 *           description: Email de contato
 *         contactName:
 *           type: string
 *           description: Nome da pessoa de contato
 *         isActive:
 *           type: boolean
 *           description: Status de atividade do laboratório
 *           default: true
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
 * /api/laboratories:
 *   post:
 *     summary: Cria um novo laboratório
 *     security:
 *       - bearerAuth: []
 *     tags: [Laboratories]
 *     description: Permite que administradores criem novos laboratórios parceiros
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - phone
 *               - email
 *               - contactName
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do laboratório
 *                 example: "Laboratório Óptico Precision"
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - number
 *                   - neighborhood
 *                   - city
 *                   - state
 *                   - zipCode
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "Av. São João"
 *                   number:
 *                     type: string
 *                     example: "1500"
 *                   complement:
 *                     type: string
 *                     example: "Sala 302"
 *                   neighborhood:
 *                     type: string
 *                     example: "Centro"
 *                   city:
 *                     type: string
 *                     example: "São Paulo"
 *                   state:
 *                     type: string
 *                     example: "SP"
 *                   zipCode:
 *                     type: string
 *                     example: "01035-000"
 *               phone:
 *                 type: string
 *                 description: Telefone de contato
 *                 example: "(11) 3333-4444"
 *               email:
 *                 type: string
 *                 description: Email de contato
 *                 example: "contato@labprecision.com.br"
 *               contactName:
 *                 type: string
 *                 description: Nome da pessoa de contato
 *                 example: "Carlos Oliveira"
 *     responses:
 *       201:
 *         description: Laboratório criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Laboratory'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/",
  authenticate,
  authorize(["admin", "employee"]),
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
 *     description: Retorna uma lista paginada de todos os laboratórios com opções de filtro
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por laboratórios ativos/inativos
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca para nome ou cidade
 *     responses:
 *       200:
 *         description: Lista de laboratórios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 laboratories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Laboratory'
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
  "/",
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
 *     description: Retorna os detalhes de um laboratório específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laboratório
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalhes do laboratório
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Laboratory'
 *       404:
 *         description: Laboratório não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador ou funcionário.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/:id",
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
 *     description: Permite que administradores atualizem os dados de um laboratório
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laboratório
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
 *                 description: Nome do laboratório
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
 *                 description: Telefone de contato
 *               email:
 *                 type: string
 *                 description: Email de contato
 *               contactName:
 *                 type: string
 *                 description: Nome da pessoa de contato
 *     responses:
 *       200:
 *         description: Laboratório atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Laboratory'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Laboratório não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/:id",
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
 *     description: Permite que administradores removam um laboratório do sistema
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laboratório
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       204:
 *         description: Laboratório removido com sucesso
 *       404:
 *         description: Laboratório não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 *       500:
 *         description: Erro interno do servidor
 */
router.delete(
  "/:id",
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
 *     description: Permite que administradores ativem ou desativem um laboratório
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laboratório
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Status do laboratório alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Laboratory'
 *       404:
 *         description: Laboratório não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado. Requer permissão de administrador.
 *       500:
 *         description: Erro interno do servidor
 */
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize(["admin"]),
  asyncHandler(
    laboratoryController.toggleLaboratoryStatus.bind(laboratoryController)
  )
);

export default router;
