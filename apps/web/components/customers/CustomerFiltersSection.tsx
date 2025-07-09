import { Button } from "@/components/ui/button";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { CustomerExportButton } from "@/components/customers/CustomerExportButton";
import { 
  ListPageHeader, 
  FilterSelects, 
  ActionButtons, 
  AdvancedFilters 
} from "@/components/ui/list-page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Users, Crown, UserCheck, UserPlus } from "lucide-react";

interface CustomerFiltersSectionProps {
  search: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  filters: Record<string, any>;
  onUpdateFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  onNewCustomer: () => void;
  isLoading: boolean;
  customersLength: number;
}

export function CustomerFiltersSection({
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  selectedCategory,
  onCategoryChange,
  filters,
  onUpdateFilters,
  onClearFilters,
  onNewCustomer,
  isLoading,
  customersLength,
}: CustomerFiltersSectionProps) {
  return (
    <ListPageHeader
      title="Lista de Clientes"
      searchValue={search}
      searchPlaceholder="Buscar por nome, email ou CPF"
      onSearchChange={onSearchChange}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
    >
      <FilterSelects>
        <div className="flex flex-row items-center gap-3 w-full">
          <Select 
            value={selectedCategory} 
            onValueChange={onCategoryChange}
          >
            <SelectTrigger id="customer-category-select" className="h-10 w-[210px] max-w-md">
              <SelectValue placeholder="Categoria de cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Todas
                </span>
              </SelectItem>
              <SelectItem value="vip">
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  VIP (5+ compras)
                </span>
              </SelectItem>
              <SelectItem value="regular">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  Regular (1-4 compras)
                </span>
              </SelectItem>
              <SelectItem value="novo">
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-gray-500" />
                  Novo (0 compras)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterSelects>

      <ActionButtons>
        <div className="flex flex-row items-center gap-2">
          <CustomerExportButton 
            filters={filters}
            buttonText="Exportar"
            variant="outline"
            disabled={isLoading || customersLength === 0}
            size="sm"
          />
          <Button 
            onClick={onNewCustomer} 
            size="sm" 
            className="min-w-[140px] bg-[var(--primary-blue)] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
          {activeFiltersCount > 0 && (
            <Button 
              onClick={onClearFilters} 
              variant="outline" 
              size="sm" 
              className="min-w-[140px]"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </ActionButtons>

      <AdvancedFilters>
        <CustomerFilters 
          onUpdateFilters={onUpdateFilters}
        />
      </AdvancedFilters>
    </ListPageHeader>
  );
} 