"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  DollarSign,
  Printer,
  User,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Landmark,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { useCashRegister } from "../../../../hooks/useCashRegister";
import { usePayments } from "../../../../hooks/usePayments";
import {
  formatCurrency,
  formatDate,
  translatePaymentType,
  translatePaymentMethod,
  getPaymentTypeClass,
} from "@/app/utils/formatters";
import type { IPayment } from "@/app/types/payment";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import {
  getCashRegisterById,
  getCashRegisterSummary,
} from "@/app/services/cashRegisterService";
import { getPaymentsByCashRegister } from "@/app/services/paymentService";

interface RegisterSummary {
  register: {
    _id: string;
    openingDate: string | Date;
    status: string;
    openingBalance: number;
    currentBalance: number;
    closingBalance?: number;
    // Outros campos possíveis
  };
  payments: {
    sales: {
      total: number;
      byMethod: Record<string, number>;
    };
    debts: {
      received: number;
      byMethod: Record<string, number>;
    };
    expenses: {
      total: number;
      byCategory: Record<string, number>;
    };
  };
}

export default function CashRegisterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payments, setPayments] = useState<IPayment[]>([]);

  const { navigateToCloseRegister } = useCashRegister();

  // Buscar detalhes do caixa
  const {
    data: currentRegister,
    isLoading: isLoadingRegister,
    error: registerError,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.DETAIL(id as string),
    queryFn: () => getCashRegisterById(id as string),
    enabled: !!id,
  });

  // Buscar resumo do caixa
  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.SUMMARY(id as string),
    queryFn: () => getCashRegisterSummary(id as string),
    enabled: !!id,
  });

  // Buscar pagamentos relacionados
  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    error: paymentsError,
  } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.BY_CASH_REGISTER(id as string),
    queryFn: () => getPaymentsByCashRegister(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (paymentsData) {
      setPayments(paymentsData || []);
    }
  }, [paymentsData]);

  const isLoading = isLoadingRegister || isLoadingSummary || isLoadingPayments;
  const error = registerError || summaryError || paymentsError;
  // Função para imprimir relatório
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !currentRegister) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Erro</CardTitle>
            <CardDescription className="text-red-700">
              {error
                ? error.toString()
                : "Não foi possível carregar os detalhes do caixa."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/cash-register")}>
              Voltar para Caixas
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Calcular diferença para caixas fechados
  const calculateDifference = () => {
    if (currentRegister.status !== "closed" || !currentRegister.closingBalance)
      return null;

    const difference =
      currentRegister.closingBalance - currentRegister.currentBalance;
    return {
      value: difference,
      isPositive: difference >= 0,
    };
  };

  const difference = calculateDifference();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/cash-register")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Caixa</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          {currentRegister.status === "open" && (
            <Button
              onClick={() => navigateToCloseRegister(currentRegister._id)}
            >
              Fechar Caixa
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Informações Básicas */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CircleDollarSign className="h-5 w-5 mr-2" />
              Dados do Caixa
              <Badge
                className={`ml-2 ${
                  currentRegister.status === "open"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }`}
              >
                {currentRegister.status === "open" ? "Aberto" : "Fechado"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center space-x-2">
                  <CalendarClock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">
                      Data de Abertura
                    </div>
                    <div className="font-medium">
                      {formatDate(currentRegister.openingDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Aberto por</div>
                    <div className="font-medium">
                      {currentRegister.openedBy}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Saldo Inicial</div>
                    <div className="font-medium">
                      {formatCurrency(currentRegister.openingBalance)}
                    </div>
                  </div>
                </div>

                {currentRegister.status === "open" ? (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm text-gray-500">Saldo Atual</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(currentRegister.currentBalance)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">
                          Saldo de Fechamento
                        </div>
                        <div className="font-medium">
                          {formatCurrency(currentRegister.closingBalance || 0)}
                        </div>
                      </div>
                    </div>
                    {difference && (
                      <div className="flex items-center space-x-2 col-span-2">
                        {difference.isPositive ? (
                          <ChevronUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <div className="text-sm text-gray-500">
                            {difference.isPositive ? "Sobra" : "Falta"}
                          </div>
                          <div
                            className={`font-medium ${difference.isPositive ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(Math.abs(difference.value))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Fechado por</div>
                        <div className="font-medium">
                          {currentRegister.closedBy || "-"}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {currentRegister.observations && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500">Observações</div>
                  <div className="p-3 bg-gray-50 rounded-md mt-1 text-sm">
                    {currentRegister.observations}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <ReceiptText className="h-5 w-5 mr-2" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm">Total de Vendas</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(summary.payments?.sales?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm">Total de Despesas</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(summary.payments?.expenses?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm">Pagamento de Débitos</span>
                  <span className="font-medium">
                    {formatCurrency(summary.payments?.debts?.received || 0)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Saldo</span>
                  <span>{formatCurrency(currentRegister.currentBalance)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-2">
                Dados do resumo não disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Abas de Pagamentos */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="incoming">Entradas</TabsTrigger>
          <TabsTrigger value="outgoing">Saídas</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Pagamentos</CardTitle>
              <CardDescription>
                Mostrando todos os pagamentos registrados neste caixa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  Nenhum pagamento registrado para este caixa.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>
                          {payment.description ||
                            `Pagamento #${payment._id.substring(0, 8)}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getPaymentTypeClass(payment.type)}
                          >
                            {translatePaymentType(payment.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {translatePaymentMethod(payment.paymentMethod)}
                        </TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell
                          className={
                            payment.type === "expense"
                              ? "text-red-600 font-medium"
                              : "text-green-600 font-medium"
                          }
                        >
                          {payment.type === "expense" ? "-" : "+"}
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/payments/${payment._id}`)
                            }
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="incoming">
          <Card>
            <CardHeader>
              <CardTitle>Entradas</CardTitle>
              <CardDescription>
                Mostrando apenas pagamentos de entrada (vendas e pagamentos de
                débitos).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.filter(
                (p) => p.type === "sale" || p.type === "debt_payment"
              ).length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  Nenhuma entrada registrada para este caixa.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .filter(
                        (p) => p.type === "sale" || p.type === "debt_payment"
                      )
                      .map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            {payment.description ||
                              `Pagamento #${payment._id.substring(0, 8)}`}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getPaymentTypeClass(payment.type)}
                            >
                              {translatePaymentType(payment.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {translatePaymentMethod(payment.paymentMethod)}
                          </TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            +{formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/payments/${payment._id}`)
                              }
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="outgoing">
          <Card>
            <CardHeader>
              <CardTitle>Saídas</CardTitle>
              <CardDescription>
                Mostrando apenas pagamentos de saída (despesas).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.filter((p) => p.type === "expense").length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  Nenhuma despesa registrada para este caixa.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .filter((p) => p.type === "expense")
                      .map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            {payment.description ||
                              `Despesa #${payment._id.substring(0, 8)}`}
                          </TableCell>
                          <TableCell>
                            {payment.category || "Não categorizada"}
                          </TableCell>
                          <TableCell>
                            {translatePaymentMethod(payment.paymentMethod)}
                          </TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell className="text-red-600 font-medium">
                            -{formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/payments/${payment._id}`)
                              }
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
