import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, FileText, Ban, CreditCard, Banknote, BookText, TicketsPlane, NotepadText, Repeat, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaginationItems } from "@/components/PaginationItems";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import type { IPayment, PaymentStatus, PaymentType } from "@/app/_types/payment";

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
  getClientName: (customerId: string) => string;
  getOrderNumber: (orderId: string) => string;
}

export function PaymentsList({
  payments,
  isLoading,
  error,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  showEmptyState,
  cancelPayment,
  navigateToPaymentDetails,
  navigateToNewPayment,
  setCurrentPage,
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentTypeClass,
  getPaymentStatusClass,
  getClientName,
  getOrderNumber,
}: PaymentsListProps) {
  
  const confirmCancelPayment = async (id: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar este pagamento?"
    );
    if (confirmed) {
      await cancelPayment(id);
    }
  };



  const getIconMethod = (method: string) => {
    switch (method) {
      case "credit_card":
      case "credit":
        return <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />;
      case "cash":
        return <Banknote className="h-4 w-4 mr-1 text-muted-foreground" />;
      case "debit_card":
      case "debit":
        return <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />;
      case "bank_slip":
        return <BookText className="h-4 w-4 mr-1 text-muted-foreground" />;
      case "promissor_note":
      case "promissory_note":
        return <NotepadText className="h-4 w-4 mr-1 text-muted-foreground" />;
      case "pix":
        return <Repeat className="h-4 w-4 mr-1 text-muted-foreground" />;
      case "check":
        return <TicketsPlane className="h-4 w-4 mr-1 text-muted-foreground" />;
      case "mercado_pago":
        return <CreditCard className="h-4 w-4 mr-1 text-blue-500" />;
      default:
        return <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />;
    }
  }

  return (
    <>
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
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Nº OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método de Pagamento</TableHead>
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
                    {payment.orderId ? getOrderNumber(payment.orderId) : "Sem número de OS"}
                  </TableCell>
                  <TableCell>
                    {payment.customerId ? getClientName(payment.customerId) : "Sem cliente"}
                  </TableCell>
                    <TableCell>
                      {payment.description || "Sem descrição"}
                    </TableCell>
                  <TableCell>
                    <Badge className={`status-badge ${getPaymentTypeClass(payment.type)}`}>
                      {translatePaymentType(payment.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getIconMethod(payment.paymentMethod)}
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
                    <Badge className={`status-badge ${getPaymentStatusClass(payment.status)}`}>
                      {translatePaymentStatus(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => navigateToPaymentDetails(payment._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          onClick={() => confirmCancelPayment(payment._id)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {payment.paymentMethod === "mercado_pago" && payment.mercadoPagoId && (
                        <Button
                          variant="outline"
                          className="text-blue-600"
                          onClick={() => window.open("https://www.mercadopago.com.br", "_blank")}
                        >
                          <CreditCard className="h-4 w-4" />
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