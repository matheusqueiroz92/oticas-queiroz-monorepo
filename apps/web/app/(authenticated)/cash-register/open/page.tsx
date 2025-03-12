"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../services/auth";
import { useToast } from "@/hooks/use-toast";

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
import { ArrowLeft, Loader2, DollarSign, Calendar } from "lucide-react";

// Esquema de validação para o formulário
const openCashRegisterSchema = z.object({
  openingBalance: z.preprocess(
    (value) =>
      value === ""
        ? undefined
        : Number.parseFloat(String(value).replace(",", ".")),
    z.number().min(0, "O valor não pode ser negativo")
  ),
  observations: z.string().optional(),
});

type OpenCashRegisterFormValues = z.infer<typeof openCashRegisterSchema>;

export default function OpenCashRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasCashRegisterOpen, setHasCashRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicializar o formulário
  const form = useForm<OpenCashRegisterFormValues>({
    resolver: zodResolver(openCashRegisterSchema),
    defaultValues: {
      openingBalance: 0,
      observations: "",
    },
  });

  // Verificar se já existe um caixa aberto - CORRIGIDO: usando useEffect em vez de useState
  useEffect(() => {
    const checkCashRegister = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/cash-registers/current");
        if (response.data && response.data.status === "open") {
          setHasCashRegisterOpen(true);
          toast({
            variant: "destructive",
            title: "Caixa já aberto",
            description:
              "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
          });
        }
      } catch (error) {
        // Se retornar 404, significa que não há caixa aberto
        console.log("Nenhum caixa aberto encontrado");
      } finally {
        setLoading(false);
      }
    };

    checkCashRegister();
  }, [toast]); // Adicionando toast como dependência

  // Mutation para abrir caixa
  const openCashRegister = useMutation({
    mutationFn: async (data: OpenCashRegisterFormValues) => {
      return api.post("/api/cash-registers/open", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Caixa aberto",
        description: "O caixa foi aberto com sucesso.",
      });
      router.push("/cash-register");
    },
    onError: (error) => {
      console.error("Erro ao abrir caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível abrir o caixa. Tente novamente.",
      });
    },
  });

  // Função para lidar com envio do formulário
  const onSubmit = (data: OpenCashRegisterFormValues) => {
    openCashRegister.mutate(data);
  };

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
        <h1 className="text-2xl font-bold">Abrir Caixa</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : hasCashRegisterOpen ? (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Caixa já aberto</CardTitle>
            <CardDescription className="text-red-700">
              Já existe um caixa aberto no sistema. Você precisa fechar o caixa
              atual antes de abrir um novo.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => router.push("/cash-register")}
              className="mr-2"
            >
              Voltar
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Abertura de Caixa</CardTitle>
            <CardDescription>
              Informe o saldo inicial e observações para abrir o caixa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                id="openCashRegisterForm"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="bg-blue-50 p-4 rounded-md mb-6 flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-blue-600 font-medium">
                      Data de Abertura
                    </div>
                    <div className="text-blue-700">
                      {format(new Date(), "PPP", { locale: ptBR })} às{" "}
                      {format(new Date(), "HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="openingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo Inicial (R$)</FormLabel>
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
                        Valor em dinheiro disponível no início do dia
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre a abertura do caixa (opcional)"
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/cash-register")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="openCashRegisterForm"
              disabled={openCashRegister.isPending}
            >
              {openCashRegister.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Abrir Caixa"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
