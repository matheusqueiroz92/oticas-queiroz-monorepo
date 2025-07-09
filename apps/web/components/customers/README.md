# Arquitetura da Página de Clientes

Esta página foi refatorada seguindo os princípios SOLID e o Composition Pattern para melhorar a manutenibilidade e organização do código.

## Princípios Aplicados

### 1. Single Responsibility Principle (SRP)
Cada componente e hook tem uma responsabilidade específica:

- **`CustomerStatsCards`**: Responsável apenas pela exibição dos cards de estatísticas
- **`CustomerFiltersSection`**: Gerencia apenas a seção de filtros e busca
- **`CustomerTableSection`**: Responsável apenas pela exibição da tabela
- **`CustomerDialogs`**: Gerencia apenas os diálogos de criação/edição

### 2. Composition Pattern
A página principal (`page.tsx`) é composta por componentes menores, cada um com sua responsabilidade específica.

## Estrutura de Componentes

```
CustomersPage
├── CustomerStatsCards
├── CustomerFiltersSection
├── CustomerTableSection
└── CustomerDialogs
```

## Hooks Personalizados

### `useCustomerPageState`
Gerencia todo o estado local da página:
- Estados de diálogos (aberto/fechado)
- Cliente sendo editado
- Estados de filtros locais
- Ações para manipular esses estados

### `useCustomerFilters`
Gerencia a lógica de filtros:
- Aplicação de filtros básicos
- Limpeza de filtros
- Transformação de dados de filtros

### `useCustomers`
Hook original que gerencia dados e estado dos clientes (mantido como estava).

### `useCustomerUtils`
Hook utilitário para cálculos (mantido como estava).

## Utilitários

### `customer-table-config.tsx`
Contém a configuração das colunas da tabela, mantendo a lógica de renderização separada.

## Benefícios da Refatoração

1. **Manutenibilidade**: Cada componente é independente e fácil de manter
2. **Testabilidade**: Componentes menores são mais fáceis de testar
3. **Reutilização**: Componentes podem ser reutilizados em outras páginas
4. **Legibilidade**: Código mais limpo e organizado
5. **Separation of Concerns**: Cada arquivo tem uma responsabilidade específica

## Exemplo de Uso

```tsx
// A página principal agora é muito mais limpa e focada na composição
export default function CustomersPage() {
  // Hooks para gerenciar estado
  const { state, actions } = useCustomerPageState();
  const { calculateCustomerStats } = useCustomerUtils();
  
  // Dados dos clientes
  const { customers, isLoading, ... } = useCustomers();
  
  // Lógica de filtros
  const { handleUpdateFilters, ... } = useCustomerFilters(...);

  return (
    <PageContainer>
      <CustomerStatsCards {...statsProps} />
      <CustomerFiltersSection {...filterProps} />
      <CustomerTableSection {...tableProps} />
      <CustomerDialogs {...dialogProps} />
    </PageContainer>
  );
}
```

Esta arquitetura torna o código mais escalável e fácil de manter, seguindo as melhores práticas de desenvolvimento React. 