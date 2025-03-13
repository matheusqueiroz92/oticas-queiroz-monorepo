"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/app/services/authService";
import { useToast } from "@/hooks/useToast";

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
  FileText,
} from "lucide-react";

// Importar tipos
import type { Order } from "@/app/types/order";
import type { User as UserType } from "@/app/types/user";
import type { LegacyClient } from "@/app/types/legacy-client";
import type { ICashRegister } from "@/app/types/cash-register";

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
  paymentMethod: z.enum(["credit", "debit", "cash", "pix", "check"] as const, {
    required_error: "Selecione o método de pagamento",
  }),
  paymentDate: z.date({
    required_error: "Selecione a data do pagamento",
  }),
  description: z.string().optional(),
  category: z.string().optional(),
  cashRegisterId: z.string({
    required_error: "Selecione o caixa",
  }),
  customerId: z.string().optional(),
  legacyClientId: z.string().optional(),
  orderId: z.string().optional(),
  installments: z.preprocess(
    (value) => (value === "" ? undefined : Number.parseInt(String(value), 10)),
    z.number().min(1, "Número mínimo de parcelas é 1").optional()
  ),
  status: z.enum(["pending", "completed"] as const, {
    required_error: "Selecione o status",
  }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function NewPaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cashRegisters, setCashRegisters] = useState<ICashRegister[]>([]);
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [legacyClients, setLegacyClients] = useState<LegacyClient[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [legacyClientSearch, setLegacyClientSearch] = useState("");
  const [showInstallments, setShowInstallments] = useState(false);
  const [step, setStep] = useState(1); // Controle da etapa atual do formulário
  const [selectedEntityType, setSelectedEntityType] = useState<
    "customer" | "legacyClient" | null
  >(null);

  // Inicializar o formulário
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: undefined,
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

  // Efeito para verificar se há um caixa aberto
  useEffect(() => {
    const fetchCashRegisters = async () => {
      try {
        setLoading(true);
        // Usar a rota correta
        const response = await api.get("/api/cash-registers/current");

        // Se encontrou um caixa aberto
        if (response.data?._id) {
          setCashRegisters([response.data]);
          setValue("cashRegisterId", response.data._id);
        } else {
          setCashRegisters([]);
        }
      } catch (error) {
        console.error("Erro ao buscar caixas:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os caixas disponíveis.",
        });
        setCashRegisters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCashRegisters();
  }, [setValue, toast]);

  // Buscar clientes quando o termo de busca mudar
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 3) return;

    const fetchCustomers = async () => {
      try {
        const response = await api.get(
          `/api/users?role=customer&search=${customerSearch}`
        );
        setCustomers(response.data || []);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };

    const timer = setTimeout(() => {
      fetchCustomers();
    }, 500);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Buscar clientes legados quando o termo de busca mudar
  useEffect(() => {
    if (!legacyClientSearch || legacyClientSearch.length < 3) return;

    const fetchLegacyClients = async () => {
      try {
        const response = await api.get(
          `/api/legacy-clients?search=${legacyClientSearch}`
        );
        setLegacyClients(response.data || []);
      } catch (error) {
        console.error("Erro ao buscar clientes legados:", error);
      }
    };

    const timer = setTimeout(() => {
      fetchLegacyClients();
    }, 500);

    return () => clearTimeout(timer);
  }, [legacyClientSearch]);

  // Buscar pedidos quando o termo de busca mudar
  useEffect(() => {
    if (!orderSearch || orderSearch.length < 3) return;

    const fetchOrders = async () => {
      try {
        const response = await api.get(`/api/orders?search=${orderSearch}`);
        setOrders(response.data || []);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    };

    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);

    return () => clearTimeout(timer);
  }, [orderSearch]);

  // Mutation para criar um novo pagamento
  const createPayment = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return api.post("/api/payments", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
      router.push(`/payments/${response.data._id}`);
    },
    onError: (error) => {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível registrar o pagamento. Verifique os dados e tente novamente.",
      });
    },
  });

  // Função para lidar com envio do formulário
  const onSubmit = (data: PaymentFormValues) => {
    createPayment.mutate(data);
  };

  // Avançar para o próximo passo
  const nextStep = () => {
    if (step === 1) {
      // Validar campos do passo 1
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
        return;
      }
    }
    setStep(step + 1);
  };

  // Voltar para o passo anterior
  const prevStep = () => {
    setStep(step - 1);
  };

  // Renderizar etapa 1 - Informações básicas do pagamento
  const renderStep1 = () => (
    <div className="space-y-6">
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
          name="paymentDate"
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
                {cashRegisters.length === 0 ? (
                  <SelectItem value="no-cash" disabled>
                    Nenhum caixa disponível
                  </SelectItem>
                ) : (
                  cashRegisters.map((register) => (
                    <SelectItem key={register._id} value={register._id}>
                      Caixa{" "}
                      {register.status === "open" ? "(Aberto)" : "(Fechado)"} -{" "}
                      {format(new Date(register.openingDate), "dd/MM/yyyy")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              {cashRegisters.length === 0 ? (
                <span className="text-red-500">
                  Você precisa abrir um caixa primeiro
                </span>
              ) : (
                "Selecione o caixa para este pagamento"
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

  // Renderizar etapa 2 - Informações relacionadas (cliente, pedido, etc.)
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
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Buscar cliente por nome, email ou CPF..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {customerSearch && customers.length > 0 && (
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {customers.map((customer) => (
                      <li
                        key={customer._id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.email} - CPF: {customer.cpf}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setValue("customerId", customer._id);
                            setCustomerSearch(customer.name);
                          }}
                        >
                          Selecionar
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {watch("customerId") && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-800">
                    Cliente selecionado
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {customers.find((c) => c._id === watch("customerId"))
                      ?.name || "Cliente"}
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

              {legacyClientSearch && legacyClients.length > 0 && (
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {legacyClients.map((client) => (
                      <li
                        key={client._id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Documento: {client.identifier}
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

              {watch("legacyClientId") && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-800">
                    Cliente legado selecionado
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {legacyClients.find(
                      (c) => c._id === watch("legacyClientId")
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

                {orderSearch && orders.length > 0 && (
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    <ul className="space-y-2">
                      {orders.map((order) => (
                        <li
                          key={order._id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">
                              Pedido #{order._id.substring(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Valor: R$ {order.totalPrice.toFixed(2)} - Status:{" "}
                              {order.status}
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

  // Renderizar etapa 3 - Descrição e confirmação
  const renderStep3 = () => (
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
            R$ {watch("amount")?.toFixed(2) || "0.00"}
          </div>

          <div className="text-blue-700 font-medium">Tipo:</div>
          <div className="text-blue-900">
            {watch("type") === "sale" && "Venda"}
            {watch("type") === "debt_payment" && "Pagamento de Débito"}
            {watch("type") === "expense" && "Despesa"}
          </div>

          <div className="text-blue-700 font-medium">Método:</div>
          <div className="text-blue-900">
            {watch("paymentMethod") === "cash" && "Dinheiro"}
            {watch("paymentMethod") === "credit" && "Cartão de Crédito"}
            {watch("paymentMethod") === "debit" && "Cartão de Débito"}
            {watch("paymentMethod") === "pix" && "PIX"}
            {watch("paymentMethod") === "check" && "Cheque"}
          </div>

          {watch("paymentMethod") === "credit" &&
            (watch("installments") ?? 0) > 1 && (
              <>
                <div className="text-blue-700 font-medium">Parcelas:</div>
                <div className="text-blue-900">{watch("installments")}x</div>
              </>
            )}

          <div className="text-blue-700 font-medium">Data:</div>
          <div className="text-blue-900">
            {watch("paymentDate") &&
              format(watch("paymentDate"), "dd/MM/yyyy", { locale: ptBR })}
          </div>

          <div className="text-blue-700 font-medium">Status:</div>
          <div className="text-blue-900">
            {watch("status") === "completed" && "Concluído"}
            {watch("status") === "pending" && "Pendente"}
          </div>

          {watch("category") && (
            <>
              <div className="text-blue-700 font-medium">Categoria:</div>
              <div className="text-blue-900">{watch("category")}</div>
            </>
          )}

          {watch("customerId") &&
            customers.find((c) => c._id === watch("customerId")) && (
              <>
                <div className="text-blue-700 font-medium">Cliente:</div>
                <div className="text-blue-900">
                  {customers.find((c) => c._id === watch("customerId"))?.name}
                </div>
              </>
            )}

          {watch("legacyClientId") &&
            legacyClients.find((c) => c._id === watch("legacyClientId")) && (
              <>
                <div className="text-blue-700 font-medium">Cliente Legado:</div>
                <div className="text-blue-900">
                  {
                    legacyClients.find((c) => c._id === watch("legacyClientId"))
                      ?.name
                  }
                </div>
              </>
            )}

          {watch("orderId") && (
            <>
              <div className="text-blue-700 font-medium">Pedido:</div>
              <div className="text-blue-900">
                #{watch("orderId")?.substring(0, 8)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Determinar qual etapa renderizar
  const renderStepContent = () => {
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

      {cashRegisters.length === 0 && (
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
          <Form {...form}>
            <form id="paymentForm" onSubmit={form.handleSubmit(onSubmit)}>
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep}>
              Anterior
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push("/payments")}>
              Cancelar
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              form="paymentForm"
              disabled={createPayment.isPending || loading}
            >
              {createPayment.isPending ? (
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

      {/* Progresso do formulário */}
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
    </div>
  );
}
