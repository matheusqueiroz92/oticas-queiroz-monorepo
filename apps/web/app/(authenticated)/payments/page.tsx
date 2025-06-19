"use client";

import { useState } from "react";
import { usePayments } from "@/hooks/usePayments";
import { Loader2, DollarSign, AlertTriangle, Search, Filter, Download } from "lucide-react";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { PaymentsStatistics } from "@/components/payments/PaymentsStatistics";
import { PaymentActions } from "@/components/payments/PaymentActions";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentTypeClass,
  getPaymentStatusClass,
} from "@/app/_utils/formatters";
import { PaymentStatus, PaymentType } from "@/app/_types/payment";

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | PaymentType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");

  const {
    payments,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalPayments,
    setCurrentPage,
    updateFilters,
    handleCancelPayment,
    navigateToPaymentDetails,
    refetch,
  } = usePayments();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as "all" | PaymentType);
    updateFilters({ 
      type: value !== "all" ? value as PaymentType : undefined 
    });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as "all" | PaymentStatus);
    updateFilters({ 
      status: value !== "all" ? value as PaymentStatus : undefined 
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    updateFilters({});
  };

  const handleRefresh = () => {
    refetch();
  };

  const showEmptyState = !isLoading && !error && payments.length === 0;

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <PaymentsStatistics 
          payments={payments}
          isLoading={isLoading}
        />

        {/* Filtros e Busca */}
        <Card>
          <CardHeader className="bg-gray-100 dark:bg-slate-800/50">
            <CardTitle className="text-lg">Lista de Pagamentos</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
              {/* Área esquerda: Input de busca e selects */}
              <div className="flex flex-1 flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Buscar por descrição"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={handleTypeChange}>
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

                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Área direita: Botões de ação */}
              <div className="flex gap-2 justify-end sm:ml-auto">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <PaymentActions onRefresh={handleRefresh} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}

            {error && (
              <div className="p-6">
                <ErrorAlert message="Ocorreu um erro ao carregar os pagamentos." />
              </div>
            )}

            {showEmptyState && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhum pagamento encontrado</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  {searchTerm ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Pagamento' para adicionar um pagamento ao sistema."}
                </p>
                {!searchTerm && (
                  <PaymentActions onRefresh={handleRefresh} />
                )}
              </div>
            )}

            {!isLoading && !error && payments.length > 0 && (
              <PaymentsList 
                payments={payments}
                isLoading={isLoading}
                error={error ? error.toString() : null}
                search={searchTerm}
                typeFilter={typeFilter}
                statusFilter={statusFilter}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalPayments}
                pageSize={payments.length}
                showEmptyState={showEmptyState}
                setSearch={setSearchTerm}
                setTypeFilter={setTypeFilter}
                setStatusFilter={setStatusFilter}
                applySearch={() => handleSearch({} as React.FormEvent)}
                clearFilters={clearFilters}
                cancelPayment={handleCancelPayment}
                navigateToPaymentDetails={navigateToPaymentDetails}
                navigateToNewPayment={() => {}} // Não usado mais com dialog
                setCurrentPage={setCurrentPage}
                translatePaymentType={translatePaymentType}
                translatePaymentMethod={translatePaymentMethod}
                translatePaymentStatus={translatePaymentStatus}
                getPaymentTypeClass={getPaymentTypeClass}
                getPaymentStatusClass={getPaymentStatusClass}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}