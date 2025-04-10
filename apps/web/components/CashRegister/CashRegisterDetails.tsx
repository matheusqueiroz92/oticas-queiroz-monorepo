import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Printer,
  User,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import type { ICashRegister } from "@/app/types/cash-register";
import type { IPayment } from "@/app/types/payment";
import { CashRegisterPaymentsTable } from "./CashRegisterPaymentsTable";
import { useUsers } from "@/hooks/useUsers";

interface CashRegisterDetailsProps {
  register: ICashRegister;
  summary: any;
  payments: IPayment[];
  isLoading: boolean;
  error: any;
  onGoBack: () => void;
  onPrint: () => void;
  onCloseCashRegister: (id: string) => void;
  translatePaymentType: (type: string) => string;
  translatePaymentMethod: (method: string) => string;
  getPaymentTypeClass: (type: string) => string;
}

export function CashRegisterDetails({
  register,
  summary,
  payments,
  isLoading,
  error,
  onGoBack,
  onPrint,
  onCloseCashRegister,
  translatePaymentType,
  translatePaymentMethod,
  getPaymentTypeClass,
}: CashRegisterDetailsProps) {
  const { getUserName } = useUsers();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !register) {
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
            <Button onClick={onGoBack}>
              Voltar para Caixas
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const calculateDifference = () => {
    if (register.status !== "closed" || !register.closingBalance)
      return null;

    const difference =
      register.closingBalance - register.currentBalance;
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
            onClick={onGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Caixa</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          {register.status === "open" && (
            <Button
              onClick={() => onCloseCashRegister(register._id)}
            >
              Fechar Caixa
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CircleDollarSign className="h-5 w-5 mr-2" />
              Dados do Caixa
              <Badge
                className={`ml-2 ${
                  register.status === "open"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }`}
              >
                {register.status === "open" ? "Aberto" : "Fechado"}
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
                      {formatDate(register.openingDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Aberto por</div>
                    <div className="font-medium">
                      {getUserName(register.openedBy)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Saldo Inicial</div>
                    <div className="font-medium">
                      {formatCurrency(register.openingBalance)}
                    </div>
                  </div>
                </div>

                {register.status === "open" ? (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm text-gray-500">Saldo Atual</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(register.currentBalance)}
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
                          {formatCurrency(register.closingBalance || 0)}
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
                          {register.closedBy || "-"}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {register.observations && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500">Observações</div>
                  <div className="p-3 bg-gray-50 rounded-md mt-1 text-sm">
                    {register.observations}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                  <span>{formatCurrency(register.currentBalance)}</span>
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="incoming">Entradas</TabsTrigger>
          <TabsTrigger value="outgoing">Saídas</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <CashRegisterPaymentsTable
            title="Todos os Pagamentos"
            description="Mostrando todos os pagamentos registrados neste caixa."
            payments={payments}
            translatePaymentType={translatePaymentType}
            translatePaymentMethod={translatePaymentMethod}
            getPaymentTypeClass={getPaymentTypeClass}
          />
        </TabsContent>
        <TabsContent value="incoming">
          <CashRegisterPaymentsTable
            title="Entradas"
            description="Mostrando apenas pagamentos de entrada (vendas e pagamentos de débitos)."
            payments={payments.filter(p => p.type === "sale" || p.type === "debt_payment")}
            translatePaymentType={translatePaymentType}
            translatePaymentMethod={translatePaymentMethod}
            getPaymentTypeClass={getPaymentTypeClass}
          />
        </TabsContent>
        <TabsContent value="outgoing">
          <CashRegisterPaymentsTable
            title="Saídas"
            description="Mostrando apenas pagamentos de saída (despesas)."
            payments={payments.filter(p => p.type === "expense")}
            translatePaymentType={translatePaymentType}
            translatePaymentMethod={translatePaymentMethod}
            getPaymentTypeClass={getPaymentTypeClass}
            showCategory={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}