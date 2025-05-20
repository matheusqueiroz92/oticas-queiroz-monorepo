"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { Customer } from "@/app/types/customer";
import type { Product } from "@/app/types/product";
import Cookies from "js-cookie";
import { getTomorrowDate } from "@/app/utils/formatters";
import { OrderFormValues } from "@/app/types/form-types";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { normalizeProduct, getCorrectPrice, checkForLenses } from "@/app/utils/product-utils";
import { useCustomers } from "@/hooks/useCustomers";
import { createOrderform } from "@/schemas/order-schema";
import { OrderForm } from "@/components/Orders/OrderForm";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function EditOrderPage() {
  const { id } = useParams() as { id: string };
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
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const [hasLenses, setHasLenses] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { 
    fetchOrderById, 
    handleUpdateOrder, 
    isLoading: isUpdatingOrder,
    getClientName,
    fetchOrderComplementaryDetails
  } = useOrders();
  
  const {
    products: productsData,
    loading: isLoadingProducts,
    fetchProductWithConsistentDetails
  } = useProducts();

  const { 
    customers: customersData,
    isLoading: isLoadingCustomers,
    fetchCustomerById
  } = useCustomers();
  
  const form = createOrderform();

  // Fetch order data when component mounts
  useEffect(() => {
    async function loadOrderData() {
      try {
        setLoadingInitialData(true);
        
        // Fetch the order details
        const { data: order, error } = await fetchOrderById(id);
        
        if (error || !order) {
          setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os dados do pedido");
          return;
        }
        
        // Fetch additional order details
        const orderDetails = await fetchOrderComplementaryDetails(order);
        
        // Set customer
        if (orderDetails.client) {
          setSelectedCustomer(orderDetails.client);
        } else if (order.clientId) {
          try {
            const customerData = await fetchCustomerById(typeof order.clientId === 'string' ? order.clientId : String(order.clientId));
            setSelectedCustomer(customerData);
          } catch (error) {
            console.error("Error fetching customer details:", error);
            setSelectedCustomer({ 
              _id: typeof order.clientId === 'string' ? order.clientId : String(order.clientId), 
              name: getClientName(typeof order.clientId === 'string' ? order.clientId : String(order.clientId)),
              role: "customer" 
            } as Customer);
          }
        }
        
        // Process products
        const orderProducts = Array.isArray(order.products) ? order.products : [order.products];
        
        // Ensure products have all required details
        const productsWithDetails = await Promise.all(
          orderProducts.map(async (product) => {
            try {
              // Fetch the most up-to-date product details
              const freshProduct = await fetchProductWithConsistentDetails(product._id);
              if (freshProduct) {
                // Keep the sell price from the order
                return {
                  ...freshProduct,
                  sellPrice: product.sellPrice || freshProduct.sellPrice
                };
              }
              return normalizeProduct(product);
            } catch (error) {
              console.error(`Error fetching product ${product._id} details:`, error);
              return normalizeProduct(product);
            }
          })
        );
        
        setSelectedProducts(productsWithDetails);
        
        // Check if order contains lenses
        const containsLenses = checkForLenses(productsWithDetails);
        setHasLenses(containsLenses);
        
        // Set payment method and installments
        if (order.paymentMethod === "credit" || 
            order.paymentMethod === "bank_slip" || 
            order.paymentMethod === "promissory_note" || 
            order.paymentMethod === "check") {
          setShowInstallments(true);
        }
        
        // Populate form with order data
        form.reset({
          clientId: typeof order.clientId === 'string' ? order.clientId : String(order.clientId),
          employeeId: typeof order.employeeId === 'string' ? order.employeeId : String(order.employeeId),
          institutionId: order.institutionId ? (typeof order.institutionId === 'string' ? order.institutionId : String(order.institutionId)) : undefined,
          isInstitutionalOrder: !!order.isInstitutionalOrder,
          products: productsWithDetails,
          serviceOrder: typeof order.serviceOrder === "number" ? order.serviceOrder : parseInt(order.serviceOrder || "0", 10),
          paymentMethod: order.paymentMethod,
          paymentEntry: order.paymentEntry || 0,
          installments: order.installments || undefined,
          orderDate: typeof order.orderDate === 'string' ? order.orderDate.split('T')[0] : new Date(order.orderDate).toISOString().split('T')[0],
          deliveryDate: order.deliveryDate ? (typeof order.deliveryDate === 'string' ? order.deliveryDate.split('T')[0] : new Date(order.deliveryDate).toISOString().split('T')[0]) : undefined,
          status: order.status,
          laboratoryId: order.laboratoryId ? (typeof order.laboratoryId === 'string' ? order.laboratoryId : String(order.laboratoryId)) : "",
          observations: order.observations || "",
          totalPrice: order.totalPrice,
          discount: order.discount || 0,
          finalPrice: order.finalPrice,
          prescriptionData: {
            doctorName: order.prescriptionData?.doctorName || "",
            clinicName: order.prescriptionData?.clinicName || "",
            appointmentDate: order.prescriptionData?.appointmentDate ? 
              (typeof order.prescriptionData.appointmentDate === 'string' ? 
                order.prescriptionData.appointmentDate.split('T')[0] : 
                new Date(order.prescriptionData.appointmentDate).toISOString().split('T')[0]) : 
              new Date().toISOString().split('T')[0],
            leftEye: {
              sph: order.prescriptionData?.leftEye?.sph !== undefined ? String(order.prescriptionData.leftEye.sph) : "",
              cyl: order.prescriptionData?.leftEye?.cyl !== undefined ? String(order.prescriptionData.leftEye.cyl) : "",
              axis: order.prescriptionData?.leftEye?.axis || 0,
              pd: order.prescriptionData?.leftEye?.pd || 0,
            },
            rightEye: {
              sph: order.prescriptionData?.leftEye?.sph !== undefined ? String(order.prescriptionData.leftEye.sph) : "",
              cyl: order.prescriptionData?.leftEye?.cyl !== undefined ? String(order.prescriptionData.leftEye.cyl) : "",
              axis: order.prescriptionData?.rightEye?.axis || 0,
              pd: order.prescriptionData?.rightEye?.pd || 0,
            },
            nd: order.prescriptionData?.nd || 0,
            oc: order.prescriptionData?.oc || 0,
            addition: order.prescriptionData?.addition || 0,
            bridge: order.prescriptionData?.bridge || 0,
            rim: order.prescriptionData?.rim || 0,
            vh: order.prescriptionData?.vh || 0,
            sh: order.prescriptionData?.sh || 0,
          }
        });
        
      } catch (error) {
        console.error("Error loading order data:", error);
        setLoadError("Erro ao carregar dados do pedido. Tente novamente.");
      } finally {
        setLoadingInitialData(false);
      }
    }
    
    loadOrderData();
  }, [id, fetchOrderById, fetchCustomerById, fetchProductWithConsistentDetails, form, fetchOrderComplementaryDetails, getClientName]);

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
    }
  }, []);

  const updateOrderData = async (formData: OrderFormValues) => {
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
      
      // Função auxiliar para normalizar valores de dioptria
      const normalizeDioptriaValue = (value: string | undefined | null): string => {
        if (value === undefined || value === null || value === "") {
          return "";
        }
        
        // Garantir que vírgulas são convertidas para pontos
        const normalizedValue = value.replace(',', '.');
        
        // Verificar se é um valor numérico válido
        const numValue = parseFloat(normalizedValue);
        if (isNaN(numValue)) {
          return "";
        }
        
        // Se for zero, retornar string vazia
        if (numValue === 0) {
          return "";
        }
        
        // Retornar com sinal explícito
        return numValue > 0 ? `+${numValue}` : `${numValue}`;
      };
      
      // Criar o objeto de dados para envio, preservando valores de prescrição
      const orderData = {
        clientId: formData.clientId,
        employeeId: formData.employeeId,
        institutionId: formData.instituionId || null,
        isInstitutionalOrder: formData.isInstitutionalOrder,
        products: formData.products,
        serviceOrder: formData.serviceOrder,
        paymentMethod: formData.paymentMethod,
        paymentEntry: formData.paymentEntry,
        installments: formData.installments,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        laboratoryId: formData.laboratoryId && formData.laboratoryId.trim() !== "" 
          ? formData.laboratoryId 
          : undefined,
        prescriptionData: {
          doctorName: formData.prescriptionData.doctorName || "Não aplicável",
          clinicName: formData.prescriptionData.clinicName || "Não aplicável",
          appointmentDate: formData.prescriptionData.appointmentDate || new Date().toISOString().split("T")[0],
          leftEye: {
            sph: normalizeDioptriaValue(formData.prescriptionData.leftEye.sph),
            cyl: normalizeDioptriaValue(formData.prescriptionData.leftEye.cyl),
            axis: formData.prescriptionData.leftEye.axis || 0,
            pd: formData.prescriptionData.leftEye.pd || 0,
          },
          rightEye: {
            sph: normalizeDioptriaValue(formData.prescriptionData.rightEye.sph),
            cyl: normalizeDioptriaValue(formData.prescriptionData.rightEye.cyl),
            axis: formData.prescriptionData.rightEye.axis || 0,
            pd: formData.prescriptionData.rightEye.pd || 0,
          },
          nd: formData.prescriptionData.nd || 0,
          oc: formData.prescriptionData.oc || 0,
          addition: formData.prescriptionData.addition || 0,
          bridge: formData.prescriptionData.bridge || 0,
          rim: formData.prescriptionData.rim || 0,
          vh: formData.prescriptionData.vh || 0,
          sh: formData.prescriptionData.sh || 0,
        },
        observations: formData.observations,
        totalPrice: formData.totalPrice,
        discount: formData.discount,
        finalPrice: formData.finalPrice,
      };
      
      // Call the update order function
      const updatedOrder = await handleUpdateOrder(id, orderData);
      
      if (updatedOrder) {
        setSubmittedOrder({
          ...updatedOrder,
          customer: selectedCustomer
        });
  
        toast({
          title: "Pedido atualizado com sucesso",
          description: `O pedido #${updatedOrder._id.substring(0, 8)} foi atualizado com sucesso.`,
        });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar pedido:", error);
      let errorMessage = "Erro ao atualizar pedido. Tente novamente.";
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar pedido",
        description: errorMessage,
      });
    }
  };
  
  const onSubmit = (data: OrderFormValues) => {
    const productsWithoutStock = selectedProducts.filter(product => {
      if (product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') {
        const stock = (product as any).stock || 0;
        return stock <= 0;
      }
      return false;
    });
    
    if (productsWithoutStock.length > 0) {
      const productNames = productsWithoutStock.map(p => p.name).join(", ");
      
      toast({
        variant: "destructive",
        title: "Produtos sem estoque",
        description: `Os seguintes produtos não possuem estoque: ${productNames}. Remova-os ou atualize o estoque para continuar.`
      });
      
      if (!window.confirm("Deseja continuar mesmo com produtos sem estoque?")) {
        return;
      }
    }
    
    updateOrderData(data);
  };

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

  const handleClientSelect = async (clientId: string, name: string) => {
    form.setValue("clientId", clientId);
    
    try {
      const customer = await fetchCustomerById(clientId);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error("Erro ao buscar detalhes do cliente:", error);
      setSelectedCustomer({ _id: clientId, name, role: "customer" } as Customer);
    }
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

  const handleCancel = () => {
    router.back();
  };

  const handleViewOrdersList = () => {
    router.push("/orders");
  };

  const handleViewOrderDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const resetOrderForm = () => {
    router.push("/orders/new");
  };  

  if (loadingInitialData || isLoadingProducts || isLoadingCustomers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
          <p className="text-muted-foreground">Carregando dados do pedido...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{loadError}</span>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3">
      <OrderForm 
        form={form}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        hasLenses={hasLenses}
        setHasLenses={setHasLenses}
        showInstallments={showInstallments}
        setShowInstallments={setShowInstallments}
        submittedOrder={submittedOrder}
        isCreating={isUpdatingOrder}
        customersData={customersData || []}
        productsData={productsData || []}
        loggedEmployee={loggedEmployee}
        onSubmit={onSubmit}
        onCancel={handleCancel}
        onViewOrdersList={handleViewOrdersList}
        onViewOrderDetails={handleViewOrderDetails}
        onCreateNewOrder={resetOrderForm}
        handleAddProduct={handleAddProduct}
        handleRemoveProduct={handleRemoveProduct}
        handleUpdateProductPrice={handleUpdateProductPrice}
        handleClientSelect={handleClientSelect}
        updateFinalPrice={updateFinalPrice}
        calculateInstallmentValue={calculateInstallmentValue}
      />
    </div>
  );
}