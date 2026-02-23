import { PaymentService } from './PaymentService';
import { UserService } from './UserService';
import { LegacyClientService } from './LegacyClientService';
import { OrderService } from './OrderService';
import { IPayment } from '../interfaces/IPayment';
import { logger } from '../config/logger';
import { IUser } from '../interfaces/IUser';
import { ILegacyClient } from '../interfaces/ILegacyClient';

export class SicrediSyncError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'SicrediSyncError';
  }
}

export interface SyncResult {
  totalProcessed: number;
  updatedPayments: number;
  updatedDebts: number;
  errors: Array<{
    paymentId: string;
    error: string;
  }>;
  summary: {
    paid: number;
    overdue: number;
    cancelled: number;
    pending: number;
  };
}

export class SicrediSyncService {
  private paymentService: PaymentService;
  private userService: UserService;
  private legacyClientService: LegacyClientService;
  private orderService: OrderService;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    paymentService: PaymentService,
    userService: UserService,
    legacyClientService: LegacyClientService,
    orderService: OrderService
  ) {
    this.paymentService = paymentService;
    this.userService = userService;
    this.legacyClientService = legacyClientService;
    this.orderService = orderService;
  }

  /**
   * Inicia a sincronização automática
   * @param intervalMinutes Intervalo em minutos para sincronização (padrão: 30)
   */
  startAutoSync(intervalMinutes: number = 30): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // NÃO executar primeira sincronização imediatamente aqui
    // A primeira sincronização será executada pelo startSicrediSync.ts após delay
    // Isso evita tentar fazer queries antes da conexão MongoDB estar pronta
    
    // Configurar intervalo para próximas sincronizações
    this.syncInterval = setInterval(() => {
      // Capturar erros para não crashar a aplicação
      this.performSync().catch((error) => {
        logger.error('SICREDI Sync: Erro na sincronização agendada', { error });
        // Continuar tentando mesmo em caso de erro
      });
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Para a sincronização automática
   */
  stopAutoSync(): void {
    if (!this.isRunning) {
      logger.warn('SICREDI Sync: Sincronização não está em execução');
      return;
    }

    logger.info('SICREDI Sync: Parando sincronização automática');
    
    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Executa uma sincronização manual
   */
  async performSync(): Promise<SyncResult> {
    
    const startTime = Date.now();
    const result: SyncResult = {
      totalProcessed: 0,
      updatedPayments: 0,
      updatedDebts: 0,
      errors: [],
      summary: {
        paid: 0,
        overdue: 0,
        cancelled: 0,
        pending: 0
      }
    };

    try {
      // Buscar todos os pagamentos SICREDI pendentes
      const pendingPayments = await this.getPendingSicrediPayments();
      
      
      result.totalProcessed = pendingPayments.length;

      // Processar cada pagamento
      for (const payment of pendingPayments) {
        try {
          await this.processPaymentSync(payment, result);
        } catch (error) {
          logger.error(`SICREDI Sync: Erro ao processar pagamento ${payment._id}`, { error });
          result.errors.push({
            paymentId: payment._id?.toString() || 'unknown',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      const duration = Date.now() - startTime;

    } catch (error) {
      logger.error('SICREDI Sync: Erro geral na sincronização', { error });

      // Se for erro de conexão MongoDB (buffering timeout), não lançar exceção
      // Isso evita crash da aplicação quando MongoDB ainda não está conectado
      if (error instanceof Error &&
          (error.message.includes('buffering timed out') ||
           error.message.includes('MongoDB') ||
           error.name === 'MongooseError')) {
        logger.warn('SICREDI Sync: Erro de conexão MongoDB, retornando resultado vazio. Tentará novamente na próxima execução.');
        return result; // Retornar resultado vazio em vez de lançar exceção
      }

      // Para outros erros, também não lançar exceção para não crashar a aplicação
      logger.error('SICREDI Sync: Erro na sincronização (não crítico)', { error });
      return result;
    }

    return result;
  }

  /**
   * Busca pagamentos SICREDI pendentes de sincronização
   */
  private async getPendingSicrediPayments(): Promise<IPayment[]> {
    // Buscar pagamentos SICREDI que não estão cancelados ou finalizados
    const payments = await this.paymentService.getAllPayments(1, 1000, {
      paymentMethod: 'sicredi_boleto',
      status: 'pending' as any // Usar 'pending' como filtro principal
    });

    return payments.payments || [];
  }

  /**
   * Processa sincronização de um pagamento específico
   */
  private async processPaymentSync(payment: IPayment, result: SyncResult): Promise<void> {
    if (!payment.bank_slip?.sicredi?.nossoNumero) {
      throw new SicrediSyncError('Pagamento não possui nosso número SICREDI');
    }

    // Consultar status na SICREDI
    const statusResult = await this.paymentService.checkSicrediBoletoStatus(payment._id?.toString() || '');
    
    if (!statusResult.success) {
      throw new SicrediSyncError(statusResult.error || 'Erro ao consultar status');
    }

    const newStatus = statusResult.data?.status;
    const valorPago = statusResult.data?.valorPago;
    const dataPagamento = statusResult.data?.dataPagamento;

    // Atualizar contadores de resumo
    switch (newStatus) {
      case 'PAGO':
        result.summary.paid++;
        break;
      case 'VENCIDO':
        result.summary.overdue++;
        break;
      case 'CANCELADO':
        result.summary.cancelled++;
        break;
      default:
        result.summary.pending++;
    }

    // Se o status mudou, atualizar contador
    if (payment.bank_slip.sicredi?.status !== newStatus) {
      result.updatedPayments++;
    }

    // Se foi pago, atualizar débito do cliente
    if (newStatus === 'PAGO' && valorPago && valorPago > 0) {
      await this.updateClientDebt(payment, valorPago, dataPagamento);
      result.updatedDebts++;
    }
  }

  /**
   * Atualiza débito do cliente quando boleto é pago
   */
  private async updateClientDebt(
    payment: IPayment, 
    valorPago: number, 
    dataPagamento?: Date
  ): Promise<void> {
    const clientId = payment.customerId;
    const legacyClientId = payment.legacyClientId;

    if (!clientId && !legacyClientId) {
      throw new SicrediSyncError('Pagamento não possui cliente associado');
    }

    logger.info(`SICREDI Sync: Atualizando débito - Cliente: ${clientId || legacyClientId}, Valor: R$ ${valorPago}`);

    try {
      if (clientId) {
        // Cliente regular
        const client = await this.userService.getUserById(clientId);
        if (client) {
          const currentDebt = client.debts || 0;
          const newDebt = Math.max(0, currentDebt - valorPago);
          
          await this.userService.updateUser(clientId, { debts: newDebt });
          
          logger.info(`SICREDI Sync: Débito do cliente ${client.name} atualizado de R$ ${currentDebt} para R$ ${newDebt}`);
        }
      } else if (legacyClientId) {
        // Cliente legado
        const legacyClient = await this.legacyClientService.getLegacyClientById(legacyClientId);
        if (legacyClient) {
          const currentDebt = legacyClient.totalDebt || 0;
          const newDebt = Math.max(0, currentDebt - valorPago);
          
          await this.legacyClientService.updateLegacyClient(legacyClientId, { totalDebt: newDebt });
          
          logger.info(`SICREDI Sync: Débito do cliente legado ${legacyClient.name} atualizado de R$ ${currentDebt} para R$ ${newDebt}`);
        }
      }
    } catch (error) {
      logger.error('SICREDI Sync: Erro ao atualizar débito do cliente', { error });
      throw new SicrediSyncError(
        'Falha ao atualizar débito do cliente',
        'DEBT_UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Sincroniza um cliente específico
   */
  async syncClientPayments(clientId: string): Promise<SyncResult> {
    logger.info(`SICREDI Sync: Sincronizando pagamentos do cliente ${clientId}`);
    
    const result: SyncResult = {
      totalProcessed: 0,
      updatedPayments: 0,
      updatedDebts: 0,
      errors: [],
      summary: {
        paid: 0,
        overdue: 0,
        cancelled: 0,
        pending: 0
      }
    };

    try {
      // Buscar pagamentos SICREDI do cliente
      const clientPayments = await this.paymentService.getAllPayments(1, 1000, {
        customerId: clientId,
        paymentMethod: 'sicredi_boleto'
      });

      const payments = clientPayments.payments || [];
      result.totalProcessed = payments.length;

      logger.info(`SICREDI Sync: Encontrados ${payments.length} pagamentos SICREDI para o cliente`);

      // Processar cada pagamento
      for (const payment of payments) {
        try {
          await this.processPaymentSync(payment, result);
        } catch (error) {
          logger.error(`SICREDI Sync: Erro ao processar pagamento ${payment._id}`, { error });
          result.errors.push({
            paymentId: payment._id?.toString() || 'unknown',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      logger.info(`SICREDI Sync: Cliente ${clientId} sincronizado - ${result.updatedPayments} pagamentos atualizados, ${result.updatedDebts} débitos atualizados`);

    } catch (error) {
      logger.error(`SICREDI Sync: Erro ao sincronizar cliente ${clientId}`, { error });
      throw new SicrediSyncError(
        `Falha ao sincronizar cliente ${clientId}`,
        'CLIENT_SYNC_ERROR',
        error
      );
    }

    return result;
  }

  /**
   * Verifica se a sincronização está ativa
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Obtém estatísticas da sincronização
   */
  async getSyncStats(): Promise<{
    totalSicrediPayments: number;
    pendingPayments: number;
    paidPayments: number;
    overduePayments: number;
    cancelledPayments: number;
  }> {
    try {
      const allPayments = await this.paymentService.getAllPayments(1, 10000, {
        paymentMethod: 'sicredi_boleto'
      });

      const payments = allPayments.payments || [];
      
      const stats = {
        totalSicrediPayments: payments.length,
        pendingPayments: 0,
        paidPayments: 0,
        overduePayments: 0,
        cancelledPayments: 0
      };

      payments.forEach(payment => {
        const status = payment.bank_slip?.sicredi?.status;
        switch (status) {
          case 'PAGO':
            stats.paidPayments++;
            break;
          case 'VENCIDO':
            stats.overduePayments++;
            break;
          case 'CANCELADO':
            stats.cancelledPayments++;
            break;
          default:
            stats.pendingPayments++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('SICREDI Sync: Erro ao obter estatísticas', { error });
      throw new SicrediSyncError(
        'Falha ao obter estatísticas de sincronização',
        'STATS_ERROR',
        error
      );
    }
  }
}
