import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus, Crown, Star, User as UserIcon, Grid3X3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { CustomerExportButton } from "@/components/customers/CustomerExportButton";
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
  return (
    <Card>
      <CardHeader className="bg-gray-100 dark:bg-slate-800/50">
        <CardTitle className="text-lg">Lista de Clientes</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
          {/* Área esquerda: Input de busca e selects */}
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Buscar por nome, email ou CPF"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  <span className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-gray-500" />
                    Todas as categorias
                  </span>
                </SelectItem>
                <SelectItem value="vip">
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-500" />
                    VIP
                  </span>
                </SelectItem>
                <SelectItem value="premium">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-500" />
                    Premium
                  </span>
                </SelectItem>
                <SelectItem value="regular">
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-green-500" />
                    Regular
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Área direita: Botões de ação */}
          <div className="flex gap-2 justify-end sm:ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleFilters}
              className={activeFiltersCount > 0 ? "bg-blue-50 border-blue-200" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <CustomerExportButton
              buttonText="Exportar"
              variant="outline"
              disabled={isLoading || customers.length === 0}
              size="sm"
            />
            <Button size="sm" onClick={onNewCustomer}>
              <Plus className="w-4 h-4 mr-2" /> Novo Cliente
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CustomerFilters
          onUpdateFilters={onUpdateFilters}
        />
      )}
      
      <CardContent className="p-0">
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
      </CardContent>
    </Card>
  );
} 