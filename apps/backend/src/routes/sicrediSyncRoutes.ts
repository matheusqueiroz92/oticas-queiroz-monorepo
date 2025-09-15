import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { SicrediSyncController } from '../controllers/SicrediSyncController';
import { PaymentService } from '../services/PaymentService';
import { UserService } from '../services/UserService';
import { LegacyClientService } from '../services/LegacyClientService';
import { OrderService } from '../services/OrderService';

const router = Router();

// Inicializar serviços (eles usam RepositoryFactory internamente)
const paymentService = new PaymentService();
const userService = new UserService();
const legacyClientService = new LegacyClientService();
const orderService = new OrderService();

// Inicializar controlador
const sicrediSyncController = new SicrediSyncController(
  paymentService,
  userService,
  legacyClientService,
  orderService
);

/**
 * @swagger
 * tags:
 *   name: SICREDI Sync
 *   description: Endpoints para sincronização automática com a API da SICREDI
 */

/**
 * @swagger
 * /api/sicredi-sync/start:
 *   post:
 *     summary: Inicia sincronização automática com SICREDI
 *     description: Inicia o processo de sincronização automática que verifica periodicamente o status dos boletos SICREDI e atualiza os débitos dos clientes
 *     tags: [SICREDI Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               intervalMinutes:
 *                 type: number
 *                 minimum: 5
 *                 maximum: 1440
 *                 default: 30
 *                 description: Intervalo em minutos para sincronização (mínimo 5, máximo 1440)
 *     responses:
 *       200:
 *         description: Sincronização iniciada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sincronização automática iniciada a cada 30 minutos"
 *                 intervalMinutes:
 *                   type: number
 *                   example: 30
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - apenas administradores podem gerenciar sincronização
 */
router.post('/start', 
  authenticate, 
  authorize(['admin']), 
  sicrediSyncController.startAutoSync
);

/**
 * @swagger
 * /api/sicredi-sync/stop:
 *   post:
 *     summary: Para sincronização automática com SICREDI
 *     description: Para o processo de sincronização automática
 *     tags: [SICREDI Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sincronização parada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sincronização automática parada"
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - apenas administradores podem gerenciar sincronização
 */
router.post('/stop', 
  authenticate, 
  authorize(['admin']), 
  sicrediSyncController.stopAutoSync
);

/**
 * @swagger
 * /api/sicredi-sync/status:
 *   get:
 *     summary: Obtém status da sincronização
 *     description: Retorna informações sobre o status atual da sincronização e estatísticas dos pagamentos SICREDI
 *     tags: [SICREDI Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status da sincronização
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRunning:
 *                       type: boolean
 *                       description: Indica se a sincronização automática está ativa
 *                       example: true
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalSicrediPayments:
 *                           type: number
 *                           description: Total de pagamentos SICREDI no sistema
 *                           example: 150
 *                         pendingPayments:
 *                           type: number
 *                           description: Pagamentos pendentes de sincronização
 *                           example: 25
 *                         paidPayments:
 *                           type: number
 *                           description: Pagamentos já pagos
 *                           example: 100
 *                         overduePayments:
 *                           type: number
 *                           description: Pagamentos vencidos
 *                           example: 15
 *                         cancelledPayments:
 *                           type: number
 *                           description: Pagamentos cancelados
 *                           example: 10
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/status', 
  authenticate, 
  authorize(['admin', 'employee']), 
  sicrediSyncController.getSyncStatus
);

/**
 * @swagger
 * /api/sicredi-sync/perform:
 *   post:
 *     summary: Executa sincronização manual
 *     description: Executa uma sincronização manual imediata de todos os pagamentos SICREDI pendentes
 *     tags: [SICREDI Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sincronização executada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: number
 *                       description: Total de pagamentos processados
 *                       example: 25
 *                     updatedPayments:
 *                       type: number
 *                       description: Pagamentos com status atualizado
 *                       example: 5
 *                     updatedDebts:
 *                       type: number
 *                       description: Débitos de clientes atualizados
 *                       example: 3
 *                     errors:
 *                       type: array
 *                       description: Lista de erros encontrados durante a sincronização
 *                       items:
 *                         type: object
 *                         properties:
 *                           paymentId:
 *                             type: string
 *                             description: ID do pagamento com erro
 *                           error:
 *                             type: string
 *                             description: Descrição do erro
 *                     summary:
 *                       type: object
 *                       properties:
 *                         paid:
 *                           type: number
 *                           description: Pagamentos pagos
 *                           example: 2
 *                         overdue:
 *                           type: number
 *                           description: Pagamentos vencidos
 *                           example: 1
 *                         cancelled:
 *                           type: number
 *                           description: Pagamentos cancelados
 *                           example: 0
 *                         pending:
 *                           type: number
 *                           description: Pagamentos pendentes
 *                           example: 2
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/perform', 
  authenticate, 
  authorize(['admin', 'employee']), 
  sicrediSyncController.performSync
);

/**
 * @swagger
 * /api/sicredi-sync/client/{clientId}:
 *   post:
 *     summary: Sincroniza pagamentos de um cliente específico
 *     description: Executa sincronização manual apenas para os pagamentos SICREDI de um cliente específico
 *     tags: [SICREDI Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Sincronização do cliente executada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: number
 *                       description: Total de pagamentos do cliente processados
 *                       example: 3
 *                     updatedPayments:
 *                       type: number
 *                       description: Pagamentos do cliente com status atualizado
 *                       example: 1
 *                     updatedDebts:
 *                       type: number
 *                       description: Débito do cliente atualizado
 *                       example: 1
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           paymentId:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         paid:
 *                           type: number
 *                           example: 1
 *                         overdue:
 *                           type: number
 *                           example: 0
 *                         cancelled:
 *                           type: number
 *                           example: 0
 *                         pending:
 *                           type: number
 *                           example: 2
 *       400:
 *         description: ID do cliente inválido
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/client/:clientId', 
  authenticate, 
  authorize(['admin', 'employee']), 
  sicrediSyncController.syncClient
);

/**
 * @swagger
 * /api/sicredi-sync/logs:
 *   get:
 *     summary: Obtém logs da sincronização
 *     description: Retorna os logs mais recentes da sincronização (implementação futura)
 *     tags: [SICREDI Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs da sincronização
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       description: Lista de logs da sincronização
 *                       items:
 *                         type: string
 *                         example: "2024-01-15 10:30:00 - Sincronização iniciada"
 *                     totalLines:
 *                       type: number
 *                       description: Total de linhas de log
 *                       example: 100
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/logs', 
  authenticate, 
  authorize(['admin']), 
  sicrediSyncController.getSyncLogs
);

export default router;
