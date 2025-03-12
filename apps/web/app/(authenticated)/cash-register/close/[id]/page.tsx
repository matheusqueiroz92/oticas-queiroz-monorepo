"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Calendar,
  AlertTriangle,
  CreditCard,
  Landmark,
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
} from "@/components/ui/alert-dialog";

import { useCashRegister } from "../../../../../hooks/useCashRegister";
import {
  getCashRegisterById,
  getCashRegisterSummary,
} from "@/app/services/cashRegister";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import type {
  ICashRegister,
  CloseCashRegisterDTO,
} from "@/app/types/cash-register";

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

// Esquema de validação para o formulário
const closeCashRegisterSchema = z.object({
  closingBalance: z.preprocess(
    (value) =>
      value === ""
        ? undefined
        : Number.parseFloat(String(value).replace(",", ".")),
    z.number().min(0, "O valor não pode ser negativo")
  ),
  observations: z.string().optional(),
});

type CloseCashRegisterFormValues = z.infer<typeof closeCashRegisterSchema>;

export default function CloseCashRegisterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [cashRegister, setCashRegister] = useState<ICashRegister | null>(null);
  const [summary, setSummary] = useState<RegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { handleCloseCashRegister } = useCashRegister();

  // Inicializar o formulário
  const form = useForm<CloseCashRegisterFormValues>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: {
      closingBalance: 0,
      observations: "",
    },
  });

  // Buscar dados do caixa
  useEffect(() => {
    const fetchCashRegister = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        setError(null);

        // Buscar detalhes do caixa
        const registerData = await getCashRegisterById(params.id);

        if (!registerData) {
          setError("Caixa não encontrado.");
          return;
        }

        // Verificar se o caixa está aberto
        if (registerData.status !== "open") {
          setError("Este caixa já está fechado.");
          return;
        }

        setCashRegister(registerData);

        // Predefinir o saldo de fechamento como o saldo atual
        form.setValue("closingBalance", registerData.currentBalance);

        // Buscar o resumo do caixa
        try {
          const summaryData = await getCashRegisterSummary(params.id);
          setSummary(summaryData);
        } catch (e) {
          console.error("Erro ao buscar resumo do caixa:", e);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do caixa:", error);
        setError(
          "Não foi possível carregar os dados do caixa. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCashRegister();
  }, [params.id, form]);

  // Função para lidar com envio do formulário
  const onSubmit = (data: CloseCashRegisterFormValues) => {
    setShowConfirmDialog(true);
  };

  // Função para confirmar fechamento
  const confirmClose = async () => {
    if (!cashRegister || !params.id) return;

    const data = form.getValues();

    try {
      await handleCloseCashRegister(params.id, data);
      router.push("/cash-register");
    } catch (error) {
      console.error("Erro ao fechar caixa:", error);
    }
  };

  // Calcular diferença entre saldo esperado e informado
  const calculateDifference = (): number => {
    const expectedBalance = cashRegister?.currentBalance || 0;
    const reportedBalance = form.watch("closingBalance") || 0;
    return reportedBalance - expectedBalance;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !cashRegister) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Erro</CardTitle>
            <CardDescription className="text-red-700">
              {error || "Não foi possível carregar os dados do caixa."}
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

  const difference = calculateDifference();
  const hasDifference = Math.abs(difference) > 0.001; // Usar uma pequena margem para evitar problemas de arredondamento

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/cash-register")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Fechar Caixa</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fechamento de Caixa</CardTitle>
          <CardDescription>
            Confira os valores e informe o saldo final para fechar o caixa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-blue-600 font-medium">
                      Caixa aberto em
                    </div>
                    <div className="text-blue-700">
                      {formatDate(cashRegister.openingDate)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">
                    Saldo Inicial
                  </div>
                  <div className="text-blue-700 font-semibold">
                    {formatCurrency(cashRegister.openingBalance)}
                  </div>
                </div>
              </div>
            </div>

            {summary && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Resumo do Movimento</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-sm text-green-600">
                      Total de Vendas
                    </div>
                    <div className="text-lg font-semibold text-green-700">
                      {formatCurrency(summary.payments?.sales?.total || 0)}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-md">
                    <div className="text-sm text-red-600">
                      Total de Despesas
                    </div>
                    <div className="text-lg font-semibold text-red-700">
                      {formatCurrency(summary.payments?.expenses?.total || 0)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-md">
                    <div className="text-sm text-purple-600">
                      Pgtos. de Débitos
                    </div>
                    <div className="text-lg font-semibold text-purple-700">
                      {formatCurrency(summary.payments?.debts?.received || 0)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Detalhamento por Método</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border p-3 rounded-md flex flex-col">
                      <div className="text-sm text-gray-500 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Dinheiro
                      </div>
                      <div className="font-medium">
                        {formatCurrency(
                          summary.payments?.sales?.byMethod?.cash || 0
                        )}
                      </div>
                    </div>
                    <div className="border p-3 rounded-md flex flex-col">
                      <div className="text-sm text-gray-500 flex items-center">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Crédito
                      </div>
                      <div className="font-medium">
                        {formatCurrency(
                          summary.payments?.sales?.byMethod?.credit || 0
                        )}
                      </div>
                    </div>
                    <div className="border p-3 rounded-md flex flex-col">
                      <div className="text-sm text-gray-500 flex items-center">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Débito
                      </div>
                      <div className="font-medium">
                        {formatCurrency(
                          summary.payments?.sales?.byMethod?.debit || 0
                        )}
                      </div>
                    </div>
                    <div className="border p-3 rounded-md flex flex-col">
                      <div className="text-sm text-gray-500 flex items-center">
                        <Landmark className="h-4 w-4 mr-1" />
                        PIX
                      </div>
                      <div className="font-medium">
                        {formatCurrency(
                          summary.payments?.sales?.byMethod?.pix || 0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <Form {...form}>
              <form
                id="closeCashRegisterForm"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="closingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo de Fechamento (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="0,00"
                            className="pl-10"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              // Permitir apenas números e vírgula
                              const value = e.target.value.replace(
                                /[^0-9,.]/g,
                                ""
                              );
                              field.onChange(value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Valor em dinheiro disponível ao fechar o caixa
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Exibir a diferença, se houver */}
                {hasDifference && (
                  <div
                    className={`p-4 rounded-md ${difference > 0 ? "bg-green-50" : "bg-red-50"}`}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle
                        className={`h-5 w-5 ${difference > 0 ? "text-green-600" : "text-red-600"}`}
                      />
                      <div>
                        <div
                          className={`font-medium ${difference > 0 ? "text-green-700" : "text-red-700"}`}
                        >
                          {difference > 0 ? "Sobra de caixa" : "Falta de caixa"}
                        </div>
                        <div className="text-sm mt-1">
                          {difference > 0
                            ? `O saldo informado está ${formatCurrency(difference)} maior que o esperado.`
                            : `O saldo informado está ${formatCurrency(Math.abs(difference))} menor que o esperado.`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre o fechamento do caixa (opcional)"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/cash-register")}
          >
            Cancelar
          </Button>
          <Button type="submit" form="closeCashRegisterForm">
            Fechar Caixa
          </Button>
        </CardFooter>
      </Card>

      {/* Diálogo de confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar fechamento do caixa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O caixa será fechado com o saldo
              de {formatCurrency(form.watch("closingBalance") || 0)}.
              {hasDifference && (
                <div className="mt-2 font-medium">
                  {difference > 0
                    ? `Há uma sobra de ${formatCurrency(difference)}.`
                    : `Há uma falta de ${formatCurrency(Math.abs(difference))}.`}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClose}
              className={
                hasDifference && difference < 0
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              Sim, fechar caixa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
