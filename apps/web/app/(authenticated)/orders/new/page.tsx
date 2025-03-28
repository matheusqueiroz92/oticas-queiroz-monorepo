"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { 
  Loader2, 
  Users, 
  ShoppingBag, 
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import type { Customer } from "@/app/types/customer";
import type { Product } from "@/app/types/product";
import Cookies from "js-cookie";
import { formatCurrency, getTomorrowDate } from "@/app/utils/formatters";

import { useOrders } from "@/hooks/useOrders";

import { 
  OrderFormValues, 
  OrderFormReturn,
} from "@/app/types/form-types";

import ClientSearch from "@/components/Orders/ClientSearch";
import ProductSearch from "@/components/Orders/ProductSearch";
import SelectedProductsList from "@/components/Orders/SelectedProductList";
import PrescriptionForm from "@/components/Orders/PrescriptionForm";
import OrderPdfGenerator from "@/components/Orders/exports/OrderPdfGenerator";
import { useProducts } from "@/hooks/useProducts";
import { normalizeProduct, getCorrectPrice, checkForLenses } from "@/app/utils/product-utils";
import { useCustomers } from "@/hooks/useCustomers";
import { createOrderform } from "@/schemas/order-schema";

// CSS para remover as setas dos inputs numéricos
const numericInputStyles = `
  /* Remove as setas para todos os navegadores */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

// Definição dos steps
const steps = [
  { id: "client", label: "Cliente e Produtos" },
  { id: "prescription", label: "Receita" },
  { id: "confirm", label: "Confirmação" }
];

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
  const [hasLenses, setHasLenses] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const { handleCreateOrder, isCreating } = useOrders();
  const {
    products: productsData,
    loading: isLoadingProducts,
    fetchProductWithConsistentDetails
  } = useProducts();

  const { 
    customers: customersData,
    isLoading: isLoadingCustomers
  } = useCustomers();

  const form = createOrderform();

  const handleCreateNewOrder = async (formData: OrderFormValues) => {
    if (selectedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "É necessário adicionar pelo menos um produto."
      });
      return;
    }
  
    try {
      const containsLenses = selectedProducts.some(product => 
        product.productType === 'lenses' || 
        (product.name && product.name.toLowerCase().includes('lente'))
      );
  
      const initialStatus = containsLenses ? 'pending' : 'ready';
  
      const orderData = {
        clientId: formData.clientId,
        employeeId: formData.employeeId,
        products: formData.products,
        serviceOrder: formData.serviceOrder,
        paymentMethod: formData.paymentMethod,
        paymentEntry: formData.paymentEntry,
        installments: formData.installments,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        status: initialStatus,
        laboratoryId: formData.laboratoryId && formData.laboratoryId.trim() !== "" 
          ? formData.laboratoryId 
          : undefined,
        prescriptionData: {
          doctorName: formData.prescriptionData.doctorName || "Não aplicável",
          clinicName: formData.prescriptionData.clinicName || "Não aplicável",
          appointmentDate: formData.prescriptionData.appointmentDate || new Date().toISOString().split("T")[0],
          leftEye: {
            sph: formData.prescriptionData.leftEye.sph,
            cyl: formData.prescriptionData.leftEye.cyl,
            axis: formData.prescriptionData.leftEye.axis,
            pd: formData.prescriptionData.leftEye.pd,
          },
          rightEye: {
            sph: formData.prescriptionData.rightEye.sph,
            cyl: formData.prescriptionData.rightEye.cyl,
            axis: formData.prescriptionData.rightEye.axis,
            pd: formData.prescriptionData.rightEye.pd,
          },
          nd: formData.prescriptionData.nd,
          oc: formData.prescriptionData.oc,
          addition: formData.prescriptionData.addition,
        },
        observations: formData.observations,
        totalPrice: formData.totalPrice,
        discount: formData.discount,
        finalPrice: formData.finalPrice,
      };
      
      console.log("Enviando pedido:", orderData);
  
      const newOrder = await handleCreateOrder(orderData as any);
      console.log("Resposta do pedido:", newOrder);
      
      if (newOrder) {
        setSubmittedOrder(newOrder);
        setShowPdfDownload(true);
  
        toast({
          title: "Pedido criado com sucesso",
          description: `O pedido foi registrado com o ID: ${newOrder._id.substring(0, 8)}`,
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar pedido:", error);
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
  
  const onSubmit = (data: OrderFormValues) => {
    console.log("onSubmit called with data:", data);
    handleCreateNewOrder(data);
  };

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

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "paymentMethod") {
        const method = value.paymentMethod;
        setShowInstallments(method === "credit" || method === "installment");
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFormData = window.localStorage.getItem('pendingOrderFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          Object.entries(parsedData).forEach(([key, value]) => {
            form.setValue(key, value);
          });
          if (Array.isArray(parsedData.products) && parsedData.products.length > 0) {
            setSelectedProducts(parsedData.products);
          }
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

  // Define a data de hoje como padrão para a data do pedido
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    form.setValue("orderDate", today);
    form.setValue("deliveryDate", today);
  }, [form]);

  const handleAddProduct = async (product: Product) => {
    if (selectedProducts.some(p => p._id === product._id)) {
      toast({
        variant: "destructive",
        title: "Produto já adicionado",
        description: "Este produto já está na lista."
      });
      return;
    }
    
    try {
      const freshProduct = await fetchProductWithConsistentDetails(product._id);
      
      const productToAdd = freshProduct || normalizeProduct(product);

      const updatedProducts = [...selectedProducts, productToAdd];
      setSelectedProducts(updatedProducts);
      
      const containsLenses = checkForLenses(updatedProducts);
      if (containsLenses && !hasLenses) {
        setHasLenses(true);
        form.setValue("deliveryDate", getTomorrowDate());
      } else if (!containsLenses && hasLenses) {
        setHasLenses(false);
        form.setValue("deliveryDate", new Date().toISOString().split("T")[0]);
      }
      
      form.setValue("products", updatedProducts);
      
      const newTotal = updatedProducts.reduce(
        (sum, p) => sum + getCorrectPrice(p), 0
      );
      
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
    
    const containsLenses = checkForLenses(newProducts);
    if (!containsLenses && hasLenses) {
      setHasLenses(false);
      form.setValue("deliveryDate", new Date().toISOString().split("T")[0]);
    }
    
    const newTotal = newProducts.reduce(
      (sum, p) => sum + (p.sellPrice || 0),
      0
    );
    form.setValue("totalPrice", newTotal);
    updateFinalPrice(newTotal, form.getValues("discount") || 0);
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    const numericPrice = typeof newPrice === 'string' 
      ? parseFloat(newPrice) 
      : (newPrice || 0);
    
    const updatedProducts = selectedProducts.map(p => 
      p._id === productId ? { ...p, sellPrice: numericPrice } : p
    );
    setSelectedProducts(updatedProducts);
    
    form.setValue("products", updatedProducts);
    
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

  const updateFinalPrice = (total: number, discount: number) => {
    const finalPrice = Math.max(0, total - discount);
    form.setValue("finalPrice", finalPrice);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discount = e.target.value ? Number.parseFloat(e.target.value) : '';
    form.setValue("discount", discount as number);
    updateFinalPrice(form.getValues("totalPrice") || 0, discount || 0);
  };

  const handleClientSelect = (clientId: string, name: string) => {
    form.setValue("clientId", clientId);
    const customer = customersData?.find((c: Customer) => c._id === clientId);
    setSelectedCustomer(customer || null);
  };

  const calculateInstallmentValue = () => {
    if (!form) return 0;
    
    const totalPrice = form.getValues("finalPrice") || 0;
    const installments = form.getValues("installments") || 1;
    const paymentEntry = form.getValues("paymentEntry") || 0;

    if (installments <= 0) return 0;

    const remainingAmount = totalPrice - paymentEntry;
    return remainingAmount <= 0 ? 0 : remainingAmount / installments;
  };

  const checkCanContinue = () => {
    let canContinue = true;
    
    if (!form) return false;
    
    switch (currentStep) {
      case 0: // Cliente e Produtos
        canContinue = !!form.getValues("clientId") && selectedProducts.length > 0 && !!form.getValues("paymentMethod");
        break;
      case 1: // Receita - sem validação obrigatória
        canContinue = true;
        break;
      case 2: // Confirmação
        canContinue = true;
        break;
    }
    
    return canContinue;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Renderiza o progresso dos steps
  const renderStepProgress = () => {
    return (
      <div className="w-full mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center"
              style={{ width: `${100/steps.length}%` }}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full 
                ${index < currentStep ? 'bg-green-500 text-white' : 
                  index === currentStep ? 'bg-primary text-white' : 
                  'bg-gray-200 text-gray-500'}
                ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
              onClick={() => {
                if (index <= currentStep) {
                  setCurrentStep(index);
                }
              }}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={`
                text-xs mt-1 text-center
                ${index === currentStep ? 'text-primary font-medium' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative w-full h-1 bg-gray-200 rounded-full mt-2">
          <div 
            className="absolute top-0 left-0 h-1 bg-primary rounded-full"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Renderiza o resumo do pedido
  const renderOrderSummary = () => {
    if (!form) return null;
    
    const totalPrice = form.getValues("totalPrice") || 0;
    const discount = form.getValues("discount") || 0;
    const finalPrice = form.getValues("finalPrice") || 0;
    
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 p-3">
          <h3 className="font-medium">Resumo do Pedido</h3>
        </div>
        
        <div className="p-3 space-y-3">
          {selectedProducts.length > 0 ? (
            <div className="space-y-2">
              {selectedProducts.map((product, index) => (
                <div key={product._id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-2">
                      <ShoppingBag className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.productType}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(product.sellPrice || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum produto adicionado</p>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-200">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto</span>
                <span>{formatCurrency(discount || 0)}</span>
              </div>
              
              <div className="flex justify-between font-medium pt-1 border-t border-gray-200 mt-1">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(finalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderiza a seção de pagamento
  const renderPaymentSection = () => {
    return (
      <div className="space-y-3 mt-4">
        <h3 className="text-sm font-medium border-b pb-1">Pagamento e Entrega</h3>
        
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Forma de Pagamento</FormLabel>
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
                  <SelectTrigger className="border border-gray-200 rounded text-sm h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="installment">Parcelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="paymentEntry"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Valor de Entrada</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    onChange={(e) => {
                      const value = e.target.value ? Number.parseFloat(e.target.value) : '';
                      field.onChange(value);
                    }}
                    value={field.value === 0 ? '' : (field.value as string | number | undefined)}
                    className="border border-gray-200 rounded text-sm h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showInstallments && (
            <FormField
              control={form.control}
              name="installments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nº de Parcelas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      placeholder="1"
                      onChange={(e) => {
                        const value = e.target.value ? Number.parseInt(e.target.value) : '';
                        field.onChange(value);
                      }}
                      value={field.value === 0 ? '' : (field.value as string | number | undefined)}
                      className="border border-gray-200 rounded text-sm h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {showInstallments && (form?.watch("installments") || 0) > 0 && (
          <div className="p-2 bg-blue-50 rounded text-sm text-blue-800 border border-blue-100 mt-1">
            Valor das parcelas: {formatCurrency(calculateInstallmentValue())}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Data do Pedido</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    className="border border-gray-200 rounded text-sm h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Data de Entrega</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="date" 
                      {...field} 
                      disabled={!hasLenses}
                      className={!hasLenses ? "bg-gray-100 cursor-not-allowed border border-gray-200 rounded text-sm h-9" : "border border-gray-200 rounded text-sm h-9"}
                    />
                    {!hasLenses && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs text-gray-500">Bloqueado</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                {!hasLenses ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione lentes para mudar a data.
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o pedido..."
                  className="min-h-[60px] border border-gray-200 rounded text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  // Renderizar o conteúdo baseado no step atual
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Cliente e Produtos
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium border-b pb-1">Informações do Cliente</h3>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <ClientSearch
                        customers={customersData || []}
                        form={form}
                        onClientSelect={handleClientSelect}
                      />
                    </div>

                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name="serviceOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nº da Ordem</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Número"
                                onChange={(e) => {
                                  const value = e.target.value ? Number.parseInt(e.target.value) : '';
                                  field.onChange(value);
                                }}
                                value={field.value === 0 ? '' : (field.value as string | number | undefined)}
                                className="border border-gray-200 rounded text-sm h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {selectedCustomer && (
                  <div className="bg-blue-50 p-2 rounded border border-blue-100 text-sm">
                    <p className="font-medium text-blue-800 mb-1">Cliente Selecionado</p>
                    <div className="grid grid-cols-2 gap-1">
                      <p><span className="font-medium">Nome:</span> {selectedCustomer.name}</p>
                      {selectedCustomer.email && (
                        <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                      )}
                      {selectedCustomer.phone && (
                        <p><span className="font-medium">Telefone:</span> {selectedCustomer.phone}</p>
                      )}
                      {selectedCustomer.cpf && (
                        <p><span className="font-medium">CPF:</span> {selectedCustomer.cpf}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium border-b pb-1">Produtos</h3>
                  
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
                  
                  <div className="grid grid-cols-3 gap-3 p-2 bg-gray-50 rounded border border-gray-200">
                    <FormField
                      control={form.control}
                      name="totalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Preço Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              readOnly
                              placeholder="0,00"
                              {...field}
                              value={field.value || ''}
                              className="border border-gray-200 bg-gray-100 rounded text-sm h-9"
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
                          <FormLabel className="text-xs">Desconto</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              onChange={handleDiscountChange}
                              value={field.value === 0 ? '' : field.value}
                              className="border border-gray-200 rounded text-sm h-9"
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
                          <FormLabel className="text-xs">Preço Final</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              readOnly
                              placeholder="0,00"
                              className="font-medium border border-gray-200 bg-gray-100 rounded text-sm h-9"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1 space-y-4">
                {renderOrderSummary()}
                {renderPaymentSection()}
              </div>
            </div>
          </div>
        );

      case 1: // Receita (Prescrição)
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium border-b pb-1">Informações de Prescrição</h3>
                <PrescriptionForm form={form as OrderFormReturn} />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              {renderOrderSummary()}
            </div>
          </div>
        );

      case 2: // Confirmação
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium border-b pb-1">Confirmação do Pedido</h3>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <h4 className="font-medium text-sm mb-2">Resumo das Informações</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-600">Cliente</h5>
                      <p>{selectedCustomer?.name || "Não selecionado"}</p>
                      {selectedCustomer?.phone && <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>}
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-600">Pagamento</h5>
                      <p>
                        {form && form.getValues("paymentMethod") === "credit" && "Cartão de Crédito"}
                        {form && form.getValues("paymentMethod") === "debit" && "Cartão de Débito"}
                        {form && form.getValues("paymentMethod") === "cash" && "Dinheiro"}
                        {form && form.getValues("paymentMethod") === "pix" && "PIX"}
                        {form && form.getValues("paymentMethod") === "installment" && "Parcelado"}
                      </p>
                      {showInstallments && (form?.getValues("installments") || 0) > 0 && (
                        <p className="text-xs text-gray-500">
                          {form.getValues("installments")}x de {formatCurrency(calculateInstallmentValue())}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-600">Data do Pedido</h5>
                      <p>{form && form.getValues("orderDate")}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-600">Data de Entrega</h5>
                      <p>{form && form.getValues("deliveryDate")}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h5 className="font-medium text-gray-600">Produtos</h5>
                    <ul className="text-sm space-y-1 mt-1">
                      {selectedProducts.map((product) => (
                        <li key={product._id} className="flex justify-between">
                          <span>{product.name}</span>
                          <span>{formatCurrency(product.sellPrice || 0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {form && form.getValues("observations") && (
                    <div className="mt-3">
                      <h5 className="font-medium text-gray-600">Observações</h5>
                      <p className="text-sm mt-1">{form.getValues("observations")}</p>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-green-50 rounded border border-green-100">
                  <div className="flex">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">
                      Todas as informações foram preenchidas. Você pode revisar o pedido e clicar em "Finalizar Pedido" para concluir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              {renderOrderSummary()}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Adiciona o CSS para remover as setas dos inputs numéricos */}
      <style jsx global>{numericInputStyles}</style>
      
      <div className="max-w-6xl mx-auto p-3">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-primary">Novo Pedido</h1>
          <p className="text-muted-foreground text-sm">Preencha os dados para criar um novo pedido</p>
        </div>

        {isLoadingProducts || isLoadingCustomers ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 p-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-2" />
                <div>
                  <CardTitle className="text-base">Formulário de Pedido</CardTitle>
                  {loggedEmployee && (
                    <p className="text-xs text-muted-foreground">
                      Vendedor: {loggedEmployee.name}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            {!showPdfDownload ? (
              <CardContent className="p-4">
                <Form {...form}>
                  <form
                    id="orderForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log("Form submitted", form.getValues());
                      onSubmit(form.getValues() as OrderFormValues);
                    }}
                    className="space-y-4"
                  >
                    {renderStepProgress()}
                    
                    {renderStepContent()}
                    
                    <div className="flex justify-between pt-3 border-t">
                      <div>
                        {currentStep > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            size="sm"
                            className="flex items-center text-sm h-9"
                          >
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            Anterior
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.back()}
                          size="sm"
                          className="text-sm h-9"
                        >
                          Cancelar
                        </Button>
                        
                        {currentStep < steps.length - 1 ? (
                          <Button 
                            type="button" 
                            onClick={nextStep}
                            disabled={!checkCanContinue()}
                            size="sm"
                            className="flex items-center text-sm h-9"
                          >
                            Próximo
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        ) : (
                          <Button 
                            type="button" 
                            disabled={isCreating || selectedProducts.length === 0}
                            size="sm"
                            className="text-sm h-9"
                            onClick={() => {
                              console.log("Finalizar Pedido clicked");
                              const formElement = document.getElementById('orderForm') as HTMLFormElement;
                              if (formElement) {
                                formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                              } else {
                                console.error("Form element not found");
                                // Fallback direto
                                onSubmit(form.getValues() as OrderFormValues);
                              }
                            }}
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              "Finalizar Pedido"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            ) : (
              <CardContent className="p-4">
                <div className="bg-green-50 rounded-lg border border-green-100 p-4">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 mb-1">
                      Pedido criado com sucesso!
                    </h3>
                    <p className="text-green-600 text-sm">
                      ID do pedido: {submittedOrder?._id.substring(0, 8)}
                    </p>
                    
                    {submittedOrder?.status === 'ready' ? (
                      <div className="mt-2 px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                        Status: Pronto para entrega
                      </div>
                    ) : (
                      <div className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                        Status: Em processamento
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <OrderPdfGenerator
                      formData={{
                        ...form.getValues(),
                        _id: submittedOrder?._id
                      }}
                      customer={selectedCustomer}
                    />
                    
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => router.push("/orders")}
                        size="sm"
                        className="text-sm h-9"
                      >
                        Ver Lista de Pedidos
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/orders/${submittedOrder?._id}`)}
                        size="sm"
                        className="text-sm h-9"
                      >
                        Ver Detalhes
                      </Button>
                      
                      <Button 
                        type="button"
                        onClick={() => {
                          form.reset();
                          setSelectedProducts([]);
                          setSelectedCustomer(null);
                          setShowPdfDownload(false);
                          setCurrentStep(0);
                        }}
                        size="sm"
                        className="text-sm h-9"
                      >
                        Criar Novo Pedido
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </>
  );
}