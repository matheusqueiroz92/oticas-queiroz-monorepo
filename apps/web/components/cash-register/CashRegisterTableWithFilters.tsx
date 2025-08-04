import { Calendar, CheckCircle, XCircle, Grid3X3 } from "lucide-react";
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { CashRegisterFilters } from "@/components/cash-register/CashRegisterFilters";
import { CashRegisterTableSection } from "@/components/cash-register/CashRegisterTableSection";
import type { ICashRegister } from "@/app/_types/cash-register";

interface CashRegisterTableWithFiltersProps {
  cashRegisters: ICashRegister[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  date?: Date;
  onDateChange: (date?: Date) => void;
  onClearFilters: () => void;
  onOpenRegister: () => void;
  onDetailsClick: (registerId: string) => void;
  onCloseClick: (registerId: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
  hasActiveRegister: boolean;
}

export function CashRegisterTableWithFilters({
  cashRegisters,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  selectedStatus,
  onStatusChange,
  date,
  onDateChange,
  onClearFilters,
  onOpenRegister,
  onDetailsClick,
  onCloseClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
  hasActiveRegister,
}: CashRegisterTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const statusFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todos os status",
      icon: <Grid3X3 className="w-4 h-4 text-gray-500" />
    },
    {
      value: "open",
      label: "Aberto",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      value: "closed", 
      label: "Fechado",
      icon: <XCircle className="w-4 h-4 text-red-500" />
    }
  ];

  const basicFilters = [
    {
      options: statusFilterOptions,
      value: selectedStatus,
      onChange: onStatusChange,
      placeholder: "Status",
      width: "w-[160px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Caixas"
      searchPlaceholder="Buscar por data ou responsável"
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <CashRegisterFilters
          search={search}
          setSearch={onSearchChange}
          date={date}
          setDate={onDateChange}
          onApplyDateFilter={() => {}} // Será tratado internamente
          onClearFilters={onClearFilters}
        />
      }
      onNewItem={onOpenRegister}
      newButtonText="Abrir Caixa"
      newButtonIcon={<Calendar className="w-4 h-4 mr-2" />}
    >
      <CashRegisterTableSection
        cashRegisters={cashRegisters}
        onDetailsClick={onDetailsClick}
        onCloseClick={onCloseClick}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        pageSize={limit}
        isLoading={isLoading}
        hasActiveRegister={hasActiveRegister}
      />
    </DataTableWithFilters>
  );
}