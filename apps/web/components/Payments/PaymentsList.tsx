import React from "react";
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
import { PaginationItems } from "@/components/PaginationItems";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import type { IPayment, PaymentStatus, PaymentType } from "@/app/types/payment";
import { CashRegisterStatus } from "@/components/CashRegister/CashRegisterStatus";

interface PaymentsListProps {
  payments: IPayment[];
  isLoading: boolean;
  error: string | null;
  search: string;
  typeFilter: PaymentType | "all";
  statusFilter: PaymentStatus | "all";
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  showEmptyState: boolean;
  setSearch: (value: string) => void;
  setTypeFilter: (value: PaymentType | "all") => void;
  setStatusFilter: (value: PaymentStatus | "all") => void;
  applySearch: () => void;
  clearFilters: () => void;
  cancelPayment: (id: string) => void;
  navigateToPaymentDetails: (id: string) => void;
  navigateToNewPayment: () => void;
  setCurrentPage: (page: number) => void;
  translatePaymentType: (type: string) => string;
  translatePaymentMethod: (method: string) => string;
  translatePaymentStatus: (status: string) => string;
  getPaymentTypeClass: (type: string) => string;
  getPaymentStatusClass: (status: string) => string;
}

export function PaymentsList({
  payments,
  isLoading,
  error,
  search,
  typeFilter,
  statusFilter,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  showEmptyState,
  setSearch,
  setTypeFilter,
  setStatusFilter,
  applySearch,
  clearFilters,
  cancelPayment,
  navigateToPaymentDetails,
  navigateToNewPayment,
  setCurrentPage,
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentTypeClass,
  getPaymentStatusClass,
}: PaymentsListProps) {
  
  const confirmCancelPayment = async (id: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar este pagamento?"
    );
    if (confirmed) {
      await cancelPayment(id);
    }
  };

  return (
    <>
      <CashRegisterStatus showOpenButton />

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

      <div className="flex justify-end mt-4">
        <Button onClick={navigateToNewPayment}>Novo Pagamento</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md mt-4">{error}</div>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background mt-4">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            Não há pagamentos registrados
          </h3>
          <p className="text-muted-foreground mt-2">
            Nenhum pagamento foi registrado no sistema ainda.
          </p>
          <Button className="mt-4" onClick={navigateToNewPayment}>
            Registrar Pagamento
          </Button>
        </div>
      )}

      {!isLoading && !error && payments.length > 0 && (
        <>
          <Table className="mt-4">
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

          <PaginationItems
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            pageSize={pageSize || payments.length}
          />
        </>
      )}
    </>
  );
}