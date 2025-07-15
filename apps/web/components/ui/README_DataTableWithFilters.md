# DataTableWithFilters - Componente Genérico

Este componente foi criado para eliminar a duplicação de código nas páginas que possuem tabelas com filtros, barra de busca e botões de ação.

## Estrutura Comum Identificada

Todas as páginas seguem o mesmo padrão:
- **Título** da seção
- **Barra de busca** com ícone
- **Filtros básicos** (selects ao lado da busca)
- **Botões de ação**: Filtros Avançados, Exportar, Novo Item
- **Filtros avançados** (opcional, expandível)
- **Conteúdo da tabela** (loading, erro, dados, paginação)

## Como Usar

### 1. Importar o componente

```tsx
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
```

### 2. Configurar os filtros básicos

```tsx
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

### 3. Usar o componente

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
  {/* Conteúdo da tabela */}
  <OrdersContent
    orders={orders}
    isLoading={isLoading}
    // ... outras props
  />
</DataTableWithFilters>
```

## Props Disponíveis

### Configuração Básica
- `title`: Título da seção
- `searchPlaceholder`: Placeholder da barra de busca
- `searchValue`: Valor atual da busca
- `onSearchChange`: Função para atualizar a busca

### Filtros Básicos
- `basicFilters`: Array de filtros com opções, valor, onChange, placeholder e width

### Filtros Avançados
- `showFilters`: Se deve mostrar os filtros avançados
- `onToggleFilters`: Função para alternar filtros avançados
- `activeFiltersCount`: Número de filtros ativos
- `advancedFiltersComponent`: Componente de filtros avançados

### Botões de Ação
- `onNewItem`: Função para criar novo item
- `newButtonText`: Texto do botão novo
- `newButtonIcon`: Ícone do botão novo (opcional)
- `onExport`: Função para exportar (opcional)
- `exportButtonText`: Texto do botão exportar (opcional)
- `exportDisabled`: Se o botão exportar deve estar desabilitado

### Customização
- `className`: Classes CSS customizadas
- `headerClassName`: Classes CSS do header
- `searchIcon`: Ícone customizado da busca

## Exemplos de Implementação

### Página de Clientes
```tsx
// Ver: components/customers/CustomerTableWithFiltersRefactored.tsx
```

### Página de Pedidos
```tsx
// Ver: components/orders/OrdersTableWithFiltersRefactored.tsx
```

### Página de Produtos
```tsx
// Ver: components/products/ProductsTableWithFiltersRefactored.tsx
```

### Página de Pagamentos
```tsx
// Ver: components/payments/PaymentsTableWithFiltersRefactored.tsx
```

## Benefícios

1. **Redução de código duplicado**: ~80% menos código por página
2. **Consistência visual**: Todas as páginas seguem o mesmo padrão
3. **Manutenibilidade**: Mudanças no layout centralizadas
4. **Flexibilidade**: Fácil customização por página
5. **Reutilização**: Componente pode ser usado em novas páginas

## Migração

Para migrar uma página existente:

1. Criar uma versão refatorada usando `DataTableWithFilters`
2. Testar a funcionalidade
3. Substituir o componente antigo pela versão refatorada
4. Remover o código duplicado

## Estrutura de Arquivos

```
components/ui/
├── data-table-with-filters.tsx          # Componente genérico
└── README_DataTableWithFilters.md       # Esta documentação

components/[module]/
├── [Module]TableWithFilters.tsx         # Versão antiga (duplicada)
└── [Module]TableWithFiltersRefactored.tsx # Versão refatorada
``` 