"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { Customer } from "@/app/_types/customer";
import type { Product } from "@/app/_types/product";
import Cookies from "js-cookie";
import { getTomorrowDate } from "@/app/_utils/formatters";
import { OrderFormValues } from "@/app/_types/form-types";
import { normalizeProduct, getCorrectPrice, checkForLenses } from "@/app/_utils/product-utils";
import { useCustomers } from "@/hooks/useCustomers";
import { createOrderform } from "@/schemas/order-schema";
import { OrderForm } from "@/components/Orders/OrderForm";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OrderEditHistory } from "@/components/Orders/OrderEditHistory";
import { api } from "@/app/_services/authService";
import { OrderStatusAlert } from "@/components/Orders/OrderStatusAlert";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";

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
  const [changeNote, setChangeNote] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  
  const {
    products: productsData,
    loading: isLoadingProducts,
  } = useProducts();

  const { 
    customers: customersData,
    isLoading: isLoadingCustomers,
    fetchCustomerById
  } = useCustomers();

  // Usar o hook useOrders corretamente para buscar o pedido
  const { fetchOrderById } = useOrders();
  const { data: order, isLoading: loadingOrder, error: orderError } = fetchOrderById(id);
  
  const form = createOrderform();

  // Carregar dados do funcionário logado
  useEffect(() => {
    const userId = Cookies.get("userId");
    const name = Cookies.get("name");
    const email = Cookies.get("email");
    const role = Cookies.get("role");

    if (userId && name && role) {
      setLoggedEmployee({
        id: userId,
        name,
        email: email || "",
        role,
      });
    }
  }, []);

  // Processar dados do pedido quando ele for carregado
  useEffect(() => {
    const processOrderData = async () => {
      if (!order) return;
      
      try {
        console.log("Processando dados do pedido:", order);
        
        // Set status
        if (order.status) {
          setOrderStatus(order.status);
        }
        
        // Process products
        const orderProducts = Array.isArray(order.products) ? order.products : [order.products];
        const normalizedProducts = orderProducts.map((p: any) => normalizeProduct(p));
        setSelectedProducts(normalizedProducts);
        
        // Check if order contains lenses
        const containsLenses = checkForLenses(normalizedProducts);
        setHasLenses(containsLenses);
        
        // Set payment method and installments
        if (order.paymentMethod === "credit" || 
            order.paymentMethod === "bank_slip" || 
            order.paymentMethod === "promissory_note" || 
            order.paymentMethod === "check") {
          setShowInstallments(true);
        }
        
        // Set customer - buscar dados completos do cliente
        let customerData: Customer | null = null;
        
        if (typeof order.clientId === 'object' && 'name' in order.clientId) {
          customerData = order.clientId as Customer;
        } else if (typeof order.clientId === 'string') {
          try {
            customerData = await fetchCustomerById(order.clientId);
          } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            // Fallback básico
            customerData = {
              _id: order.clientId,
              name: "Cliente",
              role: "customer"
            } as Customer;
          }
        }
        
        setSelectedCustomer(customerData);
        
        // Converter serviceOrder para string se necessário
        const serviceOrderValue = order.serviceOrder ? String(order.serviceOrder) : "";
        
        // Populate form with order data
        form.reset({
          clientId: typeof order.clientId === 'string' ? order.clientId : String(order.clientId),
          employeeId: typeof order.employeeId === 'string' ? order.employeeId : String(order.employeeId),
          institutionId: order.institutionId ? String(order.institutionId) : undefined,
          isInstitutionalOrder: !!order.isInstitutionalOrder,
          products: normalizedProducts,
          serviceOrder: serviceOrderValue ? Number(serviceOrderValue) : undefined,
          paymentMethod: order.paymentMethod,
          paymentEntry: order.paymentEntry || 0,
          installments: order.installments || undefined,
          orderDate: typeof order.orderDate === 'string' ? 
            order.orderDate.split('T')[0] : 
            new Date(order.orderDate).toISOString().split('T')[0],
          deliveryDate: order.deliveryDate ? 
            (typeof order.deliveryDate === 'string' ? 
              order.deliveryDate.split('T')[0] : 
              new Date(order.deliveryDate).toISOString().split('T')[0]) : 
            undefined,
          status: order.status,
          laboratoryId: order.laboratoryId ? String(order.laboratoryId) : "",
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
              sph: order.prescriptionData?.leftEye?.sph !== undefined ? 
                String(order.prescriptionData.leftEye.sph) : "",
              cyl: order.prescriptionData?.leftEye?.cyl !== undefined ? 
                String(order.prescriptionData.leftEye.cyl) : "",
              axis: order.prescriptionData?.leftEye?.axis || 0,
              pd: order.prescriptionData?.leftEye?.pd || 0,
            },
            rightEye: {
              sph: order.prescriptionData?.rightEye?.sph !== undefined ? 
                String(order.prescriptionData.rightEye.sph) : "",
              cyl: order.prescriptionData?.rightEye?.cyl !== undefined ? 
                String(order.prescriptionData.rightEye.cyl) : "",
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
        
        console.log("Customer data após processamento:", customerData);
        
      } catch (error) {
        console.error("Erro ao processar dados do pedido:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao processar dados do pedido."
        });
      }
    };
    
    if (order && !loadingOrder) {
      processOrderData();
    }
  }, [order, loadingOrder, form, fetchCustomerById, toast]);

  const handleChangeNoteSubmit = (note: string) => {
    setChangeNote(note);
  };

  const updateOrderData = async (formData: OrderFormValues) => {
    try {
      // Converter serviceOrder para string se necessário
      const orderData = {
        ...formData,
        serviceOrder: formData.serviceOrder ? String(formData.serviceOrder) : null, // Converter para string
        institutionId: formData.institutionId ? String(formData.institutionId) : null,
        changeNote: changeNote || undefined,
      };
      
      const updateResponse = await api.put(`/api/orders/${id}`, orderData);
      
      if (updateResponse.data) {
        toast({
          title: "Pedido atualizado com sucesso",
          description: `O pedido #${id.substring(0, 8)} foi atualizado com sucesso.`,
        });
        
        router.push(`/orders/${id}`);
      }
    } catch (error: any) {
      console.error("Erro ao atualizar pedido:", error);
      let errorMessage = "Erro ao atualizar pedido. Tente novamente.";
      
      if (error.response?.data?.message) {
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
    
    const productToAdd = normalizeProduct(product);
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

  // Estados de loading
  if (loadingOrder || isLoadingProducts || isLoadingCustomers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
          <p className="text-muted-foreground">Carregando dados do pedido...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>
              {orderError ? "Erro ao carregar dados do pedido" : "Pedido não encontrado"}
            </span>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="space-y-4">
          {/* Add status warning for special statuses */}
          {(orderStatus === "delivered" || orderStatus === "cancelled") && (
            <OrderStatusAlert status={orderStatus} className="mb-4" />
          )}
          
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
            isCreating={false} // false para edição
            isEditing={true} // Nova prop para indicar que é edição
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
          
          {/* Add OrderEditHistory component */}
          <OrderEditHistory 
            orderId={id}
            onChangeNoteSubmit={handleChangeNoteSubmit}
            previousEdits={[]} 
          />
        </div>
      </div>
    </div>
  );
}