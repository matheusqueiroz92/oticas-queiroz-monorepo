"use client";

import { useState } from "react";
import { usePayments } from "@/hooks/usePayments";
import { Loader2, DollarSign, Plus, Search, Filter, Download } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { PaymentsStatistics } from "@/components/payments/PaymentsStatistics";
import { PaymentActions } from "@/components/payments/PaymentActions";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
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
  formatCurrency,
  formatDate,
} from "@/app/_utils/formatters";
import { PaymentStatus, PaymentType } from "@/app/_types/payment";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";
import { CashRegisterStatus } from "@/components/cash-register/CashRegisterStatus";

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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

  const handleOpenNewPayment = () => {
    setPaymentDialogOpen(true);
  };

  const showEmptyState = !isLoading && !error && payments.length === 0;

  // Estatísticas para os cards
  const totalPagamentos = payments.length;
  const pagamentosHoje = payments.filter(payment => {
    const created = new Date(payment.date);
    const hoje = new Date();
    return (
      created.getDate() === hoje.getDate() &&
      created.getMonth() === hoje.getMonth() &&
      created.getFullYear() === hoje.getFullYear()
    );
  }).length;
  const vendas = payments.filter(payment => payment.type === "sale").length;
  const despesas = payments.filter(payment => payment.type === "expense").length;
  const totalMes = payments.filter(payment => {
    const created = new Date(payment.date);
    const hoje = new Date();
    return (
      created.getMonth() === hoje.getMonth() &&
      created.getFullYear() === hoje.getFullYear()
    );
  }).reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <PageContainer>
        <div className="space-y-8">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total de Pagamentos"
              value={totalPagamentos.toLocaleString()}
              icon={DollarSign}
              iconColor="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-100 dark:bg-blue-900"
              description={`+${pagamentosHoje} hoje`}
            />

            <StatCard
              title="Vendas"
              value={vendas}
              icon={Plus}
              iconColor="text-green-600 dark:text-green-400"
              bgColor="bg-green-100 dark:bg-green-900"
              description={`${totalPagamentos > 0 ? ((vendas / totalPagamentos) * 100).toFixed(1) : 0}% do total`}
            />

            <StatCard
              title="Despesas"
              value={despesas}
              icon={DollarSign}
              iconColor="text-red-600 dark:text-red-400"
              bgColor="bg-red-100 dark:bg-red-900"
              description={`${totalPagamentos > 0 ? ((despesas / totalPagamentos) * 100).toFixed(1) : 0}% do total`}
            />

            <StatCard
              title="Valor Total"
              value={formatCurrency(totalMes)}
              icon={DollarSign}
              iconColor="text-purple-600 dark:text-purple-400"
              bgColor="bg-purple-100 dark:bg-purple-900"
              description="Este mês"
            />
          </div>

          <div className="mb-4">
            <CashRegisterStatus showOpenButton />
          </div>

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
                  
                  <Select value="todos" onValueChange={() => {}}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="sale">Venda</SelectItem>
                      <SelectItem value="debt_payment">Pagamento de Dívida</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value="todos-metodos" onValueChange={() => {}}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos-metodos">Todos os métodos</SelectItem>
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

                  <Select value="todos-status" onValueChange={() => {}}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos-status">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Área direita: Botões de ação */}
                <div className="flex gap-2 justify-end sm:ml-auto">
                  <Button variant="outline" size="sm" onClick={() => setShowFilters((prev) => !prev)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button size="sm" onClick={handleOpenNewPayment}>
                    <Plus className="w-4 h-4 mr-2" /> Novo Pagamento
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showFilters && (
              <PaymentFilters 
                onUpdateFilters={(newFilters: Record<string, any>) => {
                  updateFilters(newFilters);
                }}
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
                    {searchTerm ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Pagamento' para adicionar um pagamento ao sistema."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleOpenNewPayment}>
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
                    error={error ? error.toString() : null}
                    search={searchTerm}
                    typeFilter="all"
                    statusFilter="all"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalPayments}
                    pageSize={payments.length}
                    showEmptyState={showEmptyState}
                    setSearch={setSearchTerm}
                    setTypeFilter={() => {}}
                    setStatusFilter={() => {}}
                    applySearch={() => {}}
                    clearFilters={() => {}}
                    cancelPayment={handleCancelPayment}
                    navigateToPaymentDetails={navigateToPaymentDetails}
                    navigateToNewPayment={() => {}}
                    setCurrentPage={setCurrentPage}
                    translatePaymentType={translatePaymentType}
                    translatePaymentMethod={translatePaymentMethod}
                    translatePaymentStatus={translatePaymentStatus}
                    getPaymentTypeClass={getPaymentTypeClass}
                    getPaymentStatusClass={getPaymentStatusClass}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={() => {
          refetch();
        }}
      />
    </>
  );
}