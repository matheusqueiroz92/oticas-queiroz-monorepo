import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Download, Plus } from "lucide-react";
import { PaymentsList } from "./PaymentsList";
import { PaymentFilters } from "./PaymentFilters";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Loader2, DollarSign } from "lucide-react";
import type { IPayment } from "@/app/_types/payment";
import {
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentTypeClass,
  getPaymentStatusClass,
} from "@/app/_utils/formatters";

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
  return (
    <Card>
      <CardHeader className="bg-gray-100 dark:bg-slate-800/50">
        <CardTitle className="text-lg">Lista de Pagamentos</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
          {/* Área esquerda: Input de busca e selects */}
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Buscar por descrição"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="sale">Venda</SelectItem>
                <SelectItem value="debt_payment">Pagamento de Dívida</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={onPaymentMethodFilterChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
                <SelectItem value="debit">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="bank_slip">Boleto Bancário</SelectItem>
                <SelectItem value="promissory_note">Nota Promissória</SelectItem>
                <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Área direita: Botões de ação */}
          <div className="flex gap-2 justify-end sm:ml-auto">
            <Button variant="outline" size="sm" onClick={onToggleFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" onClick={onNewPayment}>
              <Plus className="w-4 h-4 mr-2" /> Novo Pagamento
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <PaymentFilters 
          onUpdateFilters={onUpdateFilters}
        />
      )}
      
      <CardContent className="p-0">
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
              pageSize={payments.length}
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
              translatePaymentType={translatePaymentType}
              translatePaymentMethod={translatePaymentMethod}
              translatePaymentStatus={translatePaymentStatus}
              getPaymentTypeClass={getPaymentTypeClass}
              getPaymentStatusClass={getPaymentStatusClass}
              getClientName={getClientName}
              getOrderNumber={getOrderNumber}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 