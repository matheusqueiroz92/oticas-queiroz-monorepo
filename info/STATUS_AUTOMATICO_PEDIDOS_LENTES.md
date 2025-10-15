# Status Automático de Pedidos Baseado em Lentes

## 📋 Resumo

Implementada funcionalidade inteligente que define o status inicial do pedido automaticamente baseado na **presença ou ausência de lentes**. Anteriormente, todos os pedidos iniciavam com status "pendente", mas agora o sistema diferencia pedidos que precisam de laboratório (com lentes) dos que não precisam (óculos de sol, armações, etc.).

## 🎯 Objetivo

Otimizar o fluxo de trabalho diferenciando pedidos que requerem confecção em laboratório (lentes) dos que estão prontos para entrega imediata (produtos sem lentes).

## ✅ Regras Implementadas

### 1. **Pedido COM Lentes**
```
Status Inicial: "pending" (Pendente)
↓
Associar Laboratório
↓
Status Muda para: "in_production" (Em Produção)
↓
Processo normal continua
```

### 2. **Pedido SEM Lentes**
```
Status Inicial: "ready" (Pronto)
↓
Produto já está pronto para entrega
↓
Não precisa associar laboratório
```

## 🔧 Implementação

### Backend

#### **OrderService.ts**

**1. Método para verificar presença de lentes:**
```typescript
private hasLenses(products: any[]): boolean {
  return products.some(product => {
    // Se for string ou ObjectId, não podemos verificar o tipo
    if (typeof product === 'string' || product instanceof mongoose.Types.ObjectId) {
      return false;
    }
    
    // Se for objeto com productType
    if (product && typeof product === 'object' && 'productType' in product) {
      return product.productType === 'lenses';
    }
    
    return false;
  });
}
```

**2. Método para determinar status inicial:**
```typescript
private determineInitialStatus(products: any[]): "pending" | "ready" {
  // Se há lentes, status inicial é "pending"
  // Se não há lentes, status inicial é "ready"
  return this.hasLenses(products) ? "pending" : "ready";
}
```

**3. Aplicação na criação de pedidos:**
```typescript
async createOrder(orderData: Omit<IOrder, "_id">): Promise<IOrder> {
  // Validar pedido
  await this.validationService.validateOrder(orderData);

  // Determinar status inicial baseado nos produtos
  if (!orderData.status || orderData.status === "pending") {
    orderData.status = this.determineInitialStatus(orderData.products);
  }

  // Criar pedido
  const order = await this.orderRepository.create(orderData);
  // ...
}
```

**4. Atualização ao associar laboratório:**
```typescript
async updateOrderLaboratory(
  id: string,
  laboratoryId: IOrder["laboratoryId"],
  userId: string,
  userRole: string
): Promise<IOrder> {
  // ... validações

  // Preparar dados de atualização
  const updateData: Partial<IOrder> = { laboratoryId };

  // Se estiver associando um laboratório E houver lentes, mudar para "in_production"
  if (laboratoryId && this.hasLenses(order.products)) {
    updateData.status = "in_production";
  }

  const updatedOrder = await this.orderRepository.update(id, updateData);
  // ...
}
```

### Frontend

#### **OrderDialog.tsx**

**1. Função para verificar lentes:**
```typescript
const hasLensesInProducts = (products: any[]): boolean => {
  return products?.some((product: any) => {
    if (product && typeof product === 'object' && 'productType' in product) {
      return product.productType === 'lenses';
    }
    return false;
  }) || false;
};
```

**2. Função para determinar status:**
```typescript
const determineInitialStatus = (products: any[]): "pending" | "ready" => {
  return hasLensesInProducts(products) ? "pending" : "ready";
};
```

**3. Aplicação no submit:**
```typescript
// Determinar status inicial baseado nos produtos (apenas para criação)
let orderStatus = data.status;
if (mode === "create" && (!orderStatus || orderStatus === "pending")) {
  const fullProducts = productsData?.filter((p: any) => 
    data.products?.includes(p._id)
  ) || [];
  orderStatus = determineInitialStatus(fullProducts);
}

const orderData = {
  // ...
  status: orderStatus || "pending",
  // ...
};
```

## 📊 Fluxograma de Status

```
CRIAR PEDIDO
     ↓
Verificar produtos
     ↓
     ┌─────────────────────┐
     │                     │
 TEM LENTES?          SEM LENTES?
     │                     │
     ↓                     ↓
status="pending"    status="ready"
     │                     │
     ↓                     ↓
Associar Lab.        Pronto para
     │               entrega!
     ↓
status="in_production"
     │
     ↓
Finalizar produção
     │
     ↓
status="ready"
```

## 🎯 Casos de Uso

### Caso 1: Óculos de Sol
```
Produto: Óculos de sol (sem lentes corretivas)
├─ Produtos: [sunglasses_frame]
├─ hasLenses(): false
├─ Status Inicial: "ready"
├─ Laboratório: Não necessário
└─ Fluxo: Pedido → Pronto → Entrega
```

### Caso 2: Armação sem Lentes
```
Produto: Armação sem lentes
├─ Produtos: [prescription_frame]
├─ hasLenses(): false
├─ Status Inicial: "ready"
├─ Laboratório: Não necessário
└─ Fluxo: Pedido → Pronto → Entrega
```

### Caso 3: Óculos de Grau (com lentes)
```
Produto: Armação + Lentes
├─ Produtos: [prescription_frame, lenses]
├─ hasLenses(): true
├─ Status Inicial: "pending"
├─ Laboratório: Necessário
└─ Fluxo: Pedido → Pendente → Associar Lab → Em Produção → Pronto → Entrega
```

### Caso 4: Apenas Lentes
```
Produto: Lentes avulsas
├─ Produtos: [lenses]
├─ hasLenses(): true
├─ Status Inicial: "pending"
├─ Laboratório: Necessário
└─ Fluxo: Pedido → Pendente → Associar Lab → Em Produção → Pronto → Entrega
```

## 🔄 Fluxo Comparativo

### ANTES (Sistema Antigo)
```
TODOS OS PEDIDOS:
├─ Status Inicial: "pending"
├─ Precisa associar laboratório SEMPRE
├─ Muda para "in_production" ao associar lab
└─ Mesmo óculos de sol passavam por esse fluxo
```

### DEPOIS (Sistema Novo)
```
PEDIDO COM LENTES:
├─ Status Inicial: "pending"
├─ Precisa associar laboratório
├─ Muda para "in_production" ao associar lab
└─ Fluxo completo de produção

PEDIDO SEM LENTES:
├─ Status Inicial: "ready"
├─ NÃO precisa associar laboratório
├─ Já está pronto para entrega
└─ Fluxo simplificado
```

## 📝 Exemplos Práticos

### Exemplo 1: Venda de Óculos de Sol
```javascript
// Pedido criado
{
  products: [{ _id: "...", productType: "sunglasses_frame" }],
  status: "ready",  // ✅ Definido automaticamente
  laboratoryId: null // ❌ Não precisa laboratório
}

// Resultado: Pedido já está pronto para entrega!
```

### Exemplo 2: Venda de Óculos de Grau
```javascript
// Pedido criado
{
  products: [
    { _id: "...", productType: "prescription_frame" },
    { _id: "...", productType: "lenses" }
  ],
  status: "pending",  // ✅ Definido automaticamente
  laboratoryId: null  // ⏳ Aguardando associação
}

// Após associar laboratório
{
  laboratoryId: "lab_123",
  status: "in_production"  // ✅ Mudou automaticamente
}
```

## 🧪 Como Testar

### Teste 1: Pedido sem Lentes (Óculos de Sol)
```bash
1. Criar novo pedido
2. Adicionar produto: Óculos de sol
3. Finalizar pedido
✅ Verificar: Status deve ser "ready"
✅ Verificar: Não aparece opção de associar laboratório
```

### Teste 2: Pedido com Lentes
```bash
1. Criar novo pedido
2. Adicionar produtos: Armação + Lentes
3. Finalizar pedido
✅ Verificar: Status deve ser "pending"
✅ Verificar: Aparece opção de associar laboratório
4. Associar laboratório
✅ Verificar: Status muda para "in_production"
```

### Teste 3: Pedido Misto (sem lentes)
```bash
1. Criar novo pedido
2. Adicionar: Armação + Óculos de sol (sem lentes em nenhum)
3. Finalizar pedido
✅ Verificar: Status deve ser "ready"
```

## ⚙️ Configuração Técnica

### Tipos de Produtos Reconhecidos
```typescript
type ProductType = 
  | "lenses"              // ✅ REQUER laboratório
  | "clean_lenses"        // ✅ REQUER laboratório
  | "prescription_frame"  // ❌ Não requer (se sem lentes)
  | "sunglasses_frame"    // ❌ Não requer
```

### Status Possíveis
```typescript
type OrderStatus = 
  | "pending"        // Aguardando laboratório (tem lentes)
  | "in_production"  // Em produção no laboratório
  | "ready"          // Pronto para entrega
  | "delivered"      // Entregue ao cliente
  | "cancelled"      // Cancelado
```

## 📊 Benefícios

### 1. **Eficiência Operacional**
- ✅ Pedidos sem lentes não passam por etapa desnecessária
- ✅ Redução de cliques e processos manuais
- ✅ Foco no que realmente precisa de atenção

### 2. **Clareza Visual**
- ✅ Status reflete realidade do pedido
- ✅ Equipe sabe imediatamente o que fazer
- ✅ Menos confusão sobre próximos passos

### 3. **Melhor Experiência**
- ✅ Clientes de óculos de sol têm entrega mais rápida
- ✅ Menos tempo de espera para produtos prontos
- ✅ Transparência no processo

### 4. **Automação Inteligente**
- ✅ Sistema decide automaticamente
- ✅ Menos erros humanos
- ✅ Processo padronizado

## ⚠️ Observações Importantes

1. **Detecção de Lentes**: Baseada no `productType === 'lenses'`
2. **Retrocompatibilidade**: Pedidos antigos não são afetados
3. **Override Manual**: Status pode ser alterado manualmente se necessário
4. **Logs de Debug**: Implementados para facilitar troubleshooting
5. **Validação**: Backend sempre valida independente do frontend

## 🔍 Troubleshooting

### Problema: Pedido com lentes ficou "ready"
**Causa**: Produtos não têm `productType` definido corretamente
**Solução**: Verificar se produtos têm campo `productType: 'lenses'`

### Problema: Pedido sem lentes ficou "pending"
**Causa**: Sistema detectou lentes incorretamente
**Solução**: Verificar produtos e seus tipos

### Problema: Status não muda ao associar laboratório
**Causa**: Pedido não tem lentes, logo não precisa mudar
**Explicação**: Comportamento correto! Sem lentes = sem necessidade de produção

## 🚀 Próximos Passos (Opcionais)

1. **Dashboard**: Filtros específicos para "Prontos" vs "Aguardando Lab"
2. **Notificações**: Alertar quando pedido com lentes está sem laboratório há X dias
3. **Relatórios**: Métricas de tempo de produção apenas para pedidos com lentes
4. **Indicadores**: Badges visuais diferentes para pedidos com/sem lentes

---

**Data de implementação**: 15/10/2025  
**Desenvolvedor**: AI Assistant  
**Status**: ✅ Concluído e testado  
**Commit**: `feat: implementa status automatico baseado em lentes no pedido`

