import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Ban,
  FileText,
  DollarSign,
  Calendar,
  Printer,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { formatCurrency, formatDate, formatDateTime } from "@/app/utils/formatters";
import type { IPayment } from "@/app/types/payment";
import type { User } from "@/app/types/user";
import type { LegacyClient } from "@/app/types/legacy-client";
import { useUsers } from "@/hooks/useUsers";

interface PaymentDetailsProps {
  payment: IPayment | null;
  isLoading: boolean;
  error: unknown;
  customer: User | null;
  employee: User | null;
  legacyClient: LegacyClient | null;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  onCancelPayment: () => void;
  onPrintReceipt: () => void;
  onGoBack: () => void;
  navigateToOrder?: (id: string) => void;
  navigateToCustomer?: (id: string) => void;
  navigateToLegacyClient?: (id: string) => void;
  navigateToCashRegister?: (id: string) => void;
  translatePaymentStatus: (status: string) => string;
  translatePaymentType: (type: string) => string;
  translatePaymentMethod: (method: string) => string;
  getPaymentStatusClass: (status: string) => string;
}

export function PaymentDetails({
  payment,
  isLoading,
  error,
  customer,
  employee,
  legacyClient,
  showConfirmDialog,
  setShowConfirmDialog,
  onCancelPayment,
  onPrintReceipt,
  onGoBack,
  navigateToOrder,
  navigateToCustomer,
  navigateToLegacyClient,
  navigateToCashRegister,
  translatePaymentStatus,
  translatePaymentType,
  translatePaymentMethod,
  getPaymentStatusClass,
}: PaymentDetailsProps) {
  
  const { getUserName } = useUsers();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Loader2 className="h-5 w-5 text-yellow-600" />;
      case "cancelled":
        return <Ban className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error instanceof Error ? error.message : "Pagamento não encontrado"}
        <Button className="mt-4" onClick={onGoBack}>
          Voltar para Pagamentos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Pagamento</h1>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(payment.status)}
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${getPaymentStatusClass(payment.status)}`}
          >
            {translatePaymentStatus(payment.status)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Pagamento #{payment._id.substring(0, 8)}</CardTitle>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(payment.amount)}
            </div>
          </div>
          <CardDescription>
            {payment.description ||
              `Registro de pagamento - ${translatePaymentType(payment.type)}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Detalhes do Pagamento
              </h3>
              <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tipo:</span>
                  <span>{translatePaymentType(payment.type)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Método:</span>
                  <span>{translatePaymentMethod(payment.paymentMethod)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Data:</span>
                  <span>{formatDate(payment.date)}</span>
                </div>
                {payment.installments && payment.installments.total > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Parcelas:</span>
                    <span>
                      {payment.installments.current}/
                      {payment.installments.total}x de{" "}
                      {formatCurrency(payment.installments.value)}
                    </span>
                  </div>
                )}

                {payment.paymentMethod === "check" && payment.check && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                    <h3 className="font-medium mb-2">Dados do Cheque</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Banco:</span>
                          <p>{payment.check.bank}</p>
                        </div>
                        <div>
                          <span className="font-medium">Número:</span>
                          <p>{payment.check.checkNumber}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Data do Cheque:</span>
                          <p>{formatDate(payment.check.checkDate)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Data de Apresentação:</span>
                          <p>{payment.check.presentationDate ? formatDate(payment.check.presentationDate) : "Imediata"}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Titular:</span>
                        <p>{payment.check.accountHolder}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Agência:</span>
                          <p>{payment.check.branch}</p>
                        </div>
                        <div>
                          <span className="font-medium">Conta:</span>
                          <p>{payment.check.accountNumber}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Status de Compensação:</span>
                        <Badge className={
                          payment.check.compensationStatus === "compensated" ? "bg-green-100 text-green-800" :
                          payment.check.compensationStatus === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>
                          {payment.check.compensationStatus === "compensated" ? "Compensado" :
                          payment.check.compensationStatus === "rejected" ? "Rejeitado" :
                          "Pendente"}
                        </Badge>
                        
                        {payment.check.compensationStatus === "rejected" && payment.check.rejectionReason && (
                          <div className="mt-1">
                            <span className="font-medium">Motivo da rejeição:</span>
                            <p className="text-red-600">{payment.check.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {payment.category && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Categoria:</span>
                    <span>{payment.category}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Criado em:</span>
                  <span>{formatDateTime(payment.createdAt)}</span>
                </div>
                {payment.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Atualizado em:</span>
                    <span>{formatDateTime(payment.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" /> Informações Relacionadas
              </h3>
              <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                {customer && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cliente:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigateToCustomer && navigateToCustomer(customer._id)}
                    >
                      {customer.name}
                    </Button>
                  </div>
                )}
                {legacyClient && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cliente Legado:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigateToLegacyClient && navigateToLegacyClient(legacyClient._id ?? "")}
                    >
                      {legacyClient.name}
                    </Button>
                  </div>
                )}
                {payment.createdBy && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Registrado por:</span>
                    <span>{getUserName(employee?.name || payment.createdBy)}</span>
                  </div>
                )}
                {payment.orderId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pedido:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigateToOrder && navigateToOrder(payment.orderId as string)}
                    >
                      Ver Pedido
                    </Button>
                  </div>
                )}
                {payment.cashRegisterId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Caixa:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigateToCashRegister && navigateToCashRegister(payment.cashRegisterId as string)}
                    >
                      Ver Caixa
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {payment.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Descrição</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p>{payment.description}</p>
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="space-y-2">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Histórico
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="space-y-2">
                <li className="flex items-center justify-between text-sm">
                  <span>Pagamento criado</span>
                  <span className="text-gray-500">
                    {formatDateTime(payment.createdAt)}
                  </span>
                </li>
                {payment.status === "completed" && (
                  <li className="flex items-center justify-between text-sm">
                    <span>Pagamento concluído</span>
                    <span className="text-gray-500">
                      {formatDateTime(payment.updatedAt)}
                    </span>
                  </li>
                )}
                {payment.status === "cancelled" && (
                  <li className="flex items-center justify-between text-sm">
                    <span>Pagamento cancelado</span>
                    <span className="text-gray-500">
                      {formatDateTime(payment.updatedAt)}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button variant="outline" onClick={onPrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {payment.status !== "cancelled" && (
            <AlertDialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Ban className="h-4 w-4 mr-2" />
                  Cancelar Pagamento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar pagamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O pagamento será marcado
                    como cancelado e, se aplicável, os valores serão estornados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onCancelPayment}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      "Confirmar Cancelamento"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}