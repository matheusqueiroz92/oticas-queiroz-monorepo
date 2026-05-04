# 🎯 Plano para Alcançar 100% de Cobertura de Testes
## Backend - Sistema Óticas Queiroz

**Data:** 16/10/2025  
**Status Atual:** 83% dos testes passando (1.138/1.373)  
**Meta:** 100% dos testes passando com 100% de cobertura

---

## 📊 Situação Atual

```
╔════════════════════════════════════════════╗
║  STATUS GERAL DOS TESTES                   ║
╠════════════════════════════════════════════╣
║  ✅ Passando: 1.138 (83%)                  ║
║  ❌ Falhando: 235 (17%)                    ║
║  📊 Total: 1.373 testes                    ║
║                                            ║
║  ✅ Suites OK: 27 (60%)                    ║
║  ❌ Suites com problemas: 18 (40%)         ║
║  📊 Total Suites: 45                       ║
╚════════════════════════════════════════════╝
```

---

## ✅ O Que Já Está 100% Funcional

### Repositories (139 testes)

```
✅ MongoProductRepository
   • 34 testes - 100% passando
   • Cobertura: ~90%
   • Status: PRONTO

✅ MongoUserRepository
   • 48 testes - 100% passando
   • Cobertura: ~85%
   • Status: PRONTO

✅ MongoPaymentRepository
   • 18 testes - 100% passando
   • Cobertura: ~90%
   • Status: PRONTO

🟡 MongoOrderRepository
   • 39 testes - 27 passando (69%)
   • 12 testes falhando
   • Cobertura: ~70%
   • Status: PRECISA CORREÇÃO
```

### Controllers (170 testes)

```
✅ PasswordResetController
   • 42 testes - 100% passando
   • Cobertura: ~95%
   • Status: EXCELENTE

✅ ReportController
   • 62 testes - 100% passando
   • Cobertura: ~85%
   • Status: EXCELENTE

✅ SicrediSyncController
   • 66 testes - 100% passando
   • Cobertura: ~90%
   • Status: EXCELENTE
```

### Services (52 testes)

```
✅ SicrediSyncService
   • 52 testes - 100% passando
   • Cobertura: ~85%
   • Status: EXCELENTE
```

---

## ❌ O Que Precisa de Trabalho

### GRUPO 1: Testes Desatualizados (APIs Antigas)

```
❌ OrderModel.test.ts
   Problemas:
   - Campo 'addition' mudou de number para string
   Status: 50% corrigido

❌ LegacyClientModel.test.ts  
   Problemas:
   - Métodos não existem: recordPayment, addPayment
   - API foi completamente refatorada
   Status: 30% corrigido
   
❌ CashRegisterModel.test.ts
   Problemas:
   - Métodos não existem: addMovement, getSummary
   - updateSalesAndPayments tem assinatura diferente
   Status: 40% corrigido
```

### GRUPO 2: Problemas de Configuração

```
❌ ReportService.test.ts
   Problema: setTimeout causando erros assíncronos
   Causa: this.reportModel undefined em setTimeout
   Correção: Adicionar guard ou refatorar lógica
   
❌ MercadoPagoService.test.ts
   Problema: Cannot find module 'mercadoPagoDirectApi'
   Causa: Arquivo não existe ou caminho errado
   Correção: Verificar se existe ou remover mock
```

### GRUPO 3: Controllers Afetados pelo setTimeout

```
❌ 9 Controllers com falhas
   - AuthController
   - ProductController
   - LaboratoryController
   - PaymentController
   - LegacyClientController
   - UserController
   - OrderController
   - CashRegisterController
   - InstitutionController
   
   Causa: ReportService.setTimeout executando em testes
   Correção: Corrigir ReportService resolve todos
```

---

## 🎯 Plano de Ação Estruturado

### FASE 1: Correções Críticas (2-3 horas)

```
PRIORIDADE ALTA - Corrigir setTimeout

1️⃣  ReportService.ts
    ├─ Adicionar guard: if (process.env.NODE_ENV !== 'test')
    ├─ Ou remover setTimeout dos testes
    └─ Isso resolve 9 controllers automaticamente!

2️⃣  MercadoPagoService.test.ts
    ├─ Verificar se arquivo existe
    ├─ Corrigir path ou remover mock
    └─ Ou adicionar // @ts-nocheck temporário

RESULTADO ESPERADO:
• De 1.138 para ~1.300 testes passando
• De 83% para ~95% de sucesso
```

### FASE 2: Refatorar Models (4-6 horas)

```
REFATORAÇÃO COMPLETA

3️⃣  LegacyClientModel.test.ts
    ├─ Identificar métodos que existem
    ├─ Remover testes de métodos inexistentes
    ├─ Ou implementar métodos faltantes
    └─ Reescrever testes com API atual

4️⃣  CashRegisterModel.test.ts
    ├─ Mapear métodos reais do model
    ├─ Ajustar chamadas de métodos
    ├─ Corrigir assinaturas
    └─ Validar retornos esperados

5️⃣  OrderModel.test.ts
    ├─ Corrigir tipos (addition: string)
    ├─ Validar outros campos
    └─ Garantir conformidade com schema

RESULTADO ESPERADO:
• Todos os Models testados corretamente
• ~80-100 testes adicionais passando
```

### FASE 3: Aumentar Cobertura (3-4 horas)

```
COBERTURA 100%

6️⃣  MongoOrderRepository
    ├─ Corrigir 12 testes falhando
    ├─ Validações de schema
    ├─ Dados de teste válidos
    └─ 69% → 100% de testes passando

7️⃣  Aumentar cobertura dos Repositories
    ├─ MongoProductRepository: 90% → 100%
    ├─ MongoUserRepository: 85% → 100%
    ├─ MongoPaymentRepository: 90% → 100%
    └─ Testar branches não cobertos

8️⃣  Aumentar cobertura dos Controllers
    ├─ PasswordResetController: 95% → 100%
    ├─ ReportController: 85% → 100%
    ├─ SicrediSyncController: 90% → 100%
    └─ Testar edge cases

9️⃣  Aumentar cobertura dos Services
    ├─ SicrediSyncService: 85% → 100%
    └─ Testar fluxos alternativos

RESULTADO ESPERADO:
• 100% de cobertura em código crítico
• Branches, statements, functions, lines todos 100%
```

### FASE 4: Validação Final (1 hora)

```
TESTES FINAIS

🔟  Executar suite completa
    ├─ npm test -- --coverage
    ├─ Verificar relatório HTML
    ├─ Confirmar 100% em todos os arquivos
    └─ Gerar relatório final

RESULTADO FINAL:
• 1.373 (ou mais) testes passando
• 100% de cobertura de código
• 0 testes falhando
• Documentação de cobertura gerada
```

---

## 🛠️ Comandos Úteis

### Testar Grupos Específicos

```bash
# Apenas Repositories
npm test -- --testPathPattern="Repository" --coverage

# Apenas Controllers
npm test -- --testPathPattern="Controller" --coverage

# Apenas Services
npm test -- --testPathPattern="Service" --coverage

# Apenas Models
npm test -- --testPathPattern="Model" --coverage

# Teste específico
npm test -- --testPathPattern="MongoOrderRepository" --coverage
```

### Gerar Relatórios

```bash
# Cobertura completa
npm test -- --coverage --coverageReporters=html text

# Ver no navegador
start coverage/lcov-report/index.html

# Apenas texto
npm test -- --coverage --coverageReporters=text
```

---

## 📋 Checklist de Progresso

### Correções Aplicadas

- [x] app.ts: setTimeout apenas fora de testes
- [x] OrderModel.test.ts: campo addition corrigido
- [ ] LegacyClientModel.test.ts: métodos atualizados
- [ ] CashRegisterModel.test.ts: API atualizada
- [ ] ReportService: setTimeout corrigido
- [ ] MercadoPagoService: módulo encontrado
- [ ] MongoOrderRepository: 12 testes corrigidos

### Cobertura por Módulo

- [ ] MongoProductRepository: 100%
- [ ] MongoUserRepository: 100%
- [ ] MongoPaymentRepository: 100%
- [ ] MongoOrderRepository: 100%
- [ ] PasswordResetController: 100%
- [ ] ReportController: 100%
- [ ] SicrediSyncController: 100%
- [ ] SicrediSyncService: 100%

---

## ⏱️ Estimativa de Tempo

| Fase | Tarefa | Tempo Estimado |
|------|--------|----------------|
| **Fase 1** | Correções Críticas | 2-3 horas |
| **Fase 2** | Refatorar Models | 4-6 horas |
| **Fase 3** | Aumentar Cobertura | 3-4 horas |
| **Fase 4** | Validação Final | 1 hora |
| **TOTAL** | | **10-14 horas** |

---

## 💡 Recomendações

### Para Esta Sessão

Dado que já trabalhamos bastante hoje, recomendo:

```
OPÇÃO A (Pragmática):
• Commitar o progresso atual
• Documentar o plano (este arquivo)
• Retomar em outra sessão
• Trabalho focado e organizado

OPÇÃO B (Continuar):
• Seguir com Fase 1 agora
• Corrigir setTimeout (resolve 9 controllers)
• Tempo: mais 2-3 horas
• Grandes ganhos rápidos
```

### Para Próximas Sessões

```
SESSÃO 1: Fase 1 - Correções Críticas
• ReportService setTimeout
• MercadoPagoService módulo
• ~200 testes adicionais passando

SESSÃO 2: Fase 2 - Refatorar Models
• LegacyClientModel
• CashRegisterModel
• OrderModel
• ~80-100 testes corrigidos

SESSÃO 3: Fase 3 - Cobertura 100%
• Aumentar cobertura de todos
• Testar edge cases
• Branches não cobertos

SESSÃO 4: Fase 4 - Validação
• Executar suite completa
• Gerar relatórios
• Documentar resultados
```

---

## 🎯 Meta Final

```
╔════════════════════════════════════════════╗
║  OBJETIVO: 100% DE COBERTURA               ║
╠════════════════════════════════════════════╣
║  • 1.400+ testes passando                  ║
║  • 0 testes falhando                       ║
║  • 100% statements                         ║
║  • 100% branches                           ║
║  • 100% functions                          ║
║  • 100% lines                              ║
║                                            ║
║  Código crítico totalmente testado!        ║
╚════════════════════════════════════════════╝
```

---

**Status Atual:** Work in Progress (WIP)  
**Próxima Etapa:** Fase 1 - Correções Críticas  
**Desenvolvedor:** Retomar quando tiver tempo dedicado

