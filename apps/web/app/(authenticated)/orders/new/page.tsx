"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/useToast";
import { api } from "@/app/services/authService";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Customer } from "@/app/types/customer";
import type { Product } from "@/app/types/product";
import Cookies from "js-cookie";
import { formatCurrency } from "@/app/utils/formatters";

// Importar o hook useOrders
import { useOrders } from "@/hooks/useOrders";

// Importando os tipos atualizados
import { 
  OrderFormValues, 
  OrderFormReturn,
  orderFormSchema 
} from "@/app/types/form-types";

// Componentes
import ClientSearch from "@/components/Orders/ClientSearch";
import ProductSearch from "@/components/Orders/ProductSearch";
import SelectedProductsList from "@/components/Orders/SelectedProductList";
import PrescriptionForm from "@/components/Orders/PrescriptionForm";
import OrderPdfGenerator from "@/components/Orders/exports/OrderPdfGenerator";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useProducts } from "@/hooks/useProducts";
import { normalizeProduct, getCorrectPrice } from "@/app/utils/product-utils";

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loggedEmployee, setLoggedEmployee] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [showInstallments, setShowInstallments] = useState(false);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);

  const { 
    fetchProductWithConsistentDetails
  } = useProducts();

  // Utilizar o hook useOrders
  const { handleCreateOrder, isCreating } = useOrders();

  // Função para obter a data de amanhã
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Inicialização do formulário com valores padrão
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as any, // Usamos 'as any' para resolver o problema de tipo temporariamente
    defaultValues: {
      employeeId: "",
      clientId: "",
      products: [],
      paymentMethod: "",
      paymentEntry: 0,
      installments: undefined,
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: getTomorrowDate(),
      status: "pending",
      laboratoryId: "",
      observations: "",
      totalPrice: 0,
      discount: 0,
      finalPrice: 0,
      prescriptionData: {
        doctorName: "",
        clinicName: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        leftEye: { sph: 0, cyl: 0, axis: 0, pd: 0 },
        rightEye: { sph: 0, cyl: 0, axis: 0, pd: 0 },
        nd: 0,
        oc: 0,
        addition: 0,
      },
    },
  });

  // Consulta para buscar produtos
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.ALL,
    queryFn: async () => {
      const response = await api.get("/api/products");
      return Array.isArray(response.data) ? response.data : response.data.products || [];
    },
  });

  // Consulta para buscar clientes
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: [QUERY_KEYS.USERS.CUSTOMERS()],
    queryFn: async () => {
      const response = await api.get("/api/users", { params: { role: "customer" } });
      return Array.isArray(response.data) ? response.data : response.data.users || [];
    },
  });

  // Observar mudanças na forma de pagamento
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "paymentMethod") {
        const method = value.paymentMethod;
        setShowInstallments(method === "credit" || method === "installment");
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Carregar dados do funcionário logado dos cookies
  useEffect(() => {
    const userId = Cookies.get("userId");
    const name = Cookies.get("name");
    const email = Cookies.get("email");
    const role = Cookies.get("role");

    if (userId && name && role) {
      const userData = {
        id: userId,
        name,
        email: email || "",
        role,
      };

      setLoggedEmployee(userData);
      form.setValue("employeeId", userData.id);
    }
  }, [form]);

  // Verificar localStorage para recuperar dados de form pendente (para casos de navegação)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFormData = window.localStorage.getItem('pendingOrderFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          // Restaurar dados básicos do formulário
          Object.entries(parsedData).forEach(([key, value]) => {
            // @ts-ignore
            form.setValue(key, value);
          });
          // Se houver produtos salvos, restaurá-los
          if (Array.isArray(parsedData.products) && parsedData.products.length > 0) {
            setSelectedProducts(parsedData.products);
          }
          // Limpar dados salvos
          window.localStorage.removeItem('pendingOrderFormData');
          toast({
            title: "Formulário recuperado",
            description: "Os dados do formulário anterior foram restaurados.",
          });
        } catch (error) {
          console.error("Erro ao restaurar dados do formulário:", error);
        }
      }
    }
  }, [form, toast]);

  // Funções para gerenciar produtos
  const handleAddProduct = async (product: Product) => {
    // Verificar se o produto já está selecionado
    if (selectedProducts.some(p => p._id === product._id)) {
      toast({
        variant: "destructive",
        title: "Produto já adicionado",
        description: "Este produto já está na lista."
      });
    return;
  }
  
  try {
    // Tenta buscar o produto atualizado com dados consistentes
    const freshProduct = await fetchProductWithConsistentDetails(product._id);
    
    // Define o produto a ser adicionado (ou o atualizado da API ou o normalizado original)
    const productToAdd = freshProduct || normalizeProduct(product);
    
    console.log("Produto normalizado:", productToAdd);
    
    setSelectedProducts([...selectedProducts, productToAdd]);
    
    // Atualizar os produtos no formulário
    const updatedProducts = [...selectedProducts, productToAdd];
    form.setValue("products", updatedProducts);
    
    // Recalcular preço total garantindo valores numéricos
    const newTotal = updatedProducts.reduce(
      (sum, p) => sum + getCorrectPrice(p), 0
    );
    
    console.log("Novo total calculado:", newTotal);
    
    form.setValue("totalPrice", newTotal);
    updateFinalPrice(newTotal, form.getValues("discount") || 0);
  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    toast({
      variant: "destructive",
      title: "Erro ao adicionar produto",
      description: "Ocorreu um erro ao processar o produto."
    });
  }
};

  const handleRemoveProduct = (productId: string) => {
    const newProducts = selectedProducts.filter(p => p._id !== productId);
    setSelectedProducts(newProducts);
    form.setValue("products", newProducts);
    
    // Recalcular preço total
    const newTotal = newProducts.reduce(
      (sum, p) => sum + (p.sellPrice || 0),
      0
    );
    form.setValue("totalPrice", newTotal);
    updateFinalPrice(newTotal, form.getValues("discount") || 0);
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    // Garantir que newPrice seja numérico
    const numericPrice = typeof newPrice === 'string' 
      ? parseFloat(newPrice) 
      : (newPrice || 0);
    
    const updatedProducts = selectedProducts.map(p => 
      p._id === productId ? { ...p, sellPrice: numericPrice } : p
    );
    setSelectedProducts(updatedProducts);
    console.log(updatedProducts);
    
    form.setValue("products", updatedProducts);
    
    // Recalcular preço total com valores numéricos garantidos
    const newTotal = updatedProducts.reduce(
      (sum, p) => {
        const price = typeof p.sellPrice === 'string' 
          ? parseFloat(p.sellPrice) 
          : (p.sellPrice || 0);
        return sum + price;
      }, 0
    );
    form.setValue("totalPrice", newTotal);
    updateFinalPrice(newTotal, form.getValues("discount") || 0);
  };

  // Função para atualizar preço final (total - desconto)
  const updateFinalPrice = (total: number, discount: number) => {
    const finalPrice = Math.max(0, total - discount);
    form.setValue("finalPrice", finalPrice);
  };

  // Handler para o campo de desconto
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discount = Number.parseFloat(e.target.value) || 0;
    form.setValue("discount", discount);
    updateFinalPrice(form.getValues("totalPrice") || 0, discount);
  };

  // Função para lidar com a seleção de cliente
  const handleClientSelect = (clientId: string, name: string) => {
    form.setValue("clientId", clientId);
    const customer = customersData?.find((c: Customer) => c._id === clientId);
    setSelectedCustomer(customer || null);
  };

  // Calcular valor das parcelas
  const calculateInstallmentValue = () => {
    const totalPrice = form.getValues("finalPrice") || 0;
    const installments = form.getValues("installments") || 1;
    const paymentEntry = form.getValues("paymentEntry") || 0;

    if (installments <= 0) return 0;

    const remainingAmount = totalPrice - paymentEntry;
    return remainingAmount <= 0 ? 0 : remainingAmount / installments;
  };

  // Função principal para enviar o formulário - agora usando o hook useOrders
  const onSubmit = async (data: OrderFormValues) => {
    // Validações adicionais antes de enviar
    if (selectedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "É necessário adicionar pelo menos um produto."
      });
      return;
    }

    try {
      // Transformar os dados para o formato esperado pela API
      const orderData = {
        clientId: data.clientId,
        employeeId: data.employeeId,
        products: data.products, // Array de produtos
        paymentMethod: data.paymentMethod,
        paymentEntry: data.paymentEntry,
        installments: data.installments,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate,
        status: data.status,
        laboratoryId: data.laboratoryId && data.laboratoryId.trim() !== "" 
          ? data.laboratoryId 
          : undefined,
        prescriptionData: {
          doctorName: data.prescriptionData.doctorName || "Não aplicável",
          clinicName: data.prescriptionData.clinicName || "Não aplicável",
          appointmentDate: data.prescriptionData.appointmentDate || new Date().toISOString().split("T")[0],
          leftEye: {
            sph: data.prescriptionData.leftEye.sph,
            cyl: data.prescriptionData.leftEye.cyl,
            axis: data.prescriptionData.leftEye.axis,
            pd: data.prescriptionData.leftEye.pd,
          },
          rightEye: {
            sph: data.prescriptionData.rightEye.sph,
            cyl: data.prescriptionData.rightEye.cyl,
            axis: data.prescriptionData.rightEye.axis,
            pd: data.prescriptionData.rightEye.pd,
          },
          nd: data.prescriptionData.nd,
          oc: data.prescriptionData.oc,
          addition: data.prescriptionData.addition,
        },
        observations: data.observations,
        totalPrice: data.totalPrice,
        discount: data.discount,
        finalPrice: data.finalPrice,
      };

      // Usar o handleCreateOrder do hook useOrders
      const newOrder = await handleCreateOrder(orderData as any);
      
      if (newOrder) {
        // Salvar dados do pedido para gerar PDF
        setSubmittedOrder(newOrder);
        
        // Mostrar opção de download do PDF
        setShowPdfDownload(true);

        toast({
          title: "Pedido criado com sucesso",
          description: `O pedido foi registrado com o ID: ${newOrder._id.substring(0, 8)}`,
        });
      }
    } catch (error: any) {
      let errorMessage = "Erro ao criar pedido. Tente novamente.";
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao criar pedido",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Novo Pedido</h1>
        <p className="text-muted-foreground">Preencha os dados para criar um novo pedido</p>
      </div>

      {isLoadingProducts || isLoadingCustomers ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Pedido</CardTitle>
            <CardDescription>
              Adicione produtos, informações do cliente e detalhes de pagamento
            </CardDescription>
          </CardHeader>

          {/* Se não estiver mostrando o PDF, mostrar o formulário */}
          {!showPdfDownload ? (
            <CardContent className="space-y-6">
              {/* Informações do Vendedor */}
              {loggedEmployee && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Vendedor:</span>{" "}
                    {loggedEmployee.name}
                  </p>
                </div>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Seção Cliente */}
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="text-lg font-medium">Informações do Cliente</h3>
                    
                    <ClientSearch
                      customers={customersData || []}
                      form={form}
                      onClientSelect={handleClientSelect}
                    />
                  </div>

                  {/* Seção Produtos */}
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="text-lg font-medium">Produtos</h3>
                    
                    <ProductSearch
                      products={productsData || []}
                      form={form}
                      onProductAdd={handleAddProduct}
                      selectedProducts={selectedProducts}
                    />
                    
                    <SelectedProductsList
                      products={selectedProducts}
                      onUpdatePrice={handleUpdateProductPrice}
                      onRemoveProduct={handleRemoveProduct}
                    />
                    
                    {/* Campos de preço total, desconto e preço final */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-3 bg-gray-50 rounded-md">
                      <FormField
                        control={form.control}
                        name="totalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Total</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                readOnly
                                {...field}
                                value={field.value || 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Desconto</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={handleDiscountChange}
                                value={field.value || 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="finalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Final</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                readOnly
                                {...field}
                                className="font-bold"
                                value={field.value || 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção de Pagamento */}
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="text-lg font-medium">Informações de Pagamento</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              value={field.value}
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

                      {/* Valor de Entrada */}
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
                    </div>

                    {/* Campos condicionais para parcelas */}
                    {showInstallments && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

                        {/* Exibir valor das parcelas calculado */}
                        {(form.watch("installments") ?? 0) > 0 && (
                          <div className="flex items-end">
                            <div className="p-3 bg-gray-50 rounded-md w-full">
                              <p className="font-medium">
                                Valor das parcelas:{" "}
                                {formatCurrency(calculateInstallmentValue())}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seção de Entrega */}
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="text-lg font-medium">Informações de Entrega</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Data do Pedido */}
                      <FormField
                        control={form.control}
                        name="orderDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data do Pedido</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Data de Entrega */}
                      <FormField
                        control={form.control}
                        name="deliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Entrega Prevista</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção de Receita Médica */}
                  <div className="p-4 border rounded-md space-y-4">
                    <PrescriptionForm form={form as OrderFormReturn} />
                  </div>

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
                    <Button 
                      type="submit" 
                      disabled={isCreating || selectedProducts.length === 0}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Pedido"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          ) : (
            // Tela de sucesso com opção de download do PDF
            <CardContent>
              <div className="p-6 bg-green-50 rounded-lg">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-1">
                    Pedido criado com sucesso!
                  </h3>
                  <p className="text-green-600">
                    ID do pedido: {submittedOrder?._id.substring(0, 8)}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <p className="text-center mb-4">
                    Você pode baixar o pedido em PDF para impressão ou prosseguir.
                  </p>
                  
                  <OrderPdfGenerator
                    formData={{
                      ...form.getValues(),
                      _id: submittedOrder?._id
                    }}
                    customer={selectedCustomer}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => router.push("/orders")}
                    >
                      Ver Lista de Pedidos
                    </Button>
                    
                    <Button 
                      type="button"
                      onClick={() => {
                        form.reset();
                        setSelectedProducts([]);
                        setSelectedCustomer(null);
                        setShowPdfDownload(false);
                      }}
                    >
                      Criar Novo Pedido
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
  
          {!showPdfDownload && (
            <CardFooter className="border-t pt-6 flex-col space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Ao criar um pedido, certifique-se de que todos os dados estão corretos.
                  Após a criação, algumas informações não poderão ser modificadas.
                </AlertDescription>
              </Alert>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}