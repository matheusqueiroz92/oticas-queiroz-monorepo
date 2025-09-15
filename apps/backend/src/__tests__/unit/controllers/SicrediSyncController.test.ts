import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { SicrediSyncController } from '../../../controllers/SicrediSyncController';
import { SicrediSyncService } from '../../../services/SicrediSyncService';
import { PaymentService } from '../../../services/PaymentService';
import { UserService } from '../../../services/UserService';
import { LegacyClientService } from '../../../services/LegacyClientService';
import { OrderService } from '../../../services/OrderService';

// Mock dos serviços
jest.mock('../../../services/SicrediSyncService');
jest.mock('../../../services/PaymentService');
jest.mock('../../../services/UserService');
jest.mock('../../../services/LegacyClientService');
jest.mock('../../../services/OrderService');

const MockedSicrediSyncService = SicrediSyncService as jest.MockedClass<typeof SicrediSyncService>;
const MockedPaymentService = PaymentService as jest.MockedClass<typeof PaymentService>;
const MockedUserService = UserService as jest.MockedClass<typeof UserService>;
const MockedLegacyClientService = LegacyClientService as jest.MockedClass<typeof LegacyClientService>;
const MockedOrderService = OrderService as jest.MockedClass<typeof OrderService>;

describe('SicrediSyncController', () => {
  let sicrediSyncController: SicrediSyncController;
  let mockSicrediSyncService: jest.Mocked<SicrediSyncService>;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockLegacyClientService: jest.Mocked<LegacyClientService>;
  let mockOrderService: jest.Mocked<OrderService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();

    // Criar instâncias mockadas
    mockSicrediSyncService = new MockedSicrediSyncService() as jest.Mocked<SicrediSyncService>;
    mockPaymentService = new MockedPaymentService() as jest.Mocked<PaymentService>;
    mockUserService = new MockedUserService() as jest.Mocked<UserService>;
    mockLegacyClientService = new MockedLegacyClientService() as jest.Mocked<LegacyClientService>;
    mockOrderService = new MockedOrderService() as jest.Mocked<OrderService>;

    // Criar instância do controlador
    sicrediSyncController = new SicrediSyncController(
      mockPaymentService,
      mockUserService,
      mockLegacyClientService,
      mockOrderService
    );

    // Mock do request e response
    mockRequest = {
      body: {},
      params: {},
      user: {
        _id: '507f1f77bcf86cd799439011',
        role: 'admin',
        name: 'Admin User'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('startAutoSync', () => {
    it('deve iniciar sincronização automática com sucesso', async () => {
      mockRequest.body = { intervalMinutes: 30 };

      await sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response);

      expect(mockSicrediSyncService.startAutoSync).toHaveBeenCalledWith(30);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sincronização automática iniciada a cada 30 minutos',
        intervalMinutes: 30
      });
    });

    it('deve usar intervalo padrão quando não fornecido', async () => {
      mockRequest.body = {};

      await sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response);

      expect(mockSicrediSyncService.startAutoSync).toHaveBeenCalledWith(30);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sincronização automática iniciada a cada 30 minutos',
        intervalMinutes: 30
      });
    });

    it('deve validar intervalo mínimo', async () => {
      mockRequest.body = { intervalMinutes: 1 };

      await expect(
        sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });

    it('deve validar intervalo máximo', async () => {
      mockRequest.body = { intervalMinutes: 2000 };

      await expect(
        sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });

  describe('stopAutoSync', () => {
    it('deve parar sincronização automática com sucesso', async () => {
      await sicrediSyncController.stopAutoSync(mockRequest as Request, mockResponse as Response);

      expect(mockSicrediSyncService.stopAutoSync).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sincronização automática parada'
      });
    });
  });

  describe('getSyncStatus', () => {
    it('deve retornar status da sincronização com sucesso', async () => {
      const mockStats = {
        totalSicrediPayments: 10,
        pendingPayments: 3,
        paidPayments: 5,
        overduePayments: 1,
        cancelledPayments: 1
      };

      mockSicrediSyncService.isSyncRunning.mockReturnValue(true);
      mockSicrediSyncService.getSyncStats.mockResolvedValue(mockStats);

      await sicrediSyncController.getSyncStatus(mockRequest as Request, mockResponse as Response);

      expect(mockSicrediSyncService.isSyncRunning).toHaveBeenCalled();
      expect(mockSicrediSyncService.getSyncStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isRunning: true,
          stats: mockStats
        }
      });
    });

    it('deve lidar com erros ao obter estatísticas', async () => {
      mockSicrediSyncService.isSyncRunning.mockReturnValue(false);
      mockSicrediSyncService.getSyncStats.mockRejectedValue(new Error('Erro de banco de dados'));

      await expect(
        sicrediSyncController.getSyncStatus(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });

  describe('performSync', () => {
    it('deve executar sincronização manual com sucesso', async () => {
      const mockResult = {
        totalProcessed: 5,
        updatedPayments: 2,
        updatedDebts: 1,
        errors: [],
        summary: {
          paid: 2,
          overdue: 1,
          cancelled: 0,
          pending: 2
        }
      };

      mockSicrediSyncService.performSync.mockResolvedValue(mockResult);

      await sicrediSyncController.performSync(mockRequest as Request, mockResponse as Response);

      expect(mockSicrediSyncService.performSync).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve lidar com erros durante sincronização', async () => {
      mockSicrediSyncService.performSync.mockRejectedValue(new Error('Erro de sincronização'));

      await expect(
        sicrediSyncController.performSync(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });

  describe('syncClient', () => {
    it('deve sincronizar cliente específico com sucesso', async () => {
      const clientId = '507f1f77bcf86cd799439012';
      mockRequest.params = { clientId };

      const mockResult = {
        totalProcessed: 3,
        updatedPayments: 1,
        updatedDebts: 1,
        errors: [],
        summary: {
          paid: 1,
          overdue: 0,
          cancelled: 0,
          pending: 2
        }
      };

      mockSicrediSyncService.syncClientPayments.mockResolvedValue(mockResult);

      await sicrediSyncController.syncClient(mockRequest as Request, mockResponse as Response);

      expect(mockSicrediSyncService.syncClientPayments).toHaveBeenCalledWith(clientId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('deve retornar erro quando clientId não é fornecido', async () => {
      mockRequest.params = {};

      await sicrediSyncController.syncClient(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'ID do cliente é obrigatório'
      });
    });

    it('deve lidar com erros durante sincronização de cliente', async () => {
      const clientId = '507f1f77bcf86cd799439012';
      mockRequest.params = { clientId };

      mockSicrediSyncService.syncClientPayments.mockRejectedValue(new Error('Erro de sincronização'));

      await expect(
        sicrediSyncController.syncClient(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });

  describe('getSyncLogs', () => {
    it('deve retornar logs da sincronização', async () => {
      await sicrediSyncController.getSyncLogs(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          logs: [
            'Sistema de logs será implementado em versão futura',
            'Os logs atuais são exibidos no console do servidor'
          ],
          totalLines: 2
        }
      });
    });
  });

  describe('Validação de Schemas', () => {
    it('deve validar intervalo mínimo no startAutoSync', async () => {
      mockRequest.body = { intervalMinutes: 1 };

      await expect(
        sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });

    it('deve validar intervalo máximo no startAutoSync', async () => {
      mockRequest.body = { intervalMinutes: 2000 };

      await expect(
        sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });

    it('deve aceitar intervalo válido no startAutoSync', async () => {
      mockRequest.body = { intervalMinutes: 60 };

      await sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response);

      expect(mockSicrediSyncService.startAutoSync).toHaveBeenCalledWith(60);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com erros de validação do Zod', async () => {
      mockRequest.body = { intervalMinutes: 'invalid' };

      await expect(
        sicrediSyncController.startAutoSync(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });

    it('deve lidar com erros de serviço', async () => {
      mockSicrediSyncService.performSync.mockRejectedValue(new Error('Erro interno'));

      await expect(
        sicrediSyncController.performSync(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });
});


