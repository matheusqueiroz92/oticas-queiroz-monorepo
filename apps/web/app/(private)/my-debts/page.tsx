"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, CreditCard, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/ui/page-container";
import { useDebts } from "@/hooks/useDebts";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { ErrorAlert } from "@/components/ErrorAlert";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";

export default function MyDebtsPage() {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  const {
    debtsData,
    payments,
    isLoading,
    hasError,
    refetchDebts,
    refetchPayments,
  } = useDebts();

  const handleShowPaymentHistory = () => {
    setShowPaymentHistory(!showPaymentHistory);
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodMap: { [key: string]: { label: string; className: string } } = {
      credit: { label: "Cartão de Crédito", className: "bg-blue-100 text-blue-800" },
      debit: { label: "Cartão de Débito", className: "bg-green-100 text-green-800" },
      cash: { label: "Dinheiro", className: "bg-orange-100 text-orange-800" },
      pix: { label: "PIX", className: "bg-purple-100 text-purple-800" },
      bank_slip: { label: "Boleto", className: "bg-yellow-100 text-yellow-800" },
      promissory_note: { label: "Promissória", className: "bg-red-100 text-red-800" },
      check: { label: "Cheque", className: "bg-gray-100 text-gray-800" },
    };

    const methodInfo = methodMap[method] || { label: method, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={`${methodInfo.className} text-xs`}>
        {methodInfo.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Concluído", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={`${statusInfo.className} text-xs`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'debt_payment':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'sale':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (hasError) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <ErrorAlert message="Não foi possível carregar os dados dos seus débitos. Tente novamente mais tarde." />
          <Button
            onClick={() => {
              refetchDebts();
              refetchPayments();
            }}
            variant="outline"
          >
            Tentar Novamente
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Resumo dos Débitos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Débito Total</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(debtsData.totalDebt)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor total em aberto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos em Aberto</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {debtsData.orders.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pedidos com valor pendente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Pagamento</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {debtsData.paymentHistory.length > 0
                  ? formatDate(debtsData.paymentHistory[0].date)
                  : "Nenhum"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {debtsData.paymentHistory.length > 0
                  ? formatCurrency(debtsData.paymentHistory[0].amount)
                  : "Nenhum pagamento registrado"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pedidos com Débito */}
        {debtsData.orders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Pedidos com Valor Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debtsData.orders.map((order: any) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">
                          Pedido #{order.serviceOrder || "N/A"}
                        </p>
                        <Badge className={customBadgeStyles[order.status] || "bg-gray-100 text-gray-800"}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Data: {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(order.finalPrice)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Pago: {formatCurrency(order.paymentEntry || 0)}
                      </p>
                      <p className="text-sm font-medium text-red-600">
                        Restante: {formatCurrency(order.finalPrice - (order.paymentEntry || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Histórico de Pagamentos
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowPaymentHistory}
              >
                {showPaymentHistory ? "Ocultar" : "Mostrar"} Histórico
              </Button>
            </CardTitle>
          </CardHeader>
          {showPaymentHistory && (
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getPaymentTypeIcon(payment.type)}
                        <div>
                          <p className="font-medium">
                            {payment.type === 'debt_payment' ? 'Pagamento de Débito' : 'Pagamento de Venda'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPaymentMethodBadge(payment.paymentMethod)}
                        {getPaymentStatusBadge(payment.status)}
                        <div className="text-right">
                          <p className="font-semibold text-lg text-green-600">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum pagamento registrado</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                • Os débitos são atualizados automaticamente quando você faz um pedido ou efetua um pagamento.
              </p>
              <p>
                • Você pode quitar seus débitos diretamente na loja ou através dos métodos de pagamento disponíveis.
              </p>
              <p>
                • Em caso de dúvidas sobre seus débitos, entre em contato com nossa equipe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 