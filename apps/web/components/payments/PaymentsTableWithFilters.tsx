import { DollarSign } from "lucide-react";
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IPayment } from "@/app/_types/payment";

interface PaymentsTableWithFiltersProps {
  payments: IPayment[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filters: Record<string, any>;
  onUpdateFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  onNewPayment: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  showEmptyState: boolean;
  cancelPayment: (id: string) => void;
  navigateToPaymentDetails: (id: string) => void;
  getClientName: (customerId: string) => string;
  getOrderNumber: (orderId: string) => string;
}

export function PaymentsTableWithFilters({
  payments,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  typeFilter,
  onTypeFilterChange,
  paymentMethodFilter,
  onPaymentMethodFilterChange,
  statusFilter,
  onStatusFilterChange,
  onUpdateFilters,
  onNewPayment,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  showEmptyState,
  cancelPayment,
  navigateToPaymentDetails,
  getClientName,
  getOrderNumber,
}: PaymentsTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const typeFilterOptions: FilterOption[] = [
    { value: "all", label: "Todos os tipos" },
    { value: "sale", label: "Venda" },
    { value: "debt_payment", label: "Pagamento de Dívida" },
    { value: "expense", label: "Despesa" }
  ];

  const paymentMethodFilterOptions: FilterOption[] = [
    { value: "all", label: "Todos os métodos" },
    { value: "cash", label: "Dinheiro" },
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "pix", label: "PIX" },
    { value: "check", label: "Cheque" },
    { value: "bank_slip", label: "Boleto Bancário" },
    { value: "promissory_note", label: "Nota Promissória" },
    { value: "mercado_pago", label: "Mercado Pago" }
  ];

  const statusFilterOptions: FilterOption[] = [
    { value: "all", label: "Todos os status" },
    { value: "pending", label: "Pendente" },
    { value: "completed", label: "Concluído" },
    { value: "cancelled", label: "Cancelado" }
  ];

  const basicFilters = [
    {
      options: typeFilterOptions,
      value: typeFilter,
      onChange: onTypeFilterChange,
      placeholder: "Tipo de pagamento",
      width: "w-[180px]"
    },
    {
      options: paymentMethodFilterOptions,
      value: paymentMethodFilter,
      onChange: onPaymentMethodFilterChange,
      placeholder: "Método",
      width: "w-[160px]"
    },
    {
      options: statusFilterOptions,
      value: statusFilter,
      onChange: onStatusFilterChange,
      placeholder: "Status",
      width: "w-[140px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Pagamentos"
      searchPlaceholder="Buscar por descrição"
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <PaymentFilters onUpdateFilters={onUpdateFilters} />
      }
      onNewItem={onNewPayment}
      newButtonText="Novo Pagamento"
      searchIcon={<DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || payments.length === 0}
    >
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="p-6">
          <ErrorAlert message={error} />
        </div>
      )}
      
      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum pagamento encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {search ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Pagamento' para adicionar um pagamento ao sistema."}
          </p>
          {!search && (
            <Button onClick={onNewPayment}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pagamento
            </Button>
          )}
        </div>
      )}
      
      {!isLoading && !error && payments.length > 0 && (
        <div className="overflow-hidden">
          <PaymentsList 
            payments={payments}
            isLoading={isLoading}
            error={error}
            search={search}
            typeFilter="all"
            statusFilter="all"
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            showEmptyState={showEmptyState}
            setSearch={onSearchChange}
            setTypeFilter={() => {}}
            setStatusFilter={() => {}}
            applySearch={() => {}}
            clearFilters={() => {}}
            cancelPayment={cancelPayment}
            navigateToPaymentDetails={navigateToPaymentDetails}
            navigateToNewPayment={onNewPayment}
            setCurrentPage={setCurrentPage}
            translatePaymentType={(type: string) => type}
            translatePaymentMethod={(method: string) => method}
            translatePaymentStatus={(status: string) => status}
            getPaymentTypeClass={() => ""}
            getPaymentStatusClass={() => ""}
            getClientName={getClientName}
            getOrderNumber={getOrderNumber}
          />
        </div>
      )}
    </DataTableWithFilters>
  );
} 