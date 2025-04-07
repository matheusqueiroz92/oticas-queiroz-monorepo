"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { Customer } from "@/app/types/customer";
import type { Product } from "@/app/types/product";
import Cookies from "js-cookie";
import { getTomorrowDate } from "@/app/utils/formatters";
import { OrderFormValues } from "@/app/types/form-types";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useUsers } from "@/hooks/useUsers";
import { normalizeProduct, getCorrectPrice, checkForLenses } from "@/app/utils/product-utils";
import { createOrderform } from "@/schemas/order-schema";
import OrderForm from "@/components/Orders/OrderForm";

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
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const [hasLenses, setHasLenses] = useState(false);

  const { handleCreateOrder, isCreating } = useOrders();
  const {
    products: productsData,
    loading: isLoadingProducts,
    fetchProductWithConsistentDetails
  } = useProducts();

  const { 
    customers: customersData,
    isLoading: isLoadingCustomers
  } = useUsers();

  const form = createOrderform();

  // Função para criar um novo pedido
  const submitOrderForm = async (formData: OrderFormValues) => {
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
  
      const newOrder = await handleCreateOrder(orderData as any);
      
      if (newOrder) {
        setSubmittedOrder(newOrder);
  
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
  
  // Função para submeter o formulário
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
    
    submitOrderForm(data);
  };

  // Efeito para carregar os dados do funcionário logado
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

  // Efeito para restaurar dados do formulário do LocalStorage
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

  // Efeito para inicializar datas
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    form.setValue("orderDate", today);
    form.setValue("deliveryDate", today);
  }, [form]);

  // Função para adicionar produto
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

  // Função para remover produto
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

  // Função para atualizar preço do produto
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

  // Função para atualizar preço final
  const updateFinalPrice = (total: number, discount: number) => {
    const finalPrice = Math.max(0, total - discount);
    form.setValue("finalPrice", finalPrice);
  };

  // Função para selecionar cliente
  const handleClientSelect = (clientId: string, name: string) => {
    form.setValue("clientId", clientId);
    const customer = customersData?.find((c: Customer) => c._id === clientId);
    setSelectedCustomer(customer || null);
  };

  // Função para calcular valor das parcelas
  const calculateInstallmentValue = () => {
    if (!form) return 0;
    
    const totalPrice = form.getValues("finalPrice") || 0;
    const installments = form.getValues("installments") || 1;
    const paymentEntry = form.getValues("paymentEntry") || 0;

    if (installments <= 0) return 0;

    const remainingAmount = totalPrice - paymentEntry;
    return remainingAmount <= 0 ? 0 : remainingAmount / installments;
  };

  // Funções para navegação
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
    form.reset();
    setSelectedProducts([]);
    setSelectedCustomer(null);
    setSubmittedOrder(null);
    setHasLenses(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-3">
      {isLoadingProducts || isLoadingCustomers ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      ) : (
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
          isCreating={isCreating}
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
      )}
    </div>
  );
}