# 🧩 **ListPageHeader - Composition Pattern**

## **📖 Visão Geral**

O `ListPageHeader` é um componente reutilizável baseado no **Composition Pattern** que elimina duplicação de código entre páginas que possuem estrutura similar de filtros, busca e botões de ação.

## **🚀 Recursos Principais**

- ✅ **Composition Pattern**: Permite customização através de slots/children
- ✅ **Reutilização**: Uma única implementação para múltiplas páginas  
- ✅ **Flexibilidade**: Cada página pode ter seus próprios filtros e botões
- ✅ **TypeScript**: Totalmente tipado para segurança de tipos
- ✅ **Responsivo**: Layout adaptativo para mobile/desktop
- ✅ **Contador de Filtros**: Badge automático mostrando filtros ativos

## **🏗️ Arquitetura**

```
ListPageHeader (Componente Base)
├── SearchInput (Campo de busca reutilizável)
├── FilterSelects (Slot para selects customizados)
├── ActionButtons (Slot para botões de ação)
└── AdvancedFilters (Slot para filtros avançados)
```

## **📋 Como Usar**

### **Importação**
```tsx
import { 
  ListPageHeader, 
  FilterSelects, 
  ActionButtons, 
  AdvancedFilters,
  ListPageContent 
} from "@/components/ui/list-page-header";
```

### **Exemplo Básico**
```tsx
<ListPageHeader
  title="Lista de Produtos"
  searchValue={search}
  searchPlaceholder="Buscar produtos..."
  onSearchChange={setSearch}
  showFilters={showFilters}
  onToggleFilters={() => setShowFilters(prev => !prev)}
  activeFiltersCount={2}
>
  <FilterSelects>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas</SelectItem>
        <SelectItem value="frames">Armações</SelectItem>
      </SelectContent>
    </Select>
  </FilterSelects>

  <ActionButtons>
    <Button variant="outline">Exportar</Button>
    <Button>Novo Produto</Button>
  </ActionButtons>

  <AdvancedFilters>
    <ProductFilters onUpdateFilters={updateFilters} />
  </AdvancedFilters>
</ListPageHeader>

<ListPageContent>
  {/* Conteúdo da lista aqui */}
</ListPageContent>
```

## **🎨 Exemplo Avançado com Título Customizado**

```tsx
<ListPageHeader
  title={
    <div className="flex items-center gap-2">
      <ShoppingCart className="h-5 w-5 text-blue-600" />
      Meus Pedidos
    </div>
  }
  searchValue={search}
  searchPlaceholder="Buscar por O.S..."
  onSearchChange={setSearch}
  showFilters={showFilters}
  onToggleFilters={() => setShowFilters(prev => !prev)}
  activeFiltersCount={getActiveFiltersCount()}
>
  <FilterSelects>
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pendente</SelectItem>
        <SelectItem value="ready">Pronto</SelectItem>
      </SelectContent>
    </Select>
  </FilterSelects>

  <ActionButtons>
    <OrderExportButton 
      filters={filters}
      buttonText="Exportar"
      variant="outline"
      size="sm"
    />
    <Button>Novo Pedido</Button>
  </ActionButtons>

  <AdvancedFilters>
    <OrderFilters 
      onUpdateFilters={handleUpdateFilters}
      hideEmployeeFilter={isEmployee}
    />
  </AdvancedFilters>
</ListPageHeader>
```

## **🔧 Props do Componente Principal**

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `title` | `string \| React.ReactNode` | ✅ | Título da página (aceita JSX) |
| `searchValue` | `string` | ✅ | Valor atual da busca |
| `searchPlaceholder` | `string` | ✅ | Placeholder do campo de busca |
| `onSearchChange` | `(value: string) => void` | ✅ | Callback de mudança da busca |
| `showFilters` | `boolean` | ✅ | Se filtros avançados estão visíveis |
| `onToggleFilters` | `() => void` | ✅ | Callback para toggle dos filtros |
| `activeFiltersCount` | `number` | ❌ | Número de filtros ativos (badge) |
| `children` | `React.ReactNode` | ❌ | Slots de customização |

## **📦 Componentes de Slot**

### **FilterSelects**
Container para selects de filtro rápido
```tsx
<FilterSelects>
  <Select>...</Select>
  <Select>...</Select>
</FilterSelects>
```

### **ActionButtons** 
Container para botões de ação
```tsx
<ActionButtons>
  <Button variant="outline">Exportar</Button>
  <Button>Novo Item</Button>
</ActionButtons>
```

### **AdvancedFilters**
Container para filtros avançados (expandível)
```tsx
<AdvancedFilters>
  <CustomFiltersComponent />
</AdvancedFilters>
```

### **ListPageContent**
Container para o conteúdo da lista
```tsx
<ListPageContent>
  <div>Conteúdo da lista...</div>
</ListPageContent>
```

## **📱 Responsividade**

O componente é totalmente responsivo:
- **Desktop**: Layout horizontal com filtros e botões lado a lado
- **Mobile**: Layout vertical empilhado
- **Filtros**: Adapta-se automaticamente ao espaço disponível

## **🎯 Benefícios**

1. **DRY Principle**: Elimina duplicação de código
2. **Manutenibilidade**: Mudanças centralizadas
3. **Consistência**: UI/UX uniforme
4. **Flexibilidade**: Customização por página
5. **Performance**: Componente otimizado e leve

## **📍 Páginas que Usam**

- ✅ `/orders` - Lista de Todos os Pedidos
- ✅ `/my-orders` - Meus Pedidos  
- ✅ `/customers` - Lista de Clientes
- 🚧 `/products` - Lista de Produtos (próximo)
- 🚧 `/employees` - Lista de Funcionários (próximo)

## **🔄 Migration Guide**

### **Antes (Código Duplicado)**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Lista de Items</CardTitle>
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex flex-1 gap-4">
        <Input placeholder="Buscar..." />
        <Select>...</Select>
      </div>
      <div className="flex gap-2">
        <Button>Filtros</Button>
        <Button>Exportar</Button>
      </div>
    </div>
  </CardHeader>
  <CardContent>{/* Lista */}</CardContent>
</Card>
```

### **Depois (Composition Pattern)**
```tsx
<ListPageHeader
  title="Lista de Items"
  searchValue={search}
  searchPlaceholder="Buscar..."
  onSearchChange={setSearch}
  showFilters={showFilters}
  onToggleFilters={() => setShowFilters(prev => !prev)}
>
  <FilterSelects>
    <Select>...</Select>
  </FilterSelects>
  <ActionButtons>
    <Button>Exportar</Button>
  </ActionButtons>
  <AdvancedFilters>
    <CustomFilters />
  </AdvancedFilters>
</ListPageHeader>

<ListPageContent>
  {/* Lista */}
</ListPageContent>
```

## **💡 Próximos Passos**

1. Implementar nas páginas restantes
2. Adicionar variantes de layout
3. Criar presets para casos comuns
4. Testes unitários do componente 