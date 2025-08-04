import { Building, CheckCircle, XCircle, Grid3X3 } from "lucide-react";
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { InstitutionFilters } from "@/components/institutions/InstitutionFilters";
import { InstitutionTableSection } from "@/components/institutions/InstitutionTableSection";
import type { Institution } from "@/app/_types/institution";

interface InstitutionTableWithFiltersProps {
  institutions: Institution[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedIndustryType: string;
  onIndustryTypeChange: (industryType: string) => void;
  onClearFilters: () => void;
  onNewInstitution: () => void;
  onDetailsClick: (institutionId: string) => void;
  onEditClick: (institution: Institution) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function InstitutionTableWithFilters({
  institutions,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  selectedStatus,
  onStatusChange,
  selectedIndustryType,
  onIndustryTypeChange,
  onClearFilters,
  onNewInstitution,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: InstitutionTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const statusFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todos os status",
      icon: <Grid3X3 className="w-4 h-4 text-gray-500" />
    },
    {
      value: "active",
      label: "Ativo",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      value: "inactive", 
      label: "Inativo",
      icon: <XCircle className="w-4 h-4 text-red-500" />
    }
  ];

  const industryTypeFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todos os tipos",
      icon: <Grid3X3 className="w-4 h-4 text-gray-500" />
    },
    {
      value: "saude",
      label: "Saúde",
      icon: <Building className="w-4 h-4 text-blue-500" />
    },
    {
      value: "educacao",
      label: "Educação", 
      icon: <Building className="w-4 h-4 text-purple-500" />
    },
    {
      value: "tecnologia",
      label: "Tecnologia",
      icon: <Building className="w-4 h-4 text-cyan-500" />
    },
    {
      value: "financeiro",
      label: "Financeiro",
      icon: <Building className="w-4 h-4 text-yellow-500" />
    },
    {
      value: "varejo",
      label: "Varejo",
      icon: <Building className="w-4 h-4 text-orange-500" />
    },
    {
      value: "servicos",
      label: "Serviços",
      icon: <Building className="w-4 h-4 text-pink-500" />
    },
    {
      value: "outros",
      label: "Outros",
      icon: <Building className="w-4 h-4 text-gray-500" />
    }
  ];

  const basicFilters = [
    {
      options: statusFilterOptions,
      value: selectedStatus,
      onChange: onStatusChange,
      placeholder: "Status",
      width: "w-[160px]"
    },
    {
      options: industryTypeFilterOptions,
      value: selectedIndustryType,
      onChange: onIndustryTypeChange,
      placeholder: "Tipo de Indústria",
      width: "w-[200px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Instituições"
      searchPlaceholder="Buscar por nome, email ou CNPJ"
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <InstitutionFilters
          search={search}
          industryType={selectedIndustryType}
          status={selectedStatus}
          onSearchChange={onSearchChange}
          onIndustryTypeChange={onIndustryTypeChange}
          onStatusChange={onStatusChange}
          onClearFilters={onClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      }
      onNewItem={onNewInstitution}
      newButtonText="Nova Instituição"
    >
      <InstitutionTableSection
        institutions={institutions}
        onDetailsClick={onDetailsClick}
        onEditClick={onEditClick}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        pageSize={limit}
        isLoading={isLoading}
      />
    </DataTableWithFilters>
  );
}