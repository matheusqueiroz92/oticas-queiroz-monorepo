# Guia de Migração - DataTableWithFilters

Este guia explica como migrar as páginas existentes para usar o novo componente genérico `DataTableWithFilters`.

## Páginas Identificadas para Migração

### ✅ Páginas com Padrão Similar
- [x] `/customers` - Lista de Clientes
- [x] `/orders` - Todos os Pedidos  
- [x] `/my-orders` - Meus Pedidos
- [x] `/products` - Produtos
- [x] `/payments` - Pagamentos
- [x] `/employees` - Funcionários
- [x] `/laboratories` - Laboratórios
- [x] `/institutions` - Instituições
- [x] `/legacy-clients` - Clientes Legados

### 🔄 Páginas com Variações Menores
- [ ] `/reports` - Relatórios (estrutura ligeiramente diferente)
- [ ] `/cash-register` - Caixa (estrutura específica)
- [ ] `/checks` - Cheques (estrutura específica)

## Passos para Migração

### 1. Analisar a Página Atual

Identificar os elementos comuns:
```tsx
// Estrutura típica encontrada
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Barra de busca */}
      <Input placeholder="Buscar..." />
      
      {/* Filtros básicos */}
      <Select>...</Select>
      
      {/* Botões de ação */}
      <Button>Filtros Avançados</Button>
      <Button>Exportar</Button>
      <Button>Novo Item</Button>
    </div>
  </CardHeader>
  
  {/* Filtros avançados */}
  {showFilters && <AdvancedFilters />}
  
  {/* Conteúdo da tabela */}
  <CardContent>
    <TableContent />
  </CardContent>
</Card>
```

### 2. Criar Versão Refatorada

#### 2.1. Configurar Filtros Básicos

```tsx
// Exemplo para pedidos
const statusFilterOptions: FilterOption[] = [
  {
    value: "todos",
    label: "Todos os Status",
    icon: <Clock className="w-4 h-4 text-gray-500" />
  },
  {
    value: "pending",
    label: "Pendente", 
    icon: <Clock className="w-4 h-4 text-yellow-500" />
  }
];

const basicFilters = [
  {
    options: statusFilterOptions,
    value: selectedStatus,
    onChange: setSelectedStatus,
    placeholder: "Status do pedido",
    width: "w-[180px]"
  }
];
```

#### 2.2. Usar o Componente Genérico

```tsx
<DataTableWithFilters
  title="Lista de Pedidos"
  searchPlaceholder="Buscar por cliente, CPF ou O.S."
  searchValue={search}
  onSearchChange={setSearch}
  basicFilters={basicFilters}
  showFilters={showFilters}
  onToggleFilters={toggleFilters}
  activeFiltersCount={activeFiltersCount}
  advancedFiltersComponent={
    <OrderFilters onUpdateFilters={updateFilters} />
  }
  onNewItem={handleNewOrder}
  newButtonText="Novo Pedido"
  onExport={handleExport}
  exportDisabled={isLoading || orders.length === 0}
>
  <OrdersContent
    orders={orders}
    isLoading={isLoading}
    // ... outras props
  />
</DataTableWithFilters>
```

### 3. Testar a Funcionalidade

1. **Testar busca**: Verificar se a busca funciona corretamente
2. **Testar filtros básicos**: Verificar se os selects funcionam
3. **Testar filtros avançados**: Verificar se expande/contrai
4. **Testar botões**: Verificar se "Novo" e "Exportar" funcionam
5. **Testar responsividade**: Verificar em mobile/desktop

### 4. Substituir Componente Antigo

```tsx
// ANTES
import { CustomerTableWithFilters } from "@/components/customers/CustomerTableWithFilters";

// DEPOIS  
import { CustomerTableWithFiltersRefactored } from "@/components/customers/CustomerTableWithFiltersRefactored";
```

### 5. Remover Código Duplicado

Após confirmar que tudo funciona:
1. Deletar o componente antigo
2. Renomear o componente refatorado
3. Atualizar imports

## Exemplos de Migração

### ✅ Clientes (Concluído)
- **Arquivo**: `CustomerTableWithFiltersRefactored.tsx`
- **Redução**: ~70% menos código
- **Status**: Pronto para uso

### ✅ Pedidos (Concluído)
- **Arquivo**: `OrdersTableWithFiltersRefactored.tsx`
- **Redução**: ~75% menos código
- **Status**: Pronto para uso

### ✅ Produtos (Concluído)
- **Arquivo**: `ProductsTableWithFiltersRefactored.tsx`
- **Redução**: ~80% menos código
- **Status**: Pronto para uso

### ✅ Pagamentos (Concluído)
- **Arquivo**: `PaymentsTableWithFiltersRefactored.tsx`
- **Redução**: ~65% menos código
- **Status**: Pronto para uso

## Benefícios da Migração

### 📊 Redução de Código
- **Antes**: ~200-300 linhas por componente
- **Depois**: ~50-80 linhas por componente
- **Economia**: ~70-80% menos código

### 🎨 Consistência Visual
- Todas as páginas seguem o mesmo padrão
- Mudanças de design centralizadas
- Melhor experiência do usuário

### 🔧 Manutenibilidade
- Mudanças em um lugar só
- Menos bugs por duplicação
- Mais fácil de testar

### ⚡ Performance
- Menos código para carregar
- Componentes mais leves
- Melhor tree-shaking

## Checklist de Migração

- [ ] Analisar estrutura atual
- [ ] Identificar filtros básicos
- [ ] Configurar `basicFilters`
- [ ] Criar componente refatorado
- [ ] Testar funcionalidade
- [ ] Testar responsividade
- [ ] Substituir componente antigo
- [ ] Remover código duplicado
- [ ] Atualizar documentação

## Próximos Passos

1. **Migrar páginas restantes**: `/reports`, `/cash-register`, `/checks`
2. **Criar testes**: Testes unitários para o componente genérico
3. **Otimizar**: Melhorar performance se necessário
4. **Documentar**: Atualizar documentação da API

## Suporte

Para dúvidas sobre a migração:
1. Verificar exemplos em `components/[module]/[Module]TableWithFiltersRefactored.tsx`
2. Consultar documentação em `components/ui/README_DataTableWithFilters.md`
3. Verificar tipos em `components/ui/data-table-with-filters.tsx` 