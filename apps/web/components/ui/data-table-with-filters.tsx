import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReactNode } from "react";

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface DataTableWithFiltersProps {
  // Configuração básica
  title: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  
  // Filtros básicos
  basicFilters?: {
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    width?: string;
  }[];
  
  // Filtros avançados
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  advancedFiltersComponent?: ReactNode;
  
  // Botões de ação
  onNewItem: () => void;
  newButtonText: string;
  newButtonIcon?: ReactNode;
  onExport?: () => void;
  exportButtonText?: string;
  exportDisabled?: boolean;
  
  // Conteúdo da tabela
  children: ReactNode;
  
  // Classes customizáveis
  className?: string;
  headerClassName?: string;
  searchIcon?: ReactNode;
}

export function DataTableWithFilters({
  title,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  basicFilters = [],
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  advancedFiltersComponent,
  onNewItem,
  newButtonText,
  newButtonIcon = <Plus className="w-4 h-4 mr-2" />,
  onExport,
  exportButtonText = "Exportar",
  exportDisabled = false,
  children,
  className = "",
  headerClassName = "bg-gray-100 dark:bg-slate-800/50",
  searchIcon = <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />,
}: DataTableWithFiltersProps) {
  return (
    <Card className={className}>
      <CardHeader className={headerClassName}>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
          {/* Área esquerda: Input de busca e selects */}
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              {searchIcon}
            </div>
            
            {/* Filtros básicos */}
            {basicFilters.map((filter, index) => (
              <Select 
                key={index}
                value={filter.value} 
                onValueChange={filter.onChange}
              >
                <SelectTrigger className={filter.width || "w-[180px]"}>
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.icon && <span className="text-sm">{option.icon}</span>}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          {/* Área direita: Botões de ação */}
          <div className="flex gap-2 justify-end sm:ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleFilters}
              className={activeFiltersCount > 0 ? "bg-blue-50 border-blue-200 dark:bg-blue-900/60 dark:border-blue-700" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            {onExport && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onExport}
                disabled={exportDisabled}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportButtonText}
              </Button>
            )}
            
            <Button 
              size="sm" 
              onClick={onNewItem}
              className="bg-[var(--primary-blue)] text-white"
            >
              {newButtonIcon}
              {newButtonText}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Filtros avançados */}
      {showFilters && advancedFiltersComponent && (
        <div className="border-b">
          {advancedFiltersComponent}
        </div>
      )}
      
      {/* Conteúdo da tabela */}
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
} 