import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { SicrediSyncService, SicrediSyncError } from '../../../services/SicrediSyncService';
import { PaymentService } from '../../../services/PaymentService';
import { UserService } from '../../../services/UserService';
import { LegacyClientService } from '../../../services/LegacyClientService';
import { OrderService } from '../../../services/OrderService';
import { IPayment } from '../../../interfaces/IPayment';
import { IUser } from '../../../interfaces/IUser';
import { ILegacyClient } from '../../../interfaces/ILegacyClient';

// Mock dos serviços
jest.mock('../../../services/PaymentService');
jest.mock('../../../services/UserService');
jest.mock('../../../services/LegacyClientService');
jest.mock('../../../services/OrderService');

const MockedPaymentService = PaymentService as jest.MockedClass<typeof PaymentService>;
const MockedUserService = UserService as jest.MockedClass<typeof UserService>;
const MockedLegacyClientService = LegacyClientService as jest.MockedClass<typeof LegacyClientService>;
const MockedOrderService = OrderService as jest.MockedClass<typeof OrderService>;

describe('SicrediSyncService', () => {
  let sicrediSyncService: SicrediSyncService;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockLegacyClientService: jest.Mocked<LegacyClientService>;
  let mockOrderService: jest.Mocked<OrderService>;

  beforeEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Criar instâncias mockadas
    mockPaymentService = new MockedPaymentService() as jest.Mocked<PaymentService>;
    mockUserService = new MockedUserService() as jest.Mocked<UserService>;
    mockLegacyClientService = new MockedLegacyClientService() as jest.Mocked<LegacyClientService>;
    mockOrderService = new MockedOrderService() as jest.Mocked<OrderService>;

    // Criar instância do serviço
    sicrediSyncService = new SicrediSyncService(
      mockPaymentService,
      mockUserService,
      mockLegacyClientService,
      mockOrderService
    );
  });

  afterEach(() => {
    // Limpar timers e parar sincronização
    jest.clearAllTimers();
    jest.useRealTimers();
    if (sicrediSyncService.isSyncRunning()) {
      sicrediSyncService.stopAutoSync();
    }
  });

  describe('startAutoSync', () => {
    it('deve iniciar sincronização automática com intervalo padrão', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const performSyncSpy = jest.spyOn(sicrediSyncService, 'performSync').mockResolvedValue({
        totalProcessed: 0,
        updatedPayments: 0,
        updatedDebts: 0,
        errors: [],
        summary: { paid: 0, overdue: 0, cancelled: 0, pending: 0 }
      });

      sicrediSyncService.startAutoSync();

      expect(consoleSpy).toHaveBeenCalledWith('🚀 SICREDI Sync: Iniciando sincronização automática a cada 30 minutos');
      expect(sicrediSyncService.isSyncRunning()).toBe(true);

      consoleSpy.mockRestore();
      performSyncSpy.mockRestore();
    });

    it('deve iniciar sincronização automática com intervalo customizado', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const performSyncSpy = jest.spyOn(sicrediSyncService, 'performSync').mockResolvedValue({
        totalProcessed: 0,
        updatedPayments: 0,
        updatedDebts: 0,
        errors: [],
        summary: { paid: 0, overdue: 0, cancelled: 0, pending: 0 }
      });

      sicrediSyncService.startAutoSync(60);

      expect(consoleSpy).toHaveBeenCalledWith('🚀 SICREDI Sync: Iniciando sincronização automática a cada 60 minutos');

      consoleSpy.mockRestore();
      performSyncSpy.mockRestore();
    });

    it('não deve iniciar sincronização se já estiver rodando', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const performSyncSpy = jest.spyOn(sicrediSyncService, 'performSync').mockResolvedValue({
        totalProcessed: 0,
        updatedPayments: 0,
        updatedDebts: 0,
        errors: [],
        summary: { paid: 0, overdue: 0, cancelled: 0, pending: 0 }
      });

      // Iniciar primeira vez
      sicrediSyncService.startAutoSync();

      // Tentar iniciar novamente
      sicrediSyncService.startAutoSync();

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ SICREDI Sync: Sincronização já está em execução');

      consoleSpy.mockRestore();
      performSyncSpy.mockRestore();
    });
  });

  describe('stopAutoSync', () => {
    it('deve parar sincronização automática', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const performSyncSpy = jest.spyOn(sicrediSyncService, 'performSync').mockResolvedValue({
        totalProcessed: 0,
        updatedPayments: 0,
        updatedDebts: 0,
        errors: [],
        summary: { paid: 0, overdue: 0, cancelled: 0, pending: 0 }
      });

      // Iniciar sincronização
      sicrediSyncService.startAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(true);

      // Parar sincronização
      sicrediSyncService.stopAutoSync();

      expect(consoleSpy).toHaveBeenCalledWith('🛑 SICREDI Sync: Parando sincronização automática');
      expect(sicrediSyncService.isSyncRunning()).toBe(false);

      consoleSpy.mockRestore();
      performSyncSpy.mockRestore();
    });

    it('não deve fazer nada se sincronização não estiver rodando', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});

      sicrediSyncService.stopAutoSync();

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ SICREDI Sync: Sincronização não está em execução');
      expect(clearIntervalSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('performSync', () => {
    const mockPayment: IPayment = {
      _id: '507f1f77bcf86cd799439011',
      amount: 150.50,
      type: 'sale',
      paymentMethod: 'sicredi_boleto',
      status: 'pending',
      customerId: '507f1f77bcf86cd799439012',
      date: new Date(),
      bank_slip: {
        sicredi: {
          nossoNumero: '123456789',
          codigoBarras: '12345678901234567890',
          linhaDigitavel: '12345.67890 12345.678901 12345.678901 1 23456789012345',
          status: 'REGISTRADO',
          dataVencimento: new Date()
        }
      }
    } as IPayment;

    beforeEach(() => {
      // Mock do getAllPayments
      mockPaymentService.getAllPayments.mockResolvedValue({
        payments: [mockPayment],
        total: 1
      });

      // Mock do checkSicrediBoletoStatus
      mockPaymentService.checkSicrediBoletoStatus.mockResolvedValue({
        success: true,
        data: {
          status: 'PAGO',
          valorPago: 150.50,
          dataPagamento: new Date()
        }
      });

      // Mock do getUserById
      mockUserService.getUserById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        name: 'João Silva',
        email: 'joao@example.com',
        debts: 300.00
      } as IUser);

      // Mock do updateUser
      mockUserService.updateUser.mockResolvedValue({} as IUser);
    });

    it('deve executar sincronização com sucesso', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(1);
      expect(result.updatedPayments).toBe(1);
      expect(result.updatedDebts).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.paid).toBe(1);
      expect(result.summary.pending).toBe(0);

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith(1, 1000, {
        paymentMethod: 'sicredi_boleto',
        status: 'pending' as any
      });

      expect(mockPaymentService.checkSicrediBoletoStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockUserService.getUserById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockUserService.updateUser).toHaveBeenCalledWith('507f1f77bcf86cd799439012', { debts: 149.50 });

      consoleSpy.mockRestore();
    });

    it('deve lidar com pagamentos sem nosso número', async () => {
      const paymentWithoutNossoNumero = {
        ...mockPayment,
        bank_slip: {
          sicredi: {
            // sem nossoNumero
          }
        }
      };

      mockPaymentService.getAllPayments.mockResolvedValue({
        payments: [paymentWithoutNossoNumero],
        total: 1
      });

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Pagamento não possui nosso número SICREDI');
    });

    it('deve lidar com erros na consulta de status', async () => {
      mockPaymentService.checkSicrediBoletoStatus.mockResolvedValue({
        success: false,
        error: 'Erro na consulta'
      });

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Erro na consulta');
    });

    it('deve lidar com pagamentos de clientes legados', async () => {
      const legacyPayment = {
        ...mockPayment,
        customerId: undefined,
        legacyClientId: '507f1f77bcf86cd799439013'
      };

      mockPaymentService.getAllPayments.mockResolvedValue({
        payments: [legacyPayment],
        total: 1
      });

      mockLegacyClientService.getLegacyClientById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        name: 'Cliente Legado',
        totalDebt: 500.00
      } as ILegacyClient);

      mockLegacyClientService.updateLegacyClient.mockResolvedValue({} as ILegacyClient);

      const result = await sicrediSyncService.performSync();

      expect(result.updatedDebts).toBe(1);
      expect(mockLegacyClientService.getLegacyClientById).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(mockLegacyClientService.updateLegacyClient).toHaveBeenCalledWith('507f1f77bcf86cd799439013', { totalDebt: 349.50 });
    });

    it('deve lidar com pagamentos sem cliente associado', async () => {
      const paymentWithoutClient = {
        ...mockPayment,
        customerId: undefined,
        legacyClientId: undefined
      };

      mockPaymentService.getAllPayments.mockResolvedValue({
        payments: [paymentWithoutClient],
        total: 1
      });

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Pagamento não possui cliente associado');
    });
  });

  describe('syncClientPayments', () => {
    const mockPayment: IPayment = {
      _id: '507f1f77bcf86cd799439011',
      amount: 100.00,
      type: 'sale',
      paymentMethod: 'sicredi_boleto',
      status: 'pending',
      customerId: '507f1f77bcf86cd799439012',
      date: new Date(),
      bank_slip: {
        sicredi: {
          nossoNumero: '123456789',
          status: 'REGISTRADO'
        }
      }
    } as IPayment;

    beforeEach(() => {
      mockPaymentService.getAllPayments.mockResolvedValue({
        payments: [mockPayment],
        total: 1
      });

      mockPaymentService.checkSicrediBoletoStatus.mockResolvedValue({
        success: true,
        data: {
          status: 'PAGO',
          valorPago: 100.00
        }
      });

      mockUserService.getUserById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        name: 'João Silva',
        debts: 200.00
      } as IUser);

      mockUserService.updateUser.mockResolvedValue({} as IUser);
    });

    it('deve sincronizar pagamentos de um cliente específico', async () => {
      const clientId = '507f1f77bcf86cd799439012';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sicrediSyncService.syncClientPayments(clientId);

      expect(result.totalProcessed).toBe(1);
      expect(result.updatedPayments).toBe(1);
      expect(result.updatedDebts).toBe(1);
      expect(result.errors).toHaveLength(0);

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith(1, 1000, {
        customerId: clientId,
        paymentMethod: 'sicredi_boleto'
      });

      expect(consoleSpy).toHaveBeenCalledWith(`🔄 SICREDI Sync: Sincronizando pagamentos do cliente ${clientId}`);
      expect(consoleSpy).toHaveBeenCalledWith(`📋 SICREDI Sync: Encontrados 1 pagamentos SICREDI para o cliente`);
      expect(consoleSpy).toHaveBeenCalledWith(`✅ SICREDI Sync: Cliente ${clientId} sincronizado - 1 pagamentos atualizados, 1 débitos atualizados`);

      consoleSpy.mockRestore();
    });

    it('deve lidar com erros durante sincronização de cliente', async () => {
      mockPaymentService.getAllPayments.mockRejectedValue(new Error('Erro de banco de dados'));

      const clientId = '507f1f77bcf86cd799439012';

      await expect(sicrediSyncService.syncClientPayments(clientId)).rejects.toThrow(SicrediSyncError);
    });
  });

  describe('getSyncStats', () => {
    const mockPayments: IPayment[] = [
      {
        _id: '1',
        paymentMethod: 'sicredi_boleto',
        bank_slip: { sicredi: { status: 'PAGO' } }
      },
      {
        _id: '2',
        paymentMethod: 'sicredi_boleto',
        bank_slip: { sicredi: { status: 'VENCIDO' } }
      },
      {
        _id: '3',
        paymentMethod: 'sicredi_boleto',
        bank_slip: { sicredi: { status: 'CANCELADO' } }
      },
      {
        _id: '4',
        paymentMethod: 'sicredi_boleto',
        bank_slip: { sicredi: { status: 'REGISTRADO' } }
      }
    ] as IPayment[];

    beforeEach(() => {
      mockPaymentService.getAllPayments.mockResolvedValue({
        payments: mockPayments,
        total: 4
      });
    });

    it('deve retornar estatísticas corretas', async () => {
      const stats = await sicrediSyncService.getSyncStats();

      expect(stats.totalSicrediPayments).toBe(4);
      expect(stats.paidPayments).toBe(1);
      expect(stats.overduePayments).toBe(1);
      expect(stats.cancelledPayments).toBe(1);
      expect(stats.pendingPayments).toBe(1);

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith(1, 10000, {
        paymentMethod: 'sicredi_boleto'
      });
    });

    it('deve lidar com erros ao obter estatísticas', async () => {
      mockPaymentService.getAllPayments.mockRejectedValue(new Error('Erro de banco de dados'));

      await expect(sicrediSyncService.getSyncStats()).rejects.toThrow(SicrediSyncError);
    });
  });

  describe('isSyncRunning', () => {
    it('deve retornar false quando sincronização não está rodando', () => {
      expect(sicrediSyncService.isSyncRunning()).toBe(false);
    });

    it('deve retornar true quando sincronização está rodando', () => {
      sicrediSyncService.startAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(true);
    });
  });
});
