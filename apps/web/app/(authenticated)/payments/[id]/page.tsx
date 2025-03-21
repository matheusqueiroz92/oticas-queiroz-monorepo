"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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

import { usePayments } from "@/hooks/usePayments";
import { getPaymentById } from "@/app/services/paymentService";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentStatusClass,
} from "@/app/utils/formatters";
import type { User } from "@/app/types/user";
import type { LegacyClient } from "@/app/types/legacy-client";

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [customer] = useState<User | null>(null);
  const [employee] = useState<User | null>(null);
  const [legacyClient] = useState<LegacyClient | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const router = useRouter();
  const { handleCancelPayment } = usePayments();

  // Buscar os dados do pagamento usando React Query
  const {
    data: payment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.DETAIL(id as string),
    queryFn: () => getPaymentById(id as string),
    enabled: !!id,
  });

  // Buscar dados relacionados quando o pagamento for carregado
  useEffect(() => {
    const loadRelatedData = async () => {
      if (!payment) return;

      // try {
      //   // Aqui você pode implementar a lógica para buscar dados relacionados
      //   // como cliente, funcionário, pedido, etc. se necessário
      // } catch (error) {
      //   console.error("Erro ao carregar dados relacionados:", error.message);
      // }
    };

    loadRelatedData();
  }, [payment]);

  // Função para imprimir comprovante
  const handlePrintReceipt = () => {
    window.print();
  };

  // Função para cancelar pagamento
  const confirmCancelPayment = async () => {
    if (!id) return;

    try {
      await handleCancelPayment(id as string);
      setShowConfirmDialog(false);
      // Recarregar dados após o cancelamento
      refetch();
    } catch (error) {
      console.error("Erro ao cancelar pagamento:", error);
    }
  };

  // Função para obter o ícone de status
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
        <Button className="mt-4" onClick={() => router.push("/payments")}>
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
            onClick={() => router.push("/payments")}
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
              `Pagamento - ${translatePaymentType(payment.type)}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações Principais */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Coluna de Detalhes do Pagamento */}
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

            {/* Coluna de Informações Relacionadas */}
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
                      onClick={() => router.push(`/customers/${customer._id}`)}
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
                      onClick={() =>
                        router.push(`/legacy-clients/${legacyClient._id}`)
                      }
                    >
                      {legacyClient.name}
                    </Button>
                  </div>
                )}
                {payment.createdBy && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Registrado por:</span>
                    <span>{employee?.name || payment.createdBy}</span>
                  </div>
                )}
                {payment.orderId && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pedido:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => router.push(`/orders/${payment.orderId}`)}
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
                      onClick={() =>
                        router.push(`/cash-register/${payment.cashRegisterId}`)
                      }
                    >
                      Ver Caixa
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição ou Observações */}
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

          {/* Histórico de Alterações */}
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
            <Button variant="outline" onClick={() => router.push("/payments")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button variant="outline" onClick={handlePrintReceipt}>
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
                    onClick={confirmCancelPayment}
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
