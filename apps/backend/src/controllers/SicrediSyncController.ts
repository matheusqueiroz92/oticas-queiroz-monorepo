import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { SicrediSyncService, SicrediSyncError } from '../services/SicrediSyncService';
import { PaymentService } from '../services/PaymentService';
import { UserService } from '../services/UserService';
import { LegacyClientService } from '../services/LegacyClientService';
import { OrderService } from '../services/OrderService';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
    name: string;
  };
}

// Schemas de validação
const startSyncSchema = z.object({
  intervalMinutes: z.number().min(5).max(1440).optional().default(30), // 5 min a 24h
});

const syncClientSchema = z.object({
  clientId: z.string().min(1, "ID do cliente é obrigatório"),
});

export class SicrediSyncController {
  private sicrediSyncService: SicrediSyncService;

  constructor(
    paymentService: PaymentService,
    userService: UserService,
    legacyClientService: LegacyClientService,
    orderService: OrderService
  ) {
    this.sicrediSyncService = new SicrediSyncService(
      paymentService,
      userService,
      legacyClientService,
      orderService
    );
  }

  /**
   * @swagger
   * /api/sicredi-sync/start:
   *   post:
   *     summary: Inicia sincronização automática com SICREDI
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
   *                 description: Intervalo em minutos para sincronização
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
   *                 message:
   *                   type: string
   *                 intervalMinutes:
   *                   type: number
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Acesso negado
   */
  startAutoSync = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validatedData = startSyncSchema.parse(req.body);
    
    this.sicrediSyncService.startAutoSync(validatedData.intervalMinutes);
    
    res.status(200).json({
      success: true,
      message: `Sincronização automática iniciada a cada ${validatedData.intervalMinutes} minutos`,
      intervalMinutes: validatedData.intervalMinutes
    });
  });

  /**
   * @swagger
   * /api/sicredi-sync/stop:
   *   post:
   *     summary: Para sincronização automática com SICREDI
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
   *                 message:
   *                   type: string
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Acesso negado
   */
  stopAutoSync = asyncHandler(async (req: AuthRequest, res: Response) => {
    this.sicrediSyncService.stopAutoSync();
    
    res.status(200).json({
      success: true,
      message: "Sincronização automática parada"
    });
  });

  /**
   * @swagger
   * /api/sicredi-sync/status:
   *   get:
   *     summary: Obtém status da sincronização
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
   *                 data:
   *                   type: object
   *                   properties:
   *                     isRunning:
   *                       type: boolean
   *                     stats:
   *                       type: object
   *                       properties:
   *                         totalSicrediPayments:
   *                           type: number
   *                         pendingPayments:
   *                           type: number
   *                         paidPayments:
   *                           type: number
   *                         overduePayments:
   *                           type: number
   *                         cancelledPayments:
   *                           type: number
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Acesso negado
   */
  getSyncStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const isRunning = this.sicrediSyncService.isSyncRunning();
    const stats = await this.sicrediSyncService.getSyncStats();
    
    res.status(200).json({
      success: true,
      data: {
        isRunning,
        stats
      }
    });
  });

  /**
   * @swagger
   * /api/sicredi-sync/perform:
   *   post:
   *     summary: Executa sincronização manual
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
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalProcessed:
   *                       type: number
   *                     updatedPayments:
   *                       type: number
   *                     updatedDebts:
   *                       type: number
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
   *                         overdue:
   *                           type: number
   *                         cancelled:
   *                           type: number
   *                         pending:
   *                           type: number
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Acesso negado
   *       500:
   *         description: Erro interno do servidor
   */
  performSync = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.sicrediSyncService.performSync();
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * @swagger
   * /api/sicredi-sync/client/{clientId}:
   *   post:
   *     summary: Sincroniza pagamentos de um cliente específico
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
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalProcessed:
   *                       type: number
   *                     updatedPayments:
   *                       type: number
   *                     updatedDebts:
   *                       type: number
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
   *                         overdue:
   *                           type: number
   *                         cancelled:
   *                           type: number
   *                         pending:
   *                           type: number
   *       400:
   *         description: ID do cliente inválido
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Acesso negado
   *       500:
   *         description: Erro interno do servidor
   */
  syncClient = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { clientId } = req.params;
    
    if (!clientId) {
      res.status(400).json({
        success: false,
        error: "ID do cliente é obrigatório"
      });
      return;
    }

    const result = await this.sicrediSyncService.syncClientPayments(clientId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * @swagger
   * /api/sicredi-sync/logs:
   *   get:
   *     summary: Obtém logs da sincronização (últimas 100 linhas)
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
   *                 data:
   *                   type: object
   *                   properties:
   *                     logs:
   *                       type: array
   *                       items:
   *                         type: string
   *                     totalLines:
   *                       type: number
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Acesso negado
   */
  getSyncLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Por enquanto, retornamos uma mensagem informativa
    // Em produção, você pode implementar um sistema de logs mais robusto
    res.status(200).json({
      success: true,
      data: {
        logs: [
          "Sistema de logs será implementado em versão futura",
          "Os logs atuais são exibidos no console do servidor"
        ],
        totalLines: 2
      }
    });
  });
}
