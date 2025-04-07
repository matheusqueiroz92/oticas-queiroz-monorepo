"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/services/authService";
import { usePayments } from "@/hooks/usePayments";
import { useUsers } from "@/hooks/useUsers";
import ClientSearch from "@/components/Orders/ClientSearch";
import { formatCurrency } from "@/app/utils/formatters";

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  DollarSign,
  Loader2,
  Search,
  User,
  Store,
} from "lucide-react";

import type { Order } from "@/app/types/order";
import type { User as UserType } from "@/app/types/user";
import type { LegacyClient } from "@/app/types/legacy-client";
import type { CreatePaymentDTO } from "@/app/types/payment";
import { paymentFormSchema } from "@/schemas/payment-schema";
import { useOrders } from "@/hooks/useOrders";

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function NewPaymentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedEntityType, setSelectedEntityType] = useState<
    "customer" | "legacyClient" | null
  >(null);
  const [_customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [legacyClientSearch, setLegacyClientSearch] = useState("");
  const [showInstallments, setShowInstallments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableAutoSubmit, setEnableAutoSubmit] = useState(false);

  const {
    handleCreatePayment,
    isCreating,
    cashRegisterData,
    isLoadingCashRegister
  } = usePayments();

  const { customers, isLoading: isLoadingCustomers } = useUsers();

  const { orders, isLoading: isLoadingOrders } = useOrders();

  const { data: legacyClients = [], isLoading: isLoadingLegacyClients } =
    useQuery({
      queryKey: ["legacyClients", legacyClientSearch],
      queryFn: async () => {
        if (!legacyClientSearch || legacyClientSearch.length < 3) return [];
        const response = await api.get(
          `/api/legacy-clients?search=${legacyClientSearch}`
        );
        return response.data || [];
      },
      enabled: legacyClientSearch.length >= 3,
    });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      type: "sale",
      paymentMethod: "cash",
      paymentDate: new Date(),
      description: "",
      category: "",
      installments: 1,
      status: "completed",
    },
  });

  const { watch, setValue } = form;
  const paymentMethod = watch("paymentMethod");
  const paymentType = watch("type");

  // Adicionar useEffect para prevenir submissão automática
  useEffect(() => {
    // Esta função será executada quando o formulário carregar
    const handleBeforeUnload = (e: { preventDefault: () => void; }) => {
      if (step === 3 && !isSubmitting) {
        // Apenas prevenindo comportamentos inesperados no passo 3
        console.log("Prevenindo comportamento de unload inesperado");
        e.preventDefault();
      }
    };

    // Adiciona listener para eventos de submissão de formulário
    const handleFormSubmit = (e: { preventDefault: () => void; stopPropagation: () => void; }) => {
      // Se não estamos explicitamente permitindo submit automático
      if (step === 3 && !enableAutoSubmit) {
        console.log("Interceptando possível submit indesejado");
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Adiciona os listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('submit', handleFormSubmit, true); // 'true' para captura na fase de captura

    // Limpa os listeners quando o componente for desmontado
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('submit', handleFormSubmit, true);
    };
  }, [step, isSubmitting, enableAutoSubmit]);

  // Efeito para definir o número de parcelas
  useEffect(() => {
    setShowInstallments(paymentMethod === "credit");
    if (paymentMethod !== "credit") {
      setValue("installments", 1);
    }
  }, [paymentMethod, setValue]);

  // Efeito para limpar IDs relacionados quando o tipo de pagamento muda
  useEffect(() => {
    if (paymentType === "expense") {
      setValue("customerId", undefined);
      setValue("legacyClientId", undefined);
      setValue("orderId", undefined);
      setSelectedEntityType(null);
    }
  }, [paymentType, setValue]);

  // Efeito para definir o caixa quando estiver disponível
  useEffect(() => {
    if (cashRegisterData) {
      setValue("cashRegisterId", cashRegisterData);
    }
  }, [cashRegisterData, setValue]);

  const onSubmit = (data: PaymentFormValues) => {
    console.log("onSubmit chamado com step:", step);
    
    // Verificação adicional: só prosseguir se for explicitamente chamado no passo 3
    if (step !== 3 || isSubmitting) {
      console.log("Abortando onSubmit - não está no passo 3 ou já está em andamento");
      return;
    }
  
    // Marcar que estamos processando para evitar múltiplas chamadas
    setIsSubmitting(true);
    console.log("Iniciando submissão, isSubmitting definido como true");
  
    // Converter amount para número se for string
    let amountValue: number;
    
    if (typeof data.amount === 'string') {
      // Usar cast explícito para string antes de chamar replace
      amountValue = parseFloat((data.amount as string).replace(',', '.'));
    } else {
      amountValue = data.amount as number;
    }
    
    // Se não for um número válido, use 0
    if (isNaN(amountValue)) {
      amountValue = 0;
    }
  
    const paymentData: CreatePaymentDTO = {
      amount: amountValue, // Garantir que seja número
      type: data.type,
      paymentMethod: data.paymentMethod,
      date: data.paymentDate,
      description: data.description,
      category: data.category,
      cashRegisterId: data.cashRegisterId,
      customerId: data.customerId,
      legacyClientId: data.legacyClientId,
      orderId: data.orderId,
      status: data.status,
    };
  
    // Adicionar a lógica de parcelas apenas se necessário
    if (
      data.paymentMethod === "credit" &&
      data.installments &&
      data.installments > 1
    ) {
      paymentData.installments = {
        current: 1,
        total: data.installments,
        value: amountValue / data.installments, // Usar o valor convertido
      };
    }
  
    console.log("Enviando dados do pagamento:", paymentData);
  
    handleCreatePayment(paymentData)
      .then((response) => {
        console.log("Pagamento criado com sucesso:", response);
        if (response && response._id) {
          router.push(`/payments/${response._id}`);
        } else {
          router.push("/payments");
        }
      })
      .catch((error) => {
        console.error("Erro ao criar pagamento:", error);
        setIsSubmitting(false); // Re-habilitar o botão em caso de erro
      });
  };

  const nextStep = () => {
    if (step === 1) {
      const step1Fields = [
        "amount",
        "type",
        "paymentMethod",
        "paymentDate",
        "cashRegisterId",
      ] as const;
      const step1Valid = step1Fields.every((field) => {
        return form.trigger(field);
      });

      if (!step1Valid) {
        console.log("Validação do passo 1 falhou.");
        return;
      }
    }
    console.log("Avançando para o próximo passo...");
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Valor (R$) *</FormLabel>
            <FormControl>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="pl-10"
                  {...field}
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    // Converte para número ou 0 se vazio
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
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
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Pagamento *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <SelectItem value="check">Cheque</SelectItem>
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
          name="installments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Parcelas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    field.onChange(
                      e.target.value === ""
                        ? ""
                        : Number.parseInt(e.target.value, 10)
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

      <FormField
        control={form.control}
        name="cashRegisterId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Caixa *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o caixa" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoadingCashRegister ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                    Carregando...
                  </SelectItem>
                ) : !cashRegisterData ? (
                  <SelectItem value="no-cash" disabled>
                    Nenhum caixa disponível
                  </SelectItem>
                ) : (
                  <SelectItem value={cashRegisterData}>Caixa Aberto</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              {!cashRegisterData ? (
                <span className="text-red-500">
                  Você precisa abrir um caixa primeiro
                </span>
              ) : (
                "Caixa selecionado para este pagamento"
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status do Pagamento *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
    </div>
  );

  const renderStep2 = () => {
    if (paymentType === "expense") {
      return (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
            <h3 className="text-sm font-medium">Despesa</h3>
            <p className="text-sm mt-1">
              Registrando uma despesa. Você não precisa vincular a um cliente ou
              pedido.
            </p>
          </div>

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
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium">Informações Relacionadas</h3>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-medium">
              Selecione o tipo de cliente:
            </h4>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={
                  selectedEntityType === "customer" ? "default" : "outline"
                }
                onClick={() => {
                  setSelectedEntityType("customer");
                  setValue("legacyClientId", undefined);
                }}
                className="flex-1"
              >
                <User className="mr-2 h-4 w-4" />
                Cliente
              </Button>
              <Button
                type="button"
                variant={
                  selectedEntityType === "legacyClient" ? "default" : "outline"
                }
                onClick={() => {
                  setSelectedEntityType("legacyClient");
                  setValue("customerId", undefined);
                }}
                className="flex-1"
              >
                <Store className="mr-2 h-4 w-4" />
                Cliente Legado
              </Button>
            </div>
          </div>

          {selectedEntityType === "customer" && (
            <div className="space-y-4">
              <ClientSearch 
                customers={customers || []}
                form={form as any}
                onClientSelect={(clientId, name) => {
                  setValue("customerId", clientId);
                  setCustomerSearch(name);
                }}
              />

              {watch("customerId") && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-800">
                    Cliente selecionado
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {customers.find(
                      (c: UserType) => c._id === watch("customerId")
                    )?.name || "Cliente"}
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedEntityType === "legacyClient" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Buscar cliente legado por nome ou documento..."
                  value={legacyClientSearch}
                  onChange={(e) => setLegacyClientSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {isLoadingLegacyClients && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {legacyClientSearch &&
                legacyClientSearch.length >= 3 &&
                legacyClients.length > 0 && (
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    <ul className="space-y-2">
                      {legacyClients.map((client: LegacyClient) => (
                        <li
                          key={client._id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              CPF: {client.cpf}
                              {client.totalDebt > 0 && (
                                <span className="ml-2 text-red-500">
                                  Débito: R$ {client.totalDebt.toFixed(2)}
                                </span>
                              )}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setValue("legacyClientId", client._id);
                              setLegacyClientSearch(client.name);
                            }}
                          >
                            Selecionar
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {legacyClientSearch &&
                legacyClientSearch.length >= 3 &&
                legacyClients.length === 0 &&
                !isLoadingLegacyClients && (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum cliente legado encontrado
                  </div>
                )}

              {watch("legacyClientId") && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-800">
                    Cliente legado selecionado
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {legacyClients.find(
                      (c: LegacyClient) => c._id === watch("legacyClientId")
                    )?.name || "Cliente legado"}
                  </p>
                </div>
              )}
            </div>
          )}

          {(watch("customerId") || watch("legacyClientId")) &&
            paymentType === "sale" && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-medium">
                    Vincular a Pedido (Opcional)
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Buscar pedido..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {isLoadingOrders && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {orderSearch &&
                  orderSearch.length >= 3 &&
                  orders.length > 0 && (
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      <ul className="space-y-2">
                        {orders.map((order: Order) => (
                          <li
                            key={order._id}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                Pedido #{order._id.substring(0, 8)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Valor: R$ {order.totalPrice.toFixed(2)} -
                                Status: {order.status}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setValue("orderId", order._id);
                                setOrderSearch(
                                  `Pedido #${order._id.substring(0, 8)}`
                                );
                              }}
                            >
                              Selecionar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {orderSearch &&
                  orderSearch.length >= 3 &&
                  orders.length === 0 &&
                  !isLoadingOrders && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhum pedido encontrado
                    </div>
                  )}

                {watch("orderId") && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-800">
                      Pedido selecionado
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      #{watch("orderId")?.substring(0, 8)}
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="space-y-6">
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

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
          <h3 className="text-md font-medium text-blue-800">
            Resumo do Pagamento
          </h3>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-blue-700 font-medium">Valor:</div>
            <div className="text-blue-900">
              {typeof watch("amount") === "number" 
                ? formatCurrency(watch("amount")) 
                : "R$ 0,00"}
            </div>

            <div className="text-blue-700 font-medium">Tipo:</div>
            <div className="text-blue-900">
              {watch("type") === "sale"
                ? "Venda"
                : watch("type") === "debt_payment"
                  ? "Pagamento de Débito"
                  : "Despesa"}
            </div>

            <div className="text-blue-700 font-medium">Método:</div>
            <div className="text-blue-900">
              {watch("paymentMethod") === "cash"
                ? "Dinheiro"
                : watch("paymentMethod") === "credit"
                  ? "Cartão de Crédito"
                  : watch("paymentMethod") === "debit"
                    ? "Cartão de Débito"
                    : watch("paymentMethod") === "pix"
                      ? "PIX"
                      : "Cheque"}
            </div>

            <div className="text-blue-700 font-medium">Data:</div>
            <div className="text-blue-900">
              {watch("paymentDate")
                ? format(watch("paymentDate"), "dd/MM/yyyy", { locale: ptBR })
                : "Não selecionada"}
            </div>

            <div className="text-blue-700 font-medium">Status:</div>
            <div className="text-blue-900">
              {watch("status") === "completed" ? "Concluído" : "Pendente"}
            </div>

            {watch("paymentMethod") === "credit" &&
              watch("installments") &&
              (watch("installments") ?? 0) > 1 && (
                <>
                  <div className="text-blue-700 font-medium">Parcelas:</div>
                  <div className="text-blue-900">
                    {watch("installments")}x de {formatCurrency(
                      Number(watch("amount")) / (watch("installments") || 1)
                    )}
                  </div>
                </>
              )}

            {watch("customerId") && (
              <>
                <div className="text-blue-700 font-medium">Cliente:</div>
                <div className="text-blue-900">
                  {customers.find(
                    (c: UserType) => c._id === watch("customerId")
                  )?.name || "Cliente selecionado"}
                </div>
              </>
            )}

            {watch("legacyClientId") && (
              <>
                <div className="text-blue-700 font-medium">Cliente Legado:</div>
                <div className="text-blue-900">
                  {legacyClients.find(
                    (c: LegacyClient) => c._id === watch("legacyClientId")
                  )?.name || "Cliente legado selecionado"}
                </div>
              </>
            )}

            {watch("orderId") && (
              <>
                <div className="text-blue-700 font-medium">
                  Pedido vinculado:
                </div>
                <div className="text-blue-900">
                  #{watch("orderId")?.substring(0, 8) ?? ""}
                </div>
              </>
            )}

            {watch("type") === "expense" && watch("category") && (
              <>
                <div className="text-blue-700 font-medium">Categoria:</div>
                <div className="text-blue-900">{watch("category")}</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    console.log(`Renderizando passo ${step}...`);
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  const isCashRegisterOpen = !!cashRegisterData;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/payments")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Novo Pagamento</h1>
      </div>

      {!isCashRegisterOpen && !isLoadingCashRegister && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h3 className="text-lg font-medium">Nenhum caixa disponível</h3>
          <p className="mt-2">
            É necessário abrir um caixa antes de registrar um pagamento.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/cash-register/open")}
          >
            Abrir Caixa
          </Button>
        </div>
      )}

      {(isCashRegisterOpen || isLoadingCashRegister) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Informações Básicas"}
              {step === 2 && "Informações Relacionadas"}
              {step === 3 && "Detalhes e Confirmação"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Preencha os detalhes básicos do pagamento"}
              {step === 2 && "Relacione este pagamento a clientes ou pedidos"}
              {step === 3 && "Revise os detalhes e confirme o pagamento"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCashRegister ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form 
                  id="paymentForm" 
                  onSubmit={(e) => {
                    e.preventDefault(); // Sempre previna o comportamento padrão
                    
                    if (step === 3) {
                      // Execute o submit apenas se for explicitamente clicado no botão
                      form.handleSubmit(onSubmit)(e);
                    }
                  }}
                >
                  {renderStepContent()}
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                Anterior
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push("/payments")}
              >
                Cancelar
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isLoadingCashRegister || !isCashRegisterOpen}
              >
                Próximo
              </Button>
            ) : (
              <Button
                type="button" // Mudando para type="button" para controle manual
                onClick={(e) => {
                  // Evita comportamento padrão
                  e.preventDefault();
                  // Se estiver desabilitado, não faz nada
                  if (isCreating || isLoadingCashRegister || !isCashRegisterOpen || isSubmitting) {
                    return;
                  }
                  
                  // Validar e enviar manualmente
                  form.trigger().then((isValid) => {
                    if (isValid) {
                      console.log("Formulário válido, obtendo valores...");
                      const values = form.getValues();
                      
                      // Corrigindo o erro TypeScript
                      const amount = values.amount;
                      if (typeof amount === 'string') {
                        // Fazemos um cast explícito para string antes de chamar replace
                        values.amount = parseFloat((amount as string).replace(',', '.'));
                      }
                      
                      onSubmit(values as PaymentFormValues);
                    } else {
                      console.log("Formulário inválido, não enviando");
                    }
                  });
                }}
                disabled={
                  isCreating || isLoadingCashRegister || !isCashRegisterOpen || isSubmitting
                }
              >
                {isCreating || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Registrar Pagamento"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {(isCashRegisterOpen || isLoadingCashRegister) && (
        <div className="flex justify-between items-center py-2">
          <div className="flex space-x-2">
            <div
              className={`h-2 w-12 rounded-full ${
                step >= 1 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-2 w-12 rounded-full ${
                step >= 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-2 w-12 rounded-full ${
                step >= 3 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          </div>
          <div className="text-sm text-muted-foreground">Passo {step} de 3</div>
        </div>
      )}
    </div>
  );
}