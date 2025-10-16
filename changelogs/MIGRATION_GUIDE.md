# 📋 Guia de Migração para Repository Pattern

## 🎯 Objetivo
Este guia orienta desenvolvedores sobre como usar os novos services refatorados e como migrar código existente para usar o Repository Pattern implementado.

---

## 🔄 Serviços Refatorados

### ✅ LaboratoryService
**Antes (usando Model diretamente):**
```typescript
import { Laboratory } from '../schemas/LaboratorySchema';

const labs = await Laboratory.find({ isActive: true });
```

**Depois (usando Repository):**
```typescript
import { LaboratoryService } from '../services/LaboratoryService';

const laboratoryService = new LaboratoryService();
const labs = await laboratoryService.getActiveLaboratories(1, 10);
```

**Novos métodos disponíveis:**
- `getActiveLaboratories()` - Busca apenas ativos
- `getInactiveLaboratories()` - Busca apenas inativos
- `searchLaboratories()` - Busca textual
- `getLaboratoriesByCity()` - Filtro por cidade
- `getLaboratoriesByState()` - Filtro por estado
- `getLaboratoriesByContactName()` - Busca por contato

### ✅ CashRegisterService
**Antes:**
```typescript
import { CashRegister } from '../schemas/CashRegisterSchema';

const openRegister = await CashRegister.findOne({ status: 'open' });
```

**Depois:**
```typescript
import { CashRegisterService } from '../services/CashRegisterService';

const cashService = new CashRegisterService();
const openRegister = await cashService.getCurrentRegister();
```

**Benefícios:**
- Validações de negócio automáticas
- Cálculos de resumo inclusos
- Operações atômicas garantidas
- Auditoria completa

### ✅ CounterService
**Antes:**
```typescript
import { Counter } from '../schemas/CounterSchema';

const result = await Counter.findOneAndUpdate(
  { _id: 'serviceOrder' },
  { $inc: { sequence: 1 } },
  { new: true, upsert: true }
);
```

**Depois:**
```typescript
import { CounterService } from '../services/CounterService';

const nextNumber = await CounterService.getNextSequence('serviceOrder');
```

**Compatibilidade:**
- Métodos estáticos mantidos
- Novos métodos de instância adicionados
- Suporte completo a transações

---

## 🏗️ Como Usar os Repositories Diretamente

### 1. Através do RepositoryFactory
```typescript
import { RepositoryFactory } from '../repositories/RepositoryFactory';

const factory = RepositoryFactory.getInstance();
const userRepo = factory.getUserRepository();
const users = await userRepo.findAll();
```

### 2. Através dos Services (Recomendado)
```typescript
import { UserService } from '../services/UserService';

const userService = new UserService();
const users = await userService.getAllUsers();
```

---

## 🔧 Padrões de Uso

### Paginação Padrão
```typescript
// Todos os métodos de busca suportam paginação
const result = await laboratoryService.getAllLaboratories(1, 10);
console.log(result.data); // Array de resultados
console.log(result.total); // Total de registros
console.log(result.totalPages); // Total de páginas
```

### Filtros Avançados
```typescript
// Busca com filtros
const filters = {
  isActive: true,
  city: 'São Paulo',
  state: 'SP'
};
const labs = await laboratoryService.searchLaboratories('termo', 1, 10, filters);
```

### Operações com Transação
```typescript
import mongoose from 'mongoose';

const session = await mongoose.startSession();
try {
  session.startTransaction();
  
  const nextNumber = await CounterService.getNextSequenceWithSession(
    'serviceOrder', 
    session
  );
  
  // Outras operações...
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 📊 Melhores Práticas

### 1. Sempre Use Services ao Invés de Repositories Diretamente
```typescript
// ❌ Evite
const userRepo = RepositoryFactory.getInstance().getUserRepository();

// ✅ Prefira
const userService = new UserService();
```

### 2. Aproveite os Novos Métodos Especializados
```typescript
// ❌ Busca genérica
const users = await userService.getAllUsers();
const activeUsers = users.data.filter(u => u.isActive);

// ✅ Método especializado
const activeUsers = await userService.getActiveUsers();
```

### 3. Use Paginação Sempre
```typescript
// ❌ Sem paginação (pode sobrecarregar)
const allUsers = await userService.getAllUsers();

// ✅ Com paginação
const users = await userService.getAllUsers(1, 20);
```

### 4. Trate Erros Adequadamente
```typescript
try {
  const laboratory = await laboratoryService.createLaboratory(data);
  return { success: true, data: laboratory };
} catch (error) {
  console.error('Erro ao criar laboratório:', error);
  return { success: false, error: error.message };
}
```

---

## 🧪 Exemplos de Teste

### Testando com Mocks
```typescript
// test/services/LaboratoryService.test.ts
import { LaboratoryService } from '../../src/services/LaboratoryService';
import { RepositoryFactory } from '../../src/repositories/RepositoryFactory';

// Mock do repository
const mockLaboratoryRepo = {
  findActive: jest.fn(),
  create: jest.fn(),
  // ... outros métodos
};

// Mock do factory
jest.spyOn(RepositoryFactory, 'getInstance').mockReturnValue({
  getLaboratoryRepository: () => mockLaboratoryRepo
} as any);

describe('LaboratoryService', () => {
  it('deve buscar laboratórios ativos', async () => {
    mockLaboratoryRepo.findActive.mockResolvedValueOnce({
      data: [{ name: 'Lab Teste' }],
      total: 1
    });

    const service = new LaboratoryService();
    const result = await service.getActiveLaboratories(1, 10);

    expect(result.total).toBe(1);
    expect(mockLaboratoryRepo.findActive).toHaveBeenCalledWith(
      { isActive: true }, 
      1, 
      10
    );
  });
});
```

---

## 🚀 Migração de Código Existente

### Passo 1: Identificar Uso Direto de Models
```bash
# Buscar por importações de schemas
grep -r "from.*Schema" src/
```

### Passo 2: Substituir por Services
```typescript
// Antes
import { Laboratory } from '../schemas/LaboratorySchema';

// Depois
import { LaboratoryService } from '../services/LaboratoryService';
```

### Passo 3: Adaptar Chamadas
```typescript
// Antes
const labs = await Laboratory.find({ isActive: true });

// Depois
const laboratoryService = new LaboratoryService();
const labs = await laboratoryService.getActiveLaboratories(1, 100);
```

### Passo 4: Testar Funcionalidade
```typescript
// Criar testes para validar que o comportamento permanece o mesmo
```

---

## 🔍 Troubleshooting

### Erro: "Repository not found"
```typescript
// Verificar se o repository está registrado no factory
const factory = RepositoryFactory.getInstance();
console.log(factory.getRepositories()); // Lista todos os repositories
```

### Erro: "Method not implemented"
```typescript
// Verificar se o método existe na interface
// Alguns métodos podem ter sido renomeados ou removidos
```

### Performance: Consultas Lentas
```typescript
// Usar métodos especializados em vez de filtros genéricos
// Exemplo: use findActive() em vez de findAll() + filter
```

---

## 📚 Referências

- [Repository Pattern Documentation](./README.md)
- [Exemplos de Uso](./examples/)
- [Interfaces de Repositório](./interfaces/)
- [Implementações MongoDB](./implementations/)

---

## ✨ Conclusão

O Repository Pattern implementado no projeto Óticas Queiroz oferece:

- **Melhor Testabilidade**: Fácil mock de dependências
- **Código Mais Limpo**: Separação clara de responsabilidades  
- **Maior Flexibilidade**: Fácil troca de implementação
- **Manutenibilidade**: Código mais organizado e documentado
- **Performance**: Métodos otimizados e cache de instâncias

Siga este guia para migrar seu código existente e aproveitar todos os benefícios da nova arquitetura! 🚀 