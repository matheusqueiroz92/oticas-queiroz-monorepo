"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from "@/components/ui/dialog";
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
import Cookies from "js-cookie";
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
  
  // Debug: Log dos dados transformados
  if (mode === "edit" && initialFormData) {
    console.log("=== DEBUG: Dados transformados para edição ===");
    console.log("Order original:", order);
    console.log("Order.clientId:", order?.clientId);
    console.log("Order.clientId type:", typeof order?.clientId);
    console.log("InitialFormData:", initialFormData);
    console.log("ClientId no initialFormData:", initialFormData.clientId);
    console.log("ClientId type:", typeof initialFormData.clientId);
  }
  
  // Hooks
  const { customers: customers, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 100,
    enablePagination: false
  });
  
  const { products: productsData } = useProducts(1, "", "all");
  const { handleCreateOrder, handleUpdateOrder } = useOrders();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Obter dados do usuário logado
  const loggedEmployee = {
    id: Cookies.get("userId") || "",
    name: Cookies.get("userName") || "",
    email: Cookies.get("userEmail") || "",
    role: Cookies.get("userRole") || "",
  };
  
  // Effect para configurar o cliente selecionado quando estiver em modo de edição
  useEffect(() => {
    if (mode === "edit" && initialFormData?.clientId && customers && customers.length > 0) {
      console.log("=== DEBUG: Tentando configurar cliente selecionado ===");
      console.log("initialFormData.clientId:", initialFormData.clientId);
      console.log("customers disponíveis:", customers.length);
      console.log("Primeiros 3 clientes:", customers.slice(0, 3).map(c => ({ _id: c._id, name: c.name })));
      
      const customer = customers.find(c => c._id === initialFormData.clientId);
      console.log("Cliente encontrado:", customer);
      
      if (customer && (!selectedCustomer || selectedCustomer._id !== customer._id)) {
        console.log("=== DEBUG: Configurando cliente selecionado ===");
        console.log("Cliente encontrado:", customer);
        setSelectedCustomer(customer);
      } else {
        console.log("=== DEBUG: Cliente não encontrado ou já selecionado ===");
        console.log("selectedCustomer atual:", selectedCustomer);
      }
    }
  }, [mode, initialFormData?.clientId, customers, selectedCustomer]);
  
  // Função para processar o submit do formulário
  const handleSubmit = async (data: OrderFormValues) => {
    // Proteção contra múltiplas submissões
    if (isSubmitting) {
      console.log("⚠️ Submit já em andamento, ignorando nova submissão");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("=== INÍCIO DO SUBMIT ===");
      console.log("Modo:", mode);
      console.log("Dados do formulário recebidos:", data);
      console.log("🔍 DEBUG: Verificando se é modo de edição...");
      
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
      
      // Preparar dados para criação/edição do pedido
      const orderData = {
        ...data,
        employeeId: loggedEmployee.id,
        products: data.products || [],
        orderDate: data.orderDate || new Date().toISOString().split("T")[0],
        deliveryDate: data.deliveryDate || data.orderDate || new Date().toISOString().split("T")[0],
        totalPrice: Number(data.totalPrice) || 0,
        discount: Number(data.discount) || 0,
        finalPrice: Number(data.finalPrice) || Number(data.totalPrice) - Number(data.discount),
        status: data.status || "pending",
        paymentStatus: data.paymentStatus || "pending",
      };
      
      console.log("Dados preparados:", orderData);
      
      if (mode === "edit") {
        console.log("=== MODO EDIÇÃO - ATUALIZANDO PEDIDO ===");
        console.log("Order ID:", order?._id);
        console.log("Order data:", order);
        console.log("OrderData to update:", orderData);
        
        if (!order?._id) {
          throw new Error("ID do pedido não encontrado");
        }
        
        // Atualizar o pedido
        const updatedOrder = await handleUpdateOrder(order._id, orderData as any);
        
        console.log("=== PEDIDO ATUALIZADO COM SUCESSO ===");
        console.log("Dados do pedido atualizado:", updatedOrder);
        
        // Invalidar queries dos produtos para atualizar estoque
        console.log("=== INVALIDANDO QUERIES DOS PRODUTOS ===");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS.ALL] });
        console.log("=== QUERIES INVALIDADAS COM SUCESSO ===");
        
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
        console.log("=== CHAMANDO handleCreateOrder ===");
        
        // Criar o pedido e capturar os dados retornados
        const newOrder = await handleCreateOrder(orderData as any);
        
        console.log("=== PEDIDO CRIADO COM SUCESSO ===");
        console.log("Dados do pedido criado:", newOrder);
        
        // Invalidar queries dos produtos para atualizar estoque
        console.log("=== INVALIDANDO QUERIES DOS PRODUTOS ===");
        
        // Invalidar apenas as queries de produtos (não todas as queries)
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS.ALL] });
        
        console.log("=== QUERIES INVALIDADAS COM SUCESSO ===");
        
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
      console.error("=== ERRO AO PROCESSAR PEDIDO ===");
      console.error("Erro:", error);
      handleError(
        error,
        "Erro ao criar pedido",
        true // Mostrar detalhes do erro
      );
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
      <DialogOverlay className="bg-black/60" />
      <DialogContent className="max-w-5xl w-full overflow-y-auto max-h-[90vh] p-0 border-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FilePlus className="w-6 h-6 text-[var(--primary-blue)]" />
              {mode === "edit" ? "Editar Pedido" : "Novo Pedido"}
            </DialogTitle>
            <DialogDescription>
              {mode === "edit" 
                ? "Edite as informações do pedido no sistema" 
                : "Cadastre um novo pedido no sistema"
              }
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {showSuccessScreen && createdOrder ? (
          <div className="p-6">
            <OrderSuccessScreen
              form={formData ? { 
                getValues: () => ({
                  ...formData,
                  // Garantir que os dados do pedido criado sejam usados
                  paymentMethod: formData.paymentMethod || createdOrder.paymentMethod,
                  paymentEntry: formData.paymentEntry || createdOrder.paymentEntry || 0,
                  installments: formData.installments || createdOrder.installments || 1,
                  orderDate: formData.orderDate || createdOrder.orderDate,
                  deliveryDate: formData.deliveryDate || createdOrder.deliveryDate,
                  totalPrice: formData.totalPrice || createdOrder.totalPrice || 0,
                  discount: formData.discount || createdOrder.discount || 0,
                  finalPrice: formData.finalPrice || createdOrder.finalPrice || createdOrder.totalPrice || 0,
                })
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