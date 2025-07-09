# Atualização de Design das Tabelas

## Objetivo
Aplicar o mesmo padrão de design da página de pagamentos às tabelas de clientes, pedidos e meus pedidos, com cabeçalho da tabela colado aos filtros e mesmo background.

## Mudanças Implementadas

### Padrão de Design Aplicado
- **Card wrapper**: Todas as tabelas foram envolvidas em um `Card` component
- **CardHeader**: Com `bg-gray-100 dark:bg-slate-800/50` e título da seção
- **Filtros integrados**: Busca e filtros básicos ficam dentro do `CardHeader`
- **CardContent**: Com `p-0` para remover padding interno
- **Cabeçalho colado**: O cabeçalho da tabela fica "colado" aos filtros sem espaçamento

### Componentes Criados

#### 1. CustomerTableWithFilters
- **Arquivo**: `apps/web/components/customers/CustomerTableWithFilters.tsx`
- **Funcionalidade**: Une filtros e tabela de clientes em um único card
- **Características**:
  - Input de busca com ícone de lupa
  - Select para categoria de cliente
  - Botões de filtros avançados, exportar e novo cliente
  - Tabela integrada usando `CustomerTableSection`

#### 2. OrdersTableWithFilters
- **Arquivo**: `apps/web/components/orders/OrdersTableWithFilters.tsx`
- **Funcionalidade**: Une filtros e tabela de pedidos em um único card
- **Características**:
  - Input de busca por cliente, CPF ou O.S.
  - Select para status do pedido com ícones
  - Botões de filtros avançados, exportar e novo pedido
  - Integração com `OrdersContent`

#### 3. MyOrdersTableWithFilters
- **Arquivo**: `apps/web/components/orders/MyOrdersTableWithFilters.tsx`
- **Funcionalidade**: Une filtros e tabela "Meus Pedidos" em um único card
- **Características**:
  - Comportamento diferenciado para clientes vs funcionários
  - **Funcionários**: Card completo com filtros e título com ícone
  - **Clientes**: Título simples fora do card
  - Integração com `MyOrdersContent`

### Páginas Atualizadas

#### 1. Página de Clientes (`apps/web/app/(authenticated)/customers/page.tsx`)
- Substituição de `CustomerFiltersSection` e `CustomerTableSection`
- Uso do novo `CustomerTableWithFilters`

#### 2. Página de Pedidos (`apps/web/app/(authenticated)/orders/page.tsx`)
- Substituição de `OrdersFiltersSection` e `OrdersContent`
- Uso do novo `OrdersTableWithFilters`

#### 3. Página Meus Pedidos (`apps/web/app/(authenticated)/my-orders/page.tsx`)
- Substituição de `MyOrdersFiltersSection`, `MyOrdersTitle` e `MyOrdersContent`
- Uso do novo `MyOrdersTableWithFilters`

## Estrutura Visual Resultante

```
Card
├── CardHeader (bg-gray-100 dark:bg-slate-800/50)
│   ├── CardTitle (título da seção)
│   └── Filtros e Busca
│       ├── Input de busca
│       ├── Selects de filtro
│       └── Botões de ação
├── Filtros Avançados (se expandidos)
└── CardContent (p-0)
    └── Tabela + Paginação
```

## Benefícios
- **Consistência visual**: Todas as tabelas seguem o mesmo padrão
- **Experiência unificada**: Mesmo comportamento em todas as páginas
- **Design limpo**: Cabeçalho colado aos filtros sem espaçamentos extras
- **Responsividade**: Filtros se adaptam a diferentes tamanhos de tela
- **Acessibilidade**: Melhora na navegação e uso
- **Melhorias visuais**: Ícones adicionados aos filtros de categoria para melhor identificação

## Correções Aplicadas
### Filtro de Categoria - Página de Clientes
- **Problema**: Filtro aparecia vazio ao carregar a página
- **Solução**: Ajustado valor padrão de "all" para "todos"
- **Melhorias**: Adicionados ícones coloridos para cada categoria:
  - **Todas as categorias**: Ícone Grid3X3 (cinza)
  - **VIP**: Ícone Crown (roxo)
  - **Premium**: Ícone Star (azul)
  - **Regular**: Ícone User (verde)

### Filtro de Status - Página de Meus Pedidos
- **Melhoria**: Adicionados ícones coloridos para cada status (similar à página de pedidos):
  - **Todos os status**: Ícone Clock (cinza)
  - **Pendente**: Ícone Clock (amarelo)
  - **Em produção**: Ícone Settings (laranja)
  - **Pronto**: Ícone Box (verde)
  - **Entregue**: Ícone Truck (azul)
  - **Cancelado**: Ícone XCircle (vermelho) 