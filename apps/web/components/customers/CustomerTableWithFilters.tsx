import { Crown, Star, User as UserIcon, Grid3X3 } from "lucide-react";
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { CustomerTableSection } from "@/components/customers/CustomerTableSection";
import type { User } from "@/app/_types/user";

interface CustomerTableWithFiltersProps {
  customers: User[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  filters: Record<string, any>;
  onUpdateFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  onNewCustomer: () => void;
  onDetailsClick: (customerId: string) => void;
  onEditClick: (customer: User) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function CustomerTableWithFilters({
  customers,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  selectedCategory,
  onCategoryChange,
  onUpdateFilters,
  onClearFilters,
  onNewCustomer,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: CustomerTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const categoryFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todas as categorias",
      icon: <Grid3X3 className="w-4 h-4 text-gray-500" />
    },
    {
      value: "vip",
      label: "VIP",
      icon: <Crown className="w-4 h-4 text-purple-500" />
    },
    {
      value: "premium",
      label: "Premium",
      icon: <Star className="w-4 h-4 text-blue-500" />
    },
    {
      value: "regular",
      label: "Regular",
      icon: <UserIcon className="w-4 h-4 text-green-500" />
    }
  ];

  const basicFilters = [
    {
      options: categoryFilterOptions,
      value: selectedCategory,
      onChange: onCategoryChange,
      placeholder: "Categoria",
      width: "w-[210px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Clientes"
      searchPlaceholder="Buscar por nome, email ou CPF"
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <CustomerFilters onUpdateFilters={onUpdateFilters} />
      }
      onNewItem={onNewCustomer}
      newButtonText="Novo Cliente"
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || customers.length === 0}
    >
      <CustomerTableSection
        customers={customers}
        isLoading={isLoading}
        error={error}
        search={search}
        activeFiltersCount={activeFiltersCount}
        onDetailsClick={onDetailsClick}
        onEditClick={onEditClick}
        onNewCustomer={onNewCustomer}
        onClearFilters={onClearFilters}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        limit={limit}
      />
    </DataTableWithFilters>
  );
} 