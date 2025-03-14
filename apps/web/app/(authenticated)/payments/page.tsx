"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, FileText, Ban, CreditCard, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CashRegisterStatus } from "@/components/CashRegister/CashRegisterStatus";
import { usePayments } from "@/hooks/usePayments";
import {
  formatCurrency,
  formatDate,
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentTypeClass,
  getPaymentStatusClass,
} from "@/app/utils/formatters";
import type { PaymentType, PaymentStatus, IPayment } from "@/app/types/payment";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all"
  );

  const {
    payments,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalPayments,
    setCurrentPage,
    updateFilters,
    refetch,
    handleCancelPayment,
    navigateToPaymentDetails,
    navigateToCreatePayment,
  } = usePayments();

  // Aplicar filtros de busca
  const applySearch = () => {
    const filters: Record<string, unknown> = { search };

    if (typeFilter !== "all") {
      filters.type = typeFilter;
    }

    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }

    updateFilters(filters);
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    updateFilters({});
  };

  // Função para confirmar cancelamento
  const confirmCancelPayment = async (id: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar este pagamento?"
    );
    if (confirmed) {
      await handleCancelPayment(id);
    }
  };

  // Função para gerar itens de paginação
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return items;
    }

    // Caso contrário, mostrar um subconjunto com elipses
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Adicionar elipse se necessário
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Páginas próximas à atual
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i <= 1 || i >= totalPages) continue;
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Adicionar elipse se necessário
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Última página
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Verificar estado vazio
  const showEmptyState = !isLoading && !error && payments.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pagamentos</h1>

      {/* Componente de Status do Caixa */}
      <CashRegisterStatus showOpenButton />

      {/* Filtros e ações */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar pagamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value) =>
                  setTypeFilter(value as PaymentType | "all")
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sale">Vendas</SelectItem>
                  <SelectItem value="debt_payment">Débitos</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as PaymentStatus | "all")
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={applySearch}>Filtrar</Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={navigateToCreatePayment}>Novo Pagamento</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            Não há pagamentos registrados
          </h3>
          <p className="text-muted-foreground mt-2">
            Nenhum pagamento foi registrado no sistema ainda.
          </p>
          <Button className="mt-4" onClick={navigateToCreatePayment}>
            Registrar Pagamento
          </Button>
        </div>
      )}

      {!isLoading && !error && payments.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: IPayment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    {payment.description || "Sem descrição"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentTypeClass(payment.type)}>
                      {translatePaymentType(payment.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />
                      {translatePaymentMethod(payment.paymentMethod)}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(payment.date)}</TableCell>
                  <TableCell
                    className={
                      payment.type === "expense"
                        ? "text-red-600 font-medium"
                        : "text-green-600 font-medium"
                    }
                  >
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusClass(payment.status)}>
                      {translatePaymentStatus(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPaymentDetails(payment._id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      {payment.status !== "cancelled" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmCancelPayment(payment._id)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      aria-disabled={currentPage === 1}
                      className={
                        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                      }
                    />
                  </PaginationItem>

                  {generatePaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      aria-disabled={currentPage === totalPages}
                      className={
                        currentPage === totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="text-center text-sm text-gray-500 mt-2">
                Mostrando {payments.length} de {totalPayments} pagamentos
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
