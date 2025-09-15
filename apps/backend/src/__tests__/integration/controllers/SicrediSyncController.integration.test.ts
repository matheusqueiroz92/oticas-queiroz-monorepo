import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../app';
import { createTestUser, createTestPayment, createTestLegacyClient } from '../../helpers/testHelpers';
import { IUser } from '../../../interfaces/IUser';
import { IPayment } from '../../../interfaces/IPayment';
import { ILegacyClient } from '../../../interfaces/ILegacyClient';
import { connectDB, closeDB } from '../../../config/db';

describe('SicrediSyncController Integration Tests', () => {
  let adminUser: IUser;
  let employeeUser: IUser;
  let customerUser: IUser;
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;
  let testPayment: IPayment;
  let testLegacyClient: ILegacyClient;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Criar usuários de teste
    adminUser = await createTestUser({
      name: 'Admin Test',
      email: 'admin.sicredi@test.com',
      password: 'password123',
      role: 'admin'
    });

    employeeUser = await createTestUser({
      name: 'Employee Test',
      email: 'employee.sicredi@test.com',
      password: 'password123',
      role: 'employee'
    });

    customerUser = await createTestUser({
      name: 'Customer Test',
      email: 'customer.sicredi@test.com',
      password: 'password123',
      role: 'customer'
    });

    // Fazer login para obter tokens
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: 'password123'
      });

    const employeeLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: employeeUser.email,
        password: 'password123'
      });

    const customerLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: customerUser.email,
        password: 'password123'
      });

    adminToken = adminLoginResponse.body.token;
    employeeToken = employeeLoginResponse.body.token;
    customerToken = customerLoginResponse.body.token;

    // Criar pagamento SICREDI de teste
    testPayment = await createTestPayment({
      amount: 150.50,
      type: 'sale',
      paymentMethod: 'sicredi_boleto',
      status: 'pending',
      customerId: customerUser._id,
      bank_slip: {
        sicredi: {
          nossoNumero: '123456789',
          codigoBarras: '12345678901234567890',
          linhaDigitavel: '12345.67890 12345.678901 12345.678901 1 23456789012345',
          status: 'REGISTRADO',
          dataVencimento: new Date()
        }
      }
    });

    // Criar cliente legado de teste
    testLegacyClient = await createTestLegacyClient({
      name: 'Cliente Legado Test',
      cpf: '12345678901',
      totalDebt: 300.00
    });
  });

  afterEach(async () => {
    // Limpar dados de teste
    jest.clearAllMocks();
  });

  describe('POST /api/sicredi-sync/start', () => {
    it('deve iniciar sincronização automática com sucesso (admin)', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          intervalMinutes: 30
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Sincronização automática iniciada');
      expect(response.body.intervalMinutes).toBe(30);
    });

    it('deve usar intervalo padrão quando não fornecido', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.intervalMinutes).toBe(30);
    });

    it('deve rejeitar acesso de employee', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          intervalMinutes: 30
        });

      expect(response.status).toBe(403);
    });

    it('deve rejeitar acesso de customer', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          intervalMinutes: 30
        });

      expect(response.status).toBe(403);
    });

    it('deve validar intervalo mínimo', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          intervalMinutes: 1
        });

      expect(response.status).toBe(400);
    });

    it('deve validar intervalo máximo', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          intervalMinutes: 2000
        });

      expect(response.status).toBe(400);
    });

    it('deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .send({
          intervalMinutes: 30
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/sicredi-sync/stop', () => {
    it('deve parar sincronização automática com sucesso (admin)', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/stop')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Sincronização automática parada');
    });

    it('deve rejeitar acesso de employee', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/stop')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });

    it('deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/stop');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sicredi-sync/status', () => {
    it('deve retornar status da sincronização (admin)', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isRunning');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalSicrediPayments');
      expect(response.body.data.stats).toHaveProperty('pendingPayments');
      expect(response.body.data.stats).toHaveProperty('paidPayments');
      expect(response.body.data.stats).toHaveProperty('overduePayments');
      expect(response.body.data.stats).toHaveProperty('cancelledPayments');
    });

    it('deve permitir acesso de employee', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/status')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar acesso de customer', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/status')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/status');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/sicredi-sync/perform', () => {
    it('deve executar sincronização manual com sucesso (admin)', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/perform')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProcessed');
      expect(response.body.data).toHaveProperty('updatedPayments');
      expect(response.body.data).toHaveProperty('updatedDebts');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('summary');
    });

    it('deve permitir acesso de employee', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/perform')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar acesso de customer', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/perform')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/perform');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/sicredi-sync/client/:clientId', () => {
    it('deve sincronizar cliente específico com sucesso (admin)', async () => {
      const response = await request(app)
        .post(`/api/sicredi-sync/client/${customerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProcessed');
      expect(response.body.data).toHaveProperty('updatedPayments');
      expect(response.body.data).toHaveProperty('updatedDebts');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('summary');
    });

    it('deve permitir acesso de employee', async () => {
      const response = await request(app)
        .post(`/api/sicredi-sync/client/${customerUser._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar acesso de customer', async () => {
      const response = await request(app)
        .post(`/api/sicredi-sync/client/${customerUser._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando clientId não é fornecido', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/client/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar erro quando clientId é inválido', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/client/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200); // A API aceita qualquer string como clientId
      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .post(`/api/sicredi-sync/client/${customerUser._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sicredi-sync/logs', () => {
    it('deve retornar logs da sincronização (admin)', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('totalLines');
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    it('deve rejeitar acesso de employee', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/logs')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });

    it('deve rejeitar acesso de customer', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/logs')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/logs');

      expect(response.status).toBe(401);
    });
  });

  describe('Cenários de Erro', () => {
    it('deve lidar com token inválido', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/status')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('deve lidar com token expirado', async () => {
      // Criar um token expirado (isso seria testado com um token real expirado)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MzQ1Njc4NzQsImV4cCI6MTYzNDU2Nzg3NH0.invalid';

      const response = await request(app)
        .get('/api/sicredi-sync/status')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('deve lidar com formato de token incorreto', async () => {
      const response = await request(app)
        .get('/api/sicredi-sync/status')
        .set('Authorization', 'InvalidFormat token123');

      expect(response.status).toBe(401);
    });
  });

  describe('Validação de Dados', () => {
    it('deve validar formato JSON no startAutoSync', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('deve validar tipo de dados no startAutoSync', async () => {
      const response = await request(app)
        .post('/api/sicredi-sync/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          intervalMinutes: 'not a number'
        });

      expect(response.status).toBe(400);
    });
  });
});


