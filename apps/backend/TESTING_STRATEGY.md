# 🧪 Estratégia de Testes - Backend Óticas Queiroz

## 📊 Análise da Estrutura Atual

### Arquitetura
- **Padrão:** MSC (Model, Service, Controller) + Repository Pattern
- **Framework de Testes:** Jest + Supertest
- **Banco de Dados para Testes:** MongoDB Memory Server
- **Cobertura Atual:** 
  - Statements: 92.06%
  - Branches: **68.62%** ⚠️
  - Functions: 92.3%
  - Lines: 92%

### Estrutura de Pastas
```
src/
├── controllers/     (12 arquivos)
├── services/        (22 arquivos)
├── models/          (11 arquivos)
├── repositories/    (10 implementações)
├── validators/      (Zod schemas)
├── middlewares/     (3 arquivos)
└── __tests__/
    ├── unit/
    │   ├── services/     ✅ 22 testes
    │   ├── models/       ✅ 8 testes
    │   └── controllers/  ✅ 1 teste
    └── integration/
        └── controllers/  ✅ 8 testes
```

---

## 🎯 Objetivo: 100% de Cobertura

### Meta de Cobertura
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%

---

## 📋 Lacunas Identificadas

### Controllers Sem Testes
1. ❌ **PasswordResetController**
2. ❌ **ReportController**
3. ❌ **SicrediController**

### Services Sem Testes
1. ❌ **SicrediService**

### Repositories Sem Testes
1. ❌ **MongoProductRepository** (com lógica complexa de discriminators)
2. ❌ **MongoOrderRepository**
3. ❌ **MongoPaymentRepository**
4. ❌ **MongoUserRepository**
5. ❌ **MongoCashRegisterRepository**
6. ❌ **MongoLaboratoryRepository**
7. ❌ **MongoLegacyClientRepository**
8. ❌ **MongoPasswordResetRepository**
9. ❌ **MongoCounterRepository**

### Middlewares Sem Testes
1. ❌ **authMiddleware**
2. ❌ **errorMiddleware**
3. ❌ **roleMiddleware**

### Validators Sem Testes
1. ❌ **orderValidators**
2. ❌ **productValidators**
3. ❌ **userValidators**
4. ❌ **paymentValidators**

---

## 🏗️ Estratégia de Implementação

### Fase 1: Testes Unitários de Repositories (PRIORIDADE ALTA)
**Por quê?** Repositories contêm lógica crítica de persistência e discriminators do Mongoose.

#### 1.1 MongoProductRepository
- **Arquivo:** `src/__tests__/unit/repositories/MongoProductRepository.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('MongoProductRepository', () => {
    // CRUD Básico
    - create() com diferentes tipos de produto (lenses, frames, etc)
    - findById() com ID válido e inválido
    - update() sem mudança de tipo
    - update() COM mudança de tipo (discriminator)
    - delete() com soft delete
    
    // Discriminators
    - Criar lente e verificar schema correto
    - Criar armação e verificar campos obrigatórios
    - Mudar tipo de prescription_frame para sunglasses_frame
    - Validar campos obrigatórios ao mudar tipo
    
    // Métodos Específicos
    - findByType()
    - findLowStock()
    - findInsufficientStock()
    - updateStock()
    - findByIds()
    - calculateStatistics()
  ```

#### 1.2 Demais Repositories
Seguir padrão similar para:
- MongoOrderRepository
- MongoPaymentRepository
- MongoUserRepository
- MongoCashRegisterRepository
- MongoLaboratoryRepository
- MongoLegacyClientRepository
- MongoPasswordResetRepository
- MongoCounterRepository

**Padrão de Teste:**
```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MongoXRepository } from '../../../repositories/implementations/MongoXRepository';

describe('MongoXRepository', () => {
  let repository: MongoXRepository;
  
  beforeEach(async () => {
    repository = new MongoXRepository();
    // Limpar coleções
  });
  
  describe('CRUD Operations', () => {
    it('should create', async () => { /*...*/ });
    it('should read', async () => { /*...*/ });
    it('should update', async () => { /*...*/ });
    it('should delete', async () => { /*...*/ });
  });
  
  describe('Specific Methods', () => {
    // Métodos específicos do repository
  });
  
  describe('Edge Cases', () => {
    it('should handle invalid ID', async () => { /*...*/ });
    it('should handle non-existent document', async () => { /*...*/ });
  });
});
```

---

### Fase 2: Testes de Integração de Controllers (PRIORIDADE ALTA)

#### 2.1 PasswordResetController
- **Arquivo:** `src/__tests__/integration/controllers/PasswordResetController.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('PasswordResetController', () => {
    // POST /api/auth/forgot-password
    - Solicitar reset com email válido
    - Solicitar reset com email inexistente
    - Verificar envio de email
    - Validar geração de token
    
    // POST /api/auth/reset-password/:token
    - Resetar senha com token válido
    - Rejeitar token inválido
    - Rejeitar token expirado
    - Validar senha alterada
  });
  ```

#### 2.2 ReportController
- **Arquivo:** `src/__tests__/integration/controllers/ReportController.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('ReportController', () => {
    // GET /api/reports/sales
    - Gerar relatório de vendas
    - Filtrar por período
    - Filtrar por funcionário
    - Verificar cálculos de totais
    
    // GET /api/reports/products
    - Relatório de produtos mais vendidos
    - Relatório de estoque baixo
    
    // GET /api/reports/financial
    - Relatório financeiro
    - Cálculo de lucros
    - Análise de pagamentos
  });
  ```

#### 2.3 SicrediController
- **Arquivo:** `src/__tests__/integration/controllers/SicrediController.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('SicrediController', () => {
    // Integração com Sicredi API
    - Criar boleto
    - Consultar boleto
    - Cancelar boleto
    - Webhook de pagamento
    - Tratar erros da API
  });
  ```

---

### Fase 3: Testes Unitários de Services (PRIORIDADE MÉDIA)

#### 3.1 SicrediService
- **Arquivo:** `src/__tests__/unit/services/SicrediService.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('SicrediService', () => {
    // Mock das chamadas HTTP
    - createBoleto()
    - getBoleto()
    - cancelBoleto()
    - processWebhook()
    - handleAPIErrors()
  });
  ```

---

### Fase 4: Testes de Middlewares (PRIORIDADE MÉDIA)

#### 4.1 authMiddleware
- **Arquivo:** `src/__tests__/unit/middlewares/authMiddleware.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('authMiddleware', () => {
    - Aceitar token válido
    - Rejeitar token inválido
    - Rejeitar token expirado
    - Rejeitar requisição sem token
    - Anexar user ao request
  });
  ```

#### 4.2 roleMiddleware
- **Arquivo:** `src/__tests__/unit/middlewares/roleMiddleware.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('roleMiddleware', () => {
    - Permitir admin em rota admin
    - Bloquear employee em rota admin
    - Permitir múltiplas roles
    - Rejeitar sem autenticação
  });
  ```

#### 4.3 errorMiddleware
- **Arquivo:** `src/__tests__/unit/middlewares/errorMiddleware.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('errorMiddleware', () => {
    - Tratar erro de validação Zod
    - Tratar erro de Mongoose
    - Tratar erro genérico
    - Formatar resposta de erro
  });
  ```

---

### Fase 5: Testes de Validators (PRIORIDADE BAIXA)

#### 5.1 Validators
- **Arquivos:** `src/__tests__/unit/validators/*.test.ts`
- **Casos de Teste:**
  ```typescript
  describe('orderValidators', () => {
    - Validar pedido completo válido
    - Rejeitar campos obrigatórios faltando
    - Validar prescrição condicional
    - Validar tipos de produto
  });
  ```

---

### Fase 6: Aumentar Cobertura de Branches (PRIORIDADE ALTA)

**Objetivo:** 68.62% → 100%

**Estratégias:**
1. **Identificar branches não cobertos:**
   ```bash
   npm test -- --coverage --coverageReporters=html
   # Abrir coverage/index.html e identificar linhas amarelas
   ```

2. **Focar em:**
   - Condicionais if/else não testados
   - Switch cases sem cobertura
   - Try/catch blocks
   - Ternários
   - Operadores lógicos (&&, ||)

3. **Casos edge:**
   - Valores null/undefined
   - Arrays vazios
   - Strings vazias
   - Números zero/negativos
   - Datas inválidas

---

## 🛠️ Ferramentas e Padrões

### Setup de Teste
```typescript
// Padrão para testes unitários
import { jest } from '@jest/globals';
jest.mock('path/to/dependency');

// Padrão para testes de integração
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
```

### Helpers Disponíveis
- `createTestUser()` - Criar usuários de teste
- `createTestCashRegister()` - Criar caixa de teste
- `generateValidCPF()` - Gerar CPF válido
- `generateToken()` - Gerar JWT

### Convenções
1. **Nomenclatura:**
   - Unitários: `*.test.ts`
   - Integração: `*.test.ts` ou `*.integration.test.ts`

2. **Estrutura:**
   ```typescript
   describe('EntityName', () => {
     describe('methodName', () => {
       it('should do something when condition', () => {
         // Arrange
         // Act
         // Assert
       });
     });
   });
   ```

3. **Mocks:**
   - Sempre limpar com `jest.clearAllMocks()`
   - Usar `jest.fn()` para spies
   - Mockar dependências externas

---

## 📊 Métricas de Sucesso

### KPIs
- ✅ Cobertura de statements: 100%
- ✅ Cobertura de branches: 100%
- ✅ Cobertura de functions: 100%
- ✅ Cobertura de lines: 100%
- ✅ Todos os tests passando
- ✅ Tempo de execução < 60s

### Checklist de Qualidade
- [ ] Todos os controllers testados
- [ ] Todos os services testados
- [ ] Todos os repositories testados
- [ ] Todos os middlewares testados
- [ ] Validators cobertos
- [ ] Edge cases cobertos
- [ ] Errors handlers testados
- [ ] Integração entre camadas testada

---

## 🚀 Ordem de Execução

### Semana 1 - Repositories (Foundation)
1. MongoProductRepository ⭐ **CRÍTICO**
2. MongoOrderRepository
3. MongoPaymentRepository
4. MongoUserRepository
5. MongoCashRegisterRepository

### Semana 2 - Controllers (Integration)
1. PasswordResetController
2. ReportController
3. SicrediController

### Semana 3 - Services & Middlewares
1. SicrediService
2. authMiddleware
3. roleMiddleware
4. errorMiddleware

### Semana 4 - Validators & Refinement
1. Validators
2. Aumentar cobertura de branches
3. Edge cases
4. Performance tests

---

## 📝 Comandos Úteis

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm test -- --coverage

# Executar testes específicos
npm run test:product
npm run test:order
npm run test:payment

# Executar em watch mode
npm run test:watch

# Ver cobertura HTML
npm test -- --coverage --coverageReporters=html
# Abrir coverage/index.html
```

---

## 🎯 Resultado Esperado

Ao final da implementação desta estratégia:
- ✅ **100% de cobertura** em todas as métricas
- ✅ **Confiança total** no código
- ✅ **Refatoração segura** 
- ✅ **CI/CD confiável**
- ✅ **Documentação viva** via testes
- ✅ **Menos bugs em produção**

---

## 📚 Referências

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Data de Criação:** 10/10/2025  
**Última Atualização:** 10/10/2025  
**Status:** 🟡 Em Progresso

