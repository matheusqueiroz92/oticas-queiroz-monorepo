"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { api } from "../../../services/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import type { Payment } from "@/app/types/payment";
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

import type { User } from "../../../types/user";
import type { Order } from "../../../types/order";
import type { LegacyClient } from "../../../types/legacy-client";

export default function PaymentDetailsPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [employee, setEmployee] = useState<User | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [legacyClient, setLegacyClient] = useState<LegacyClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obter detalhes do pagamento
        const response = await api.get(`/api/payments/${id}`);
        setPayment(response.data);

        // Se o pagamento tiver um cliente associado, buscar seus detalhes
        if (response.data.customerId) {
          try {
            const customerResponse = await api.get(
              `/api/users/${response.data.customerId}`
            );
            setCustomer(customerResponse.data);
          } catch (customerError) {
            console.error("Erro ao buscar dados do cliente:", customerError);
          }
        }

        // Se o pagamento tiver um funcionário associado, buscar seus detalhes
        if (response.data.employeeId) {
          try {
            const employeeResponse = await api.get(
              `/api/users/${response.data.employeeId}`
            );
            setEmployee(employeeResponse.data);
          } catch (employeeError) {
            console.error(
              "Erro ao buscar dados do funcionário:",
              employeeError
            );
          }
        }

        // Se o pagamento estiver relacionado a um pedido, buscar seus detalhes
        if (response.data.orderId) {
          try {
            const orderResponse = await api.get(
              `/api/orders/${response.data.orderId}`
            );
            setOrder(orderResponse.data);
          } catch (orderError) {
            console.error("Erro ao buscar dados do pedido:", orderError);
          }
        }

        // Se o pagamento estiver relacionado a um cliente legado, buscar seus detalhes
        if (response.data.legacyClientId) {
          try {
            const legacyClientResponse = await api.get(
              `/api/legacy-clients/${response.data.legacyClientId}`
            );
            setLegacyClient(legacyClientResponse.data);
          } catch (legacyClientError) {
            console.error(
              "Erro ao buscar dados do cliente legado:",
              legacyClientError
            );
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do pagamento:", error);
        setError("Não foi possível carregar os detalhes do pagamento.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPaymentDetails();
    }
  }, [id]);

  // Mutation para cancelar pagamento
  const cancelPayment = useMutation({
    mutationFn: async () => {
      if (!payment) throw new Error("Pagamento não encontrado");
      return api.post(`/api/payments/${payment._id}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso.",
      });

      // Atualizar o status do pagamento na interface
      if (payment) {
        setPayment({
          ...payment,
          status: "cancelled",
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao cancelar pagamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar o pagamento. Tente novamente.",
      });
    },
  });

  // Função para imprimir comprovante
  const handlePrintReceipt = () => {
    window.print();
    // Alternativa: criar uma nova janela com o conteúdo formatado para impressão
    // const printWindow = window.open('', '_blank');
    // if (printWindow) {
    //   printWindow.document.write('<html><head><title>Comprovante de Pagamento</title>');
    //   printWindow.document.write('</head><body>');
    //   printWindow.document.write(`<h1>Comprovante de Pagamento #${payment?._id}</h1>`);
    //   // Adicionar mais conteúdo do comprovante aqui
    //   printWindow.document.write('</body></html>');
    //   printWindow.document.close();
    //   printWindow.print();
    // }
  };

  // Função para formatar data
  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return "N/A";

    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para formatar data e hora
  const formatDateTime = (dateInput?: string | Date) => {
    if (!dateInput) return "N/A";

    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Traduzir tipo de pagamento
  const translatePaymentType = (type: string): string => {
    const typeMap: Record<string, string> = {
      sale: "Venda",
      debt_payment: "Pagamento de Débito",
      expense: "Despesa",
    };

    return typeMap[type] || type;
  };

  // Traduzir método de pagamento
  const translatePaymentMethod = (method: string): string => {
    const methodMap: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      check: "Cheque",
    };

    return methodMap[method] || method;
  };

  // Traduzir status
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      completed: "Concluído",
      pending: "Pendente",
      cancelled: "Cancelado",
    };

    return statusMap[status] || status;
  };

  // Função para obter a classe de status
  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error || "Pagamento não encontrado"}
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
            className={`text-sm px-3 py-1 ${getStatusClass(payment.status)}`}
          >
            {translateStatus(payment.status)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Pagamento #{payment._id.substring(0, 8)}</CardTitle>
            <div className="text-2xl font-bold text-green-700">
              R$ {payment.amount.toFixed(2)}
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
                  <span>{formatDate(payment.paymentDate)}</span>
                </div>
                {payment.installments && payment.installments > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Parcelas:</span>
                    <span>{payment.installments}x</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Categoria:</span>
                  <span>{payment.category || "Não especificada"}</span>
                </div>
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
                {employee && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Funcionário:</span>
                    <span>{employee.name}</span>
                  </div>
                )}
                {order && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pedido:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => router.push(`/orders/${order._id}`)}
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

          {/* Histórico de Alterações - Mock */}
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
            <AlertDialog>
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
                    onClick={() => cancelPayment.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {cancelPayment.isPending ? (
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
