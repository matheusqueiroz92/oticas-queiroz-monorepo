"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, getLoggedUser } from "../../../services/auth";
import type { Customer } from "../../../types/customer";

// Componentes
import ClientSearch from "../../../../components/forms/OrderForm/ClientSearch";
import PrescriptionForm from "../../../../components/forms/OrderForm/PrescriptionForm";
import OrderPdfGenerator from "../../../../components/OrderPdfGenerator";

// Schema atualizado de acordo com o backend
const orderFormSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  customClientName: z.string().optional(),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  product: z.string().min(1, "Descrição do produto é obrigatória"),
  glassesType: z.enum(["prescription", "sunglasses"]),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  paymentEntry: z.number().min(0).optional(),
  installments: z.number().min(1).optional(),
  deliveryDate: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório"),
  lensType: z.string().optional(),
  observations: z.string().optional(),
  totalPrice: z.number().min(0, "O preço total deve ser maior ou igual a zero"),
  prescriptionData: z
    .object({
      doctorName: z.string().optional(),
      clinicName: z.string().optional(),
      appointmentDate: z.string().optional(),
      leftEye: z.object({
        near: z.object({
          sph: z.number(),
          cyl: z.number(),
          axis: z.number(),
          pd: z.number(),
        }),
        far: z.object({
          sph: z.number(),
          cyl: z.number(),
          axis: z.number(),
          pd: z.number(),
        }),
      }),
      rightEye: z.object({
        near: z.object({
          sph: z.number(),
          cyl: z.number(),
          axis: z.number(),
          pd: z.number(),
        }),
        far: z.object({
          sph: z.number(),
          cyl: z.number(),
          axis: z.number(),
          pd: z.number(),
        }),
      }),
    })
    .optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loggedEmployee, setLoggedEmployee] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [showInstallments, setShowInstallments] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      clientId: "",
      customClientName: "",
      employeeId: "",
      product: "",
      glassesType: "sunglasses",
      paymentMethod: "",
      paymentEntry: 0,
      installments: undefined,
      // Data padrão para hoje
      deliveryDate: getTomorrowDate(), // Formato YYYY-MM-DD
      status: "pending",
      lensType: "",
      observations: "",
      totalPrice: 0,
      prescriptionData: {
        doctorName: "",
        clinicName: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        leftEye: {
          near: { sph: 0, cyl: 0, axis: 0, pd: 0 },
          far: { sph: 0, cyl: 0, axis: 0, pd: 0 },
        },
        rightEye: {
          near: { sph: 0, cyl: 0, axis: 0, pd: 0 },
          far: { sph: 0, cyl: 0, axis: 0, pd: 0 },
        },
      },
    },
  });

  // useEffect para atualizar campos ocultos quando o tipo de óculos mudar
  useEffect(() => {
    // Observar mudanças no tipo de óculos
    const subscription = form.watch((value, { name }) => {
      if (name === "glassesType") {
        const isGraduated = value.glassesType === "prescription";
        setShowPrescription(isGraduated);

        // Se não for óculos de grau, definir valores padrão para campos obrigatórios
        if (!isGraduated) {
          form.setValue("lensType", "Não aplicável");
          form.setValue("deliveryDate", new Date().toISOString().split("T")[0]);

          form.setValue("prescriptionData.doctorName", "Não aplicável");
          form.setValue("prescriptionData.clinicName", "Não aplicável");
          form.setValue(
            "prescriptionData.appointmentDate",
            new Date().toISOString().split("T")[0]
          );
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Observar mudanças na forma de pagamento
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "paymentMethod") {
        const method = value.paymentMethod;
        setShowInstallments(method === "credit" || method === "installment");
      }

      if (name === "glassesType") {
        setShowPrescription(value.glassesType === "prescription");
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Carregar dados do funcionário logado
  useEffect(() => {
    const userData = getLoggedUser();
    if (userData) {
      setLoggedEmployee(userData);
      form.setValue("employeeId", userData.id);
    }
  }, [form]);

  // Buscar clientes ao carregar a página
  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersResponse = await api.get("/api/users", {
          params: { role: "customer" },
        });
        const customersData = Array.isArray(customersResponse.data)
          ? customersResponse.data
          : customersResponse.data.users || [];
        setCustomers(customersData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setCustomers([]);
      }
    };

    fetchData();
  }, []);

  const handleClientSelect = (clientId: string, name: string) => {
    form.setValue("clientId", clientId);
    if (clientId === "custom") {
      form.setValue("customClientName", name);
      setSelectedCustomer(null);
    } else {
      const customer = customers.find((c) => c._id === clientId);
      setSelectedCustomer(customer || null);
    }
  };

  // Função para calcular valor das parcelas
  const calculateInstallmentValue = () => {
    const totalPrice = form.getValues("totalPrice") || 0;
    const installments = form.getValues("installments") || 1;
    const paymentEntry = form.getValues("paymentEntry") || 0;

    if (installments <= 0) return 0;

    const remainingAmount = totalPrice - paymentEntry;
    return remainingAmount <= 0 ? 0 : remainingAmount / installments;
  };

  const calculateInstallmentDisplay = () => {
    const value = calculateInstallmentValue();
    return value.toFixed(2);
  };

  // Mutação para criar um novo pedido
  const createOrder = useMutation({
    mutationFn: async (data: OrderFormData) => {
      // Valores padrão para campos obrigatórios
      const defaultDoctorName = "Não aplicável";
      const defaultClinicName = "Não aplicável";

      // Preparar dados para o backend
      const orderData = {
        ...data,
        clientId: data.clientId === "custom" ? undefined : data.clientId,
        customClientName:
          data.clientId === "custom" ? data.customClientName : undefined,
        // Garantir que os campos obrigatórios sejam sempre enviados com valores válidos
        deliveryDate: data.deliveryDate || getTomorrowDate(),
        prescriptionData: {
          doctorName:
            data.glassesType === "prescription"
              ? data.prescriptionData?.doctorName
              : defaultDoctorName,
          clinicName:
            data.glassesType === "prescription"
              ? data.prescriptionData?.clinicName
              : defaultClinicName,
          appointmentDate:
            data.glassesType === "prescription"
              ? data.prescriptionData?.appointmentDate
              : new Date().toISOString().split("T")[0],
          leftEye: {
            near: { sph: 0, cyl: 0, axis: 0, pd: 0 },
            far: { sph: 0, cyl: 0, axis: 0, pd: 0 },
          },
          rightEye: {
            near: { sph: 0, cyl: 0, axis: 0, pd: 0 },
            far: { sph: 0, cyl: 0, axis: 0, pd: 0 },
          },
        },
        // Enviar campos opcionais normalmente
        lensType:
          data.glassesType === "prescription" ? data.lensType : "Não aplicável",
      };

      console.log("Dados enviados para API:", orderData);

      return api.post("/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Pedido criado",
        description: "O pedido foi criado com sucesso.",
      });

      // Mostrar opção de download do PDF
      setShowPdfDownload(true);
    },
    onError: (error) => {
      console.error("Erro ao criar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar pedido. Tente novamente.",
      });
    },
  });

  const onSubmit = (data: OrderFormData) => {
    createOrder.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo Pedido</CardTitle>
          <CardDescription>Crie um novo pedido de óculos</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mostrar informações do funcionário logado */}
          {loggedEmployee && (
            <div className="mb-6 p-3 bg-blue-50 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Vendedor:</span>{" "}
                {loggedEmployee.name}
              </p>
            </div>
          )}

          {/* Se não estiver mostrando o PDF, mostra o formulário */}
          {!showPdfDownload ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Busca de Cliente */}
                <ClientSearch
                  customers={customers}
                  form={form}
                  onClientSelect={handleClientSelect}
                />

                {/* Tipo de Óculos */}
                <FormField
                  control={form.control}
                  name="glassesType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Óculos</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setShowPrescription(value === "prescription");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de óculos" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prescription">
                            Óculos de Grau
                          </SelectItem>
                          <SelectItem value="sunglasses">
                            Óculos Solar
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descrição do Produto */}
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Descreva o produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preço do Óculos */}
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço do Óculos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) =>
                            field.onChange(Number.parseFloat(e.target.value))
                          }
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Forma de Pagamento */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setShowInstallments(
                            value === "credit" || value === "installment"
                          );
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit">
                            Cartão de Crédito
                          </SelectItem>
                          <SelectItem value="debit">
                            Cartão de Débito
                          </SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="installment">Parcelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor de Entrada (sempre mostrado) */}
                <FormField
                  control={form.control}
                  name="paymentEntry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Entrada</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) => {
                            const value = Number.parseFloat(e.target.value);
                            field.onChange(Number.isNaN(value) ? 0 : value);
                          }}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos condicionais para parcelas */}
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
                            min={1}
                            max={12}
                            placeholder="1"
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value);
                              field.onChange(Number.isNaN(value) ? 1 : value);
                            }}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Exibir valor das parcelas calculado */}
                {showInstallments && (form.watch("installments") ?? 0) > 0 && (
                  <div className="p-3 bg-gray-50 rounded-md mt-2">
                    <p className="font-medium">
                      Valor das parcelas: R$ {calculateInstallmentDisplay()}
                    </p>
                  </div>
                )}

                {/* Status do Pedido */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in_production">
                            Em Produção
                          </SelectItem>
                          <SelectItem value="ready">Pronto</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos condicionais para óculos de grau */}
                {showPrescription && (
                  <>
                    {/* Data de Entrega */}
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tipo de Lente */}
                    <FormField
                      control={form.control}
                      name="lensType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Lente</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de lente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monofocal">
                                Monofocal
                              </SelectItem>
                              <SelectItem value="bifocal">Bifocal</SelectItem>
                              <SelectItem value="multifocal">
                                Multifocal
                              </SelectItem>
                              <SelectItem value="progressiva">
                                Progressiva
                              </SelectItem>
                              <SelectItem value="fotocromica">
                                Fotocromática
                              </SelectItem>
                              <SelectItem value="outras">Outras</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dados da Receita */}
                    <PrescriptionForm form={form} />
                  </>
                )}

                {/* Observações */}
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre o pedido..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createOrder.isPending}>
                    {createOrder.isPending ? "Criando..." : "Criar Pedido"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            // Tela de sucesso com opção de download do PDF
            <div className="mt-6 p-4 bg-green-50 rounded-md">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Pedido criado com sucesso!
              </h3>
              <p className="mb-4">
                Você pode baixar o pedido em PDF para impressão.
              </p>

              <div className="flex flex-col space-y-2">
                <OrderPdfGenerator
                  formData={form.getValues()}
                  customer={selectedCustomer}
                />

                <Button type="button" onClick={() => router.push("/orders")}>
                  Voltar para Lista de Pedidos
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
