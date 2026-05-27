"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderForm } from "./OrderForm";
import OrderSuccessScreen from "./OrderSuccessScreen";
import type { OrderFormValues } from "@/app/_types/form-types";
import type { Order } from "@/app/_types/order";
import type { Customer } from "@/app/_types/customer";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useProducts } from "@/hooks/products/useProducts";
import { useOrders } from "@/hooks/orders/useOrders";
import { useToast } from "@/hooks/useToast";
import { handleError, showSuccess } from "@/app/_utils/error-handler";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { useAuth } from "@/hooks/useAuth";
import { FilePlus } from "lucide-react";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Partial<OrderFormValues> | Order | any;
  mode?: "create" | "edit";
}

export const OrderDialog: React.FC<OrderDialogProps> = ({ open, onOpenChange, order, mode = "create" }) => {
  // Estados locais
  const [hasLenses, setHasLenses] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<OrderFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Função para transformar dados do pedido em dados do formulário
  const transformOrderToFormData = (orderData: any): Partial<OrderFormValues> => {
    if (!orderData) {
      return {};
    }
    
    const formatDate = (date: string | Date | undefined) => {
      if (!date) return "";
      try {
        const d = new Date(date);
        // Verificar se a data é válida
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      } catch (error) {
        console.warn("Erro ao formatar data:", date, error);
        return "";
      }
    };
    
    return {
      clientId: typeof orderData.clientId === 'object' && orderData.clientId?._id 
        ? orderData.clientId._id 
        : orderData.clientId || "",
      employeeId: typeof orderData.employeeId === 'object' && orderData.employeeId?._id 
        ? orderData.employeeId._id 
        : orderData.employeeId || "",
      institutionId: typeof orderData.institutionId === 'object' && orderData.institutionId?._id 
        ? orderData.institutionId._id 
        : orderData.institutionId || undefined,
      isInstitutionalOrder: orderData.isInstitutionalOrder || false,
      hasResponsible: false, // Não temos essa informação no Order
      responsibleClientId: undefined,
      products: orderData.products?.map((product: any) => 
        typeof product === 'object' && product?._id ? product._id : product
      ) || [],
      serviceOrder: orderData.serviceOrder || "",
      paymentMethod: orderData.paymentMethod || "",
      paymentStatus: orderData.paymentStatus || "pending",
      paymentEntry: orderData.paymentEntry || 0,
      installments: orderData.installments || undefined,
      orderDate: formatDate(orderData.orderDate),
      deliveryDate: formatDate(orderData.deliveryDate),
      status: orderData.status || "pending",
      laboratoryId: typeof orderData.laboratoryId === 'object' && orderData.laboratoryId?._id 
        ? orderData.laboratoryId._id 
        : orderData.laboratoryId || "",
      observations: orderData.observations || "",
      totalPrice: orderData.totalPrice || 0,
      discount: orderData.discount || 0,
      finalPrice: orderData.finalPrice || 0,
      prescriptionData: {
        doctorName: orderData.prescriptionData?.doctorName || "",
        clinicName: orderData.prescriptionData?.clinicName || "",
        appointmentDate: formatDate(orderData.prescriptionData?.appointmentDate),
        rightEye: {
          sph: orderData.prescriptionData?.rightEye?.sph?.toString() || "",
          cyl: orderData.prescriptionData?.rightEye?.cyl?.toString() || "",
          axis: orderData.prescriptionData?.rightEye?.axis || 0,
          pd: orderData.prescriptionData?.rightEye?.pd || 0,
        },
        leftEye: {
          sph: orderData.prescriptionData?.leftEye?.sph?.toString() || "",
          cyl: orderData.prescriptionData?.leftEye?.cyl?.toString() || "",
          axis: orderData.prescriptionData?.leftEye?.axis || 0,
          pd: orderData.prescriptionData?.leftEye?.pd || 0,
        },
        nd: orderData.prescriptionData?.nd || 0,
        oc: orderData.prescriptionData?.oc || 0,
        addition: orderData.prescriptionData?.addition || "",
        bridge: orderData.prescriptionData?.bridge || 0,
        rim: orderData.prescriptionData?.rim || 0,
        vh: orderData.prescriptionData?.vh || 0,
        sh: orderData.prescriptionData?.sh || 0,
      },
    };
  };
  
  const initialFormData = mode === "edit" ? transformOrderToFormData(order) : undefined;
  
  // Função helper para verificar se há lentes nos produtos
  const hasLensesInProducts = (products: any[]): boolean => {
    return products?.some((product: any) => {
      // Se for objeto com productType
      if (product && typeof product === 'object' && 'productType' in product) {
        return product.productType === 'lenses';
      }
      // Se for string ou ID, não podemos determinar aqui
      return false;
    }) || false;
  };

  // Função para determinar status inicial baseado nos produtos
  const determineInitialStatus = (products: any[]): "pending" | "ready" => {
    // Se há lentes, status inicial é "pending"
    // Se não há lentes, status inicial é "ready"
    return hasLensesInProducts(products) ? "pending" : "ready";
  };
  
  // Hooks
  const { customers: customers, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 100,
    enablePagination: false
  });
  
  const { products: productsData } = useProducts(1, "", "all");
  const { handleCreateOrder, handleUpdateOrder } = useOrders();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const loggedEmployee = {
    id: user?._id || "",
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
  };
  
  // Effect para configurar o cliente selecionado quando estiver em modo de edição
  useEffect(() => {
    if (mode === "edit" && initialFormData?.clientId && customers && customers.length > 0) {
      const customer = customers.find(c => c._id === initialFormData.clientId);
      if (customer && (!selectedCustomer || selectedCustomer._id !== customer._id)) {
        setSelectedCustomer(customer);
      }
    }
  }, [mode, initialFormData?.clientId, customers, selectedCustomer]);
  
  // Função para processar o submit do formulário
  const handleSubmit = async (data: OrderFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Validações básicas
      if (!data.clientId) {
        throw new Error("Cliente é obrigatório");
      }
      
      if (!data.products || data.products.length === 0) {
        throw new Error("Pelo menos um produto é obrigatório");
      }
      
      if (!data.paymentMethod) {
        throw new Error("Forma de pagamento é obrigatória");
      }
      
      // Determinar status inicial baseado nos produtos (apenas para criação)
      let orderStatus = data.status;
      if (mode === "create") {
        const productsForStatus = (data.products || []).map((product: any) => {
          if (product && typeof product === "object" && "productType" in product) {
            return product;
          }
          const productId = typeof product === "string" ? product : product?._id;
          return productsData?.find((p: any) => p._id === productId);
        }).filter(Boolean);
        orderStatus = determineInitialStatus(productsForStatus);
      }
      
      const { emitBoletosNow: _emitBoletosNow, ...orderPayload } = data as typeof data & {
        emitBoletosNow?: boolean;
      };

      const orderData = {
        ...orderPayload,
        sicrediInstallments: data.sicrediInstallments,
        employeeId: loggedEmployee.id,
        products: data.products || [],
        orderDate: data.orderDate || new Date().toISOString().split("T")[0],
        deliveryDate: data.deliveryDate || data.orderDate || new Date().toISOString().split("T")[0],
        totalPrice: Number(data.totalPrice) || 0,
        discount: Number(data.discount) || 0,
        finalPrice: Number(data.finalPrice) || Number(data.totalPrice) - Number(data.discount),
        status: orderStatus || "pending",
        paymentStatus: data.paymentStatus || "pending",
      };

      if (mode === "edit") {
        if (!order?._id) {
          throw new Error("ID do pedido não encontrado");
        }
        
        const updatedOrder = await handleUpdateOrder(order._id, orderData as any);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS.ALL] });
        
        // Buscar dados do cliente para exibir na tela de sucesso
        const clientData = customers?.find((customer: any) => customer._id === data.clientId);
        if (clientData && !selectedCustomer) {
          setSelectedCustomer(clientData);
        }
        
        // Salvar dados do formulário para a tela de sucesso
        setFormData(data);
        setCreatedOrder(updatedOrder);
        setShowSuccessScreen(true);
        
        showSuccess(
          "Pedido atualizado com sucesso!",
          `Pedido #${order.serviceOrder} foi atualizado no sistema`
        );
      } else {
        const newOrder = await handleCreateOrder(orderData as any);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS.ALL] });
        
        // Buscar dados do cliente para exibir na tela de sucesso
        const clientData = customers?.find((customer: any) => customer._id === data.clientId);
        if (clientData && !selectedCustomer) {
          setSelectedCustomer(clientData);
        }
        
        // Salvar dados do formulário para a tela de sucesso
        setFormData(data);
        setCreatedOrder(newOrder);
        setShowSuccessScreen(true);
        
        showSuccess(
          "Pedido criado com sucesso!",
          `Pedido criado e registrado no sistema`
        );
      }
      
    } catch (error) {
      handleError(error, "Erro ao criar pedido", true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para fechar o dialog e resetar estados
  const handleClose = () => {
    setShowSuccessScreen(false);
    setCreatedOrder(null);
    setSelectedCustomer(null);
    setFormData(null);
    onOpenChange(false);
  };
  
  // Função para criar novo pedido
  const handleCreateNewOrder = () => {
    setShowSuccessScreen(false);
    setCreatedOrder(null);
    setSelectedCustomer(null);
    setFormData(null);
    // Manter o dialog aberto para novo pedido
  };
  
  // Função para ver lista de pedidos
  const handleViewOrdersList = () => {
    handleClose();
    // Navegar para lista de pedidos seria implementado aqui
  };
  
  // Função para ver detalhes do pedido
  const handleViewOrderDetails = () => {
    handleClose();
    // Navegar para detalhes do pedido seria implementado aqui
  };
  
  // Funções mock para handlers obrigatórios
  const noop = () => {};
  const noopAsync = async () => {};

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-[calc(100%-1.5rem)] sm:w-full overflow-y-auto max-h-[90dvh] p-0 border-0">
        <div className="p-4 sm:p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <FilePlus className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary-blue)]" />
              {mode === "edit" ? "Editar Pedido" : "Novo Pedido"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {mode === "edit" 
                ? "Edite as informações do pedido no sistema" 
                : "Cadastre um novo pedido no sistema"
              }
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {showSuccessScreen && createdOrder ? (
          <div className="p-3 sm:p-4 md:p-6">
            <OrderSuccessScreen
              form={formData ? {
                getValues: (field?: string) => {
                  const values = {
                    ...formData,
                    paymentMethod: formData.paymentMethod || createdOrder.paymentMethod,
                    paymentEntry: formData.paymentEntry ?? createdOrder.paymentEntry ?? 0,
                    installments: formData.installments ?? createdOrder.installments ?? 1,
                    emitBoletosNow: formData.emitBoletosNow ?? true,
                    orderDate: formData.orderDate || createdOrder.orderDate,
                    deliveryDate: formData.deliveryDate || createdOrder.deliveryDate,
                    totalPrice: formData.totalPrice ?? createdOrder.totalPrice ?? 0,
                    discount: formData.discount ?? createdOrder.discount ?? 0,
                    finalPrice:
                      formData.finalPrice ??
                      createdOrder.finalPrice ??
                      createdOrder.totalPrice ??
                      0,
                    products: formData.products?.length
                      ? formData.products
                      : createdOrder.products || [],
                    clientId: formData.clientId || createdOrder.clientId,
                    employeeId: formData.employeeId || createdOrder.employeeId,
                    prescriptionData:
                      formData.prescriptionData || createdOrder.prescriptionData,
                  };
                  if (field) {
                    return values[field as keyof typeof values];
                  }
                  return values;
                },
              } : undefined}
              submittedOrder={createdOrder}
              selectedCustomer={selectedCustomer}
              customersData={customers}
              onViewOrdersList={handleViewOrdersList}
              onViewOrderDetails={handleViewOrderDetails}
              onCreateNewOrder={handleCreateNewOrder}
              isEdit={mode === "edit"}
            />
          </div>
        ) : (
          // Aguardar carregamento dos clientes antes de renderizar o OrderForm
          isLoadingCustomers ? (
            <div className="p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando dados dos clientes...</p>
              </div>
            </div>
          ) : (
            <OrderForm
              isEditing={mode === "edit"}
              initialData={initialFormData}
              hasLenses={hasLenses}
              setHasLenses={setHasLenses}
              showInstallments={showInstallments}
              setShowInstallments={setShowInstallments}
              customersData={customers}
              productsData={productsData}
              loggedEmployee={loggedEmployee}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              onViewOrdersList={handleViewOrdersList}
              onViewOrderDetails={handleViewOrderDetails}
              onCreateNewOrder={handleCreateNewOrder}
              handleAddProduct={noopAsync}
              handleRemoveProduct={noop}
              handleUpdateProductPrice={noop}
              handleClientSelect={(clientId: string, name: string) => {
                setSelectedCustomer({ _id: clientId, name } as Customer);
              }}
              updateFinalPrice={noop}
              calculateInstallmentValue={() => 0}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}; 