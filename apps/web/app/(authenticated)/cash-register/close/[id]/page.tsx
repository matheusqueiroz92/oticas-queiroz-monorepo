"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Calendar,
  AlertTriangle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useToast } from "@/hooks/useToast";
import { useCashRegister } from "@/hooks/useCashRegister";
import { getCashRegisterById } from "@/app/services/cashRegisterService";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import type {
  ICashRegister,
  CloseCashRegisterDTO,
} from "@/app/types/cash-register";

// Esquema de validação para o formulário
const closeCashRegisterSchema = z.object({
  closingBalance: z.preprocess(
    (value) =>
      value === "" || value === undefined
        ? 0
        : Number.parseFloat(String(value).replace(",", ".")),
    z.number().min(0, "O valor não pode ser negativo")
  ),
  observations: z.string().optional(),
});

type CloseCashRegisterFormValues = z.infer<typeof closeCashRegisterSchema>;

export default function CloseCashRegisterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [difference, setDifference] = useState<number | null>(null);

  const { toast } = useToast();
  const { handleCloseCashRegister } = useCashRegister();

  // Consulta para obter os dados do caixa
  const {
    data: cashRegister,
    isLoading,
    error: cashRegisterError,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.DETAIL(id as string),
    queryFn: () => getCashRegisterById(id as string),
    enabled: !!id,
  });

  // Mutation para fechar o caixa
  const closeCashRegisterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseCashRegisterDTO }) =>
      handleCloseCashRegister(id, data),
    onSuccess: () => {
      toast({
        title: "Caixa fechado",
        description: "O caixa foi fechado com sucesso.",
      });
      router.push("/cash-register");
    },
    onError: (error) => {
      console.error("Erro ao fechar caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fechar o caixa. Tente novamente.",
      });
      setShowConfirmDialog(false);
    },
  });

  // Inicializar o formulário
  const form = useForm<CloseCashRegisterFormValues>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: {
      closingBalance: 0,
      observations: "",
    },
  });

  useEffect(() => {
    if (cashRegister && cashRegister.status === "open") {
      form.setValue("closingBalance", cashRegister.currentBalance);
      setDifference(0); // Inicialmente não há diferença
    }
  }, [cashRegister, form]);

  // Observa mudanças no valor de fechamento para calcular a diferença
  const closingBalance = form.watch("closingBalance");

  // Atualizar a diferença quando o valor de fechamento mudar
  useEffect(() => {
    if (cashRegister && typeof closingBalance === "number") {
      setDifference(closingBalance - cashRegister.currentBalance);
    }
  }, [closingBalance, cashRegister]);

  // Função para lidar com envio do formulário
  const onSubmit = (data: CloseCashRegisterFormValues) => {
    // Verificar se o caixa existe e está aberto
    if (!cashRegister || cashRegister.status !== "open") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este caixa não pode ser fechado ou não existe.",
      });
      return;
    }

    // Mostrar diálogo de confirmação
    setShowConfirmDialog(true);
  };

  // Função para confirmar fechamento
  const confirmClose = () => {
    if (!cashRegister || !id) return;

    const data = form.getValues();

    closeCashRegisterMutation.mutate({
      id: id as string,
      data: {
        closingBalance: data.closingBalance,
        observations: data.observations,
      },
    });
  };

  // Tratar caso de erro ou caixa não existente
  if (cashRegisterError) {
    const errorMessage =
      cashRegisterError instanceof Error
        ? cashRegisterError.message
        : "Erro desconhecido ao carregar os dados do caixa";

    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Erro</CardTitle>
            <CardDescription className="text-red-700">
              {errorMessage}
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

  // Tratar caso de caixa já fechado
  if (cashRegister && cashRegister.status !== "open") {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Caixa já fechado</CardTitle>
            <CardDescription className="text-yellow-700">
              Este caixa já foi fechado e não pode ser fechado novamente.
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

  // Mostrar loading
  if (isLoading || !cashRegister) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasDifference = difference !== null && Math.abs(difference) > 0.001; // Usar uma pequena margem para evitar problemas de arredondamento

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informações do caixa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              Dados do Caixa
              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                Aberto
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">
                      Data de Abertura
                    </div>
                    <div className="font-medium">
                      {formatDate(cashRegister.openingDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Saldo Inicial</div>
                    <div className="font-medium">
                      {formatCurrency(cashRegister.openingBalance)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm text-gray-500">Saldo Atual</div>
                    <div className="font-medium text-green-600">
                      {formatCurrency(cashRegister.currentBalance)}
                    </div>
                  </div>
                </div>
              </div>
              {cashRegister.observations && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500">Observações</div>
                  <div className="p-3 bg-gray-50 rounded-md mt-1 text-sm">
                    {cashRegister.observations}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo financeiro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm">Total de Vendas</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(cashRegister.sales?.total || 0)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm">Dinheiro</span>
                <span className="font-medium">
                  {formatCurrency(cashRegister.sales?.cash || 0)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm">Cartão de Crédito</span>
                <span className="font-medium">
                  {formatCurrency(cashRegister.sales?.credit || 0)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm">Cartão de Débito</span>
                <span className="font-medium">
                  {formatCurrency(cashRegister.sales?.debit || 0)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm">PIX</span>
                <span className="font-medium">
                  {formatCurrency(cashRegister.sales?.pix || 0)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Saldo Final</span>
                <span>{formatCurrency(cashRegister.currentBalance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fechamento de Caixa</CardTitle>
          <CardDescription>
            Informe o valor final em dinheiro para fechar o caixa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="closingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Final em Caixa (R$) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="0,00"
                          className="pl-10"
                          {...field}
                          value={
                            field.value !== undefined
                              ? String(field.value).replace(".", ",")
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value.replace(
                              /[^0-9,.]/g,
                              ""
                            );
                            field.onChange(
                              value === ""
                                ? 0
                                : Number.parseFloat(value.replace(",", "."))
                            );
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Este valor deve representar o montante físico em dinheiro
                      presente no caixa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasDifference && (
                <Alert
                  variant={
                    difference && difference < 0 ? "destructive" : "default"
                  }
                  className="my-4"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {difference && difference < 0
                      ? "Falta dinheiro no caixa!"
                      : "Sobra de dinheiro no caixa!"}
                  </AlertTitle>
                  <AlertDescription>
                    {difference && difference < 0
                      ? `Há uma diferença negativa de ${formatCurrency(Math.abs(difference))}. Verifique se houve erro na contagem ou possível desvio.`
                      : `Há uma diferença positiva de ${formatCurrency(difference)}. Verifique se houve erro na contagem ou registro de vendas.`}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre o fechamento do caixa..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Adicione informações relevantes sobre o fechamento do
                      caixa, especialmente se houver diferenças no valor.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/cash-register")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={closeCashRegisterMutation.isPending}
                >
                  Fechar Caixa
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Fechamento de Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDifference
                ? "Há uma diferença entre o valor esperado e o valor informado. Deseja continuar?"
                : "Confirme o fechamento do caixa."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Saldo Esperado:</span>
                <span className="font-medium">
                  {formatCurrency(cashRegister.currentBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Saldo Informado:</span>
                <span className="font-medium">
                  {formatCurrency(closingBalance || 0)}
                </span>
              </div>

              {hasDifference && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span>Diferença:</span>
                    <span
                      className={`font-bold ${difference && difference < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {formatCurrency(difference || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeCashRegisterMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClose}
              disabled={closeCashRegisterMutation.isPending}
            >
              {closeCashRegisterMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Fechamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
