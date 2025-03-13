"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  DollarSign,
  Loader2,
} from "lucide-react";

import { CashRegisterStatus } from "@/components/CashRegister/CashRegisterStatus";
import type {
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  CreatePaymentDTO,
} from "@/app/types/payment";

// Esquema de validação para o formulário
const paymentFormSchema = z.object({
  amount: z.preprocess(
    (value) =>
      value === ""
        ? undefined
        : Number.parseFloat(String(value).replace(",", ".")),
    z.number().positive("O valor deve ser positivo")
  ),
  type: z.enum(["sale", "debt_payment", "expense"] as const, {
    required_error: "Selecione o tipo de pagamento",
  }),
  paymentMethod: z.enum(
    ["credit", "debit", "cash", "pix", "installment"] as const,
    {
      required_error: "Selecione o método de pagamento",
    }
  ),
  date: z.date({
    required_error: "Selecione a data do pagamento",
  }),
  description: z.string().optional(),
  category: z.string().optional(),
  // Torne o cashRegisterId opcional - será preenchido automaticamente no backend
  cashRegisterId: z.string().optional(),
  customerId: z.string().optional(),
  legacyClientId: z.string().optional(),
  orderId: z.string().optional(),
  installments: z
    .object({
      current: z.number().min(1),
      total: z.number().min(2),
      value: z.number(),
    })
    .optional(),
  status: z.enum(["pending", "completed"] as const, {
    required_error: "Selecione o status",
  }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  onSubmit: (data: CreatePaymentDTO) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<PaymentFormValues>;
  showCashRegisterStatus?: boolean;
}

export function PaymentForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  showCashRegisterStatus = true,
}: PaymentFormProps) {
  const [showInstallments, setShowInstallments] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Inicializar o formulário
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      type: "sale",
      paymentMethod: "cash",
      date: new Date(),
      description: "",
      category: "",
      installments: undefined,
      status: "completed",
      ...defaultValues,
    },
  });

  const { watch, setValue } = form;
  const paymentMethod = watch("paymentMethod");
  const paymentType = watch("type");
  const amount = watch("amount");

  // Efeito para definir o número de parcelas
  useEffect(() => {
    setShowInstallments(paymentMethod === "credit");
    if (paymentMethod !== "credit") {
      setValue("installments", undefined);
    }
  }, [paymentMethod, setValue]);

  // Efeito para limpar IDs relacionados quando o tipo de pagamento muda
  useEffect(() => {
    if (paymentType === "expense") {
      setValue("customerId", undefined);
      setValue("legacyClientId", undefined);
      setValue("orderId", undefined);
    }
  }, [paymentType, setValue]);

  // Função que converte os dados do formulário para o formato esperado pela API
  const handleFormSubmit = (formData: PaymentFormValues) => {
    // Criar uma cópia dos dados convertendo o campo installments corretamente
    const paymentData: CreatePaymentDTO = {
      ...formData,
      // Se for pagamento com crédito e o parcelamento for um número > 1
      installments:
        formData.paymentMethod === "credit" && formData.installments
          ? {
              current: 1, // Primeira parcela
              total: formData.installments.total || 1,
              value:
                (formData.amount || 0) / (formData.installments.total || 1), // Valor de cada parcela
            }
          : undefined,
    };

    onSubmit(paymentData);
  };

  return (
    <div className="space-y-6">
      {showCashRegisterStatus && <CashRegisterStatus showOpenButton />}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
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
                          const value = e.target.value.replace(/[^0-9,.]/g, "");
                          field.onChange(value);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Pagamento *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pagamento *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sale">Venda</SelectItem>
                      <SelectItem value="debt_payment">
                        Pagamento de Débito
                      </SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showInstallments && (
            <FormField
              control={form.control}
              name="installments.total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Parcelas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={field.value || ""}
                      onChange={(e) => {
                        const totalValue =
                          e.target.value === ""
                            ? undefined
                            : Number.parseInt(e.target.value, 10);

                        setValue(
                          "installments",
                          totalValue && totalValue > 1
                            ? {
                                current: 1,
                                total: totalValue,
                                value: amount / (totalValue || 1),
                              }
                            : undefined
                        );
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Aplicável apenas para pagamentos com cartão de crédito
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {paymentType === "expense" && (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria da Despesa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="utilidades">
                        Água/Luz/Internet
                      </SelectItem>
                      <SelectItem value="fornecedores">Fornecedores</SelectItem>
                      <SelectItem value="salarios">Salários</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="impostos">Impostos</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Pagamento *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição ou observações sobre este pagamento..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Adicione informações adicionais sobre este pagamento, se
                  necessário
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/payments")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Salvar Pagamento"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
