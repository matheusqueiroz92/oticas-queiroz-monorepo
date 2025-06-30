"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderForm } from "./OrderForm";
import OrderSuccessScreen from "./OrderSuccessScreen";
import type { OrderFormValues } from "@/app/_types/form-types";
import type { Order } from "@/app/_types/order";
import type { Customer } from "@/app/_types/customer";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import Cookies from "js-cookie";

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
      clientId: orderData.clientId || "",
      employeeId: orderData.employeeId || "",
      institutionId: orderData.institutionId || undefined,
      isInstitutionalOrder: orderData.isInstitutionalOrder || false,
      hasResponsible: false, // Não temos essa informação no Order
      responsibleClientId: undefined,
      products: orderData.products || [],
      serviceOrder: orderData.serviceOrder || "",
      paymentMethod: orderData.paymentMethod || "",
      paymentStatus: orderData.paymentStatus || "pending",
      paymentEntry: orderData.paymentEntry || 0,
      installments: orderData.installments || undefined,
      orderDate: formatDate(orderData.orderDate),
      deliveryDate: formatDate(orderData.deliveryDate),
      status: orderData.status || "pending",
      laboratoryId: orderData.laboratoryId || "",
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
        addition: orderData.prescriptionData?.addition || 0,
        bridge: orderData.prescriptionData?.bridge || 0,
        rim: orderData.prescriptionData?.rim || 0,
        vh: orderData.prescriptionData?.vh || 0,
        sh: orderData.prescriptionData?.sh || 0,
      },
    };
  };
  
  const initialFormData = mode === "edit" ? transformOrderToFormData(order) : undefined;
  
  // Hooks
  const { customers: customersData, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 100,
    enablePagination: false
  });
  
  const { products: productsData } = useProducts();
  const { handleCreateOrder, isCreating } = useOrders();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Obter dados do usuário logado
  const loggedEmployee = {
    id: Cookies.get("userId") || "",
    name: Cookies.get("userName") || "",
    email: Cookies.get("userEmail") || "",
    role: Cookies.get("userRole") || "",
  };
  
  // Função para processar o submit do formulário
  const handleSubmit = async (data: OrderFormValues) => {
    try {
      console.log("=== INÍCIO DO SUBMIT ===");
      console.log("Modo:", mode);
      console.log("Dados do formulário recebidos:", data);
      
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
        console.log("=== MODO EDIÇÃO - FUNCIONALIDADE EM DESENVOLVIMENTO ===");
        toast({
          title: "Aviso",
          description: "A funcionalidade de edição de pedidos ainda está em desenvolvimento. Por enquanto, apenas a visualização dos dados está disponível.",
        });
        return;
      } else {
        console.log("=== CHAMANDO handleCreateOrder ===");
        
        // Criar o pedido e capturar os dados retornados
        const newOrder = await handleCreateOrder(orderData as any);
        
        console.log("=== PEDIDO CRIADO COM SUCESSO ===");
        console.log("Dados do pedido criado:", newOrder);
        
        // Invalidar queries dos produtos para atualizar estoque
        console.log("=== INVALIDANDO QUERIES DOS PRODUTOS ===");
        
        // Invalidar TODAS as queries relacionadas a produtos
        await queryClient.invalidateQueries();
        
        // Forçar refetch específico das queries de produtos
        await queryClient.refetchQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0];
            return key === 'products' || key === QUERY_KEYS.PRODUCTS.ALL;
          }
        });
        
        // Remover dados em cache para forçar nova busca
        queryClient.removeQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return key === 'products' || key === QUERY_KEYS.PRODUCTS.ALL;
          }
        });
        
        console.log("=== QUERIES INVALIDADAS COM SUCESSO ===");
        
        // Salvar dados do formulário para a tela de sucesso
        setFormData(data);
        setCreatedOrder(newOrder);
        setShowSuccessScreen(true);
        
        toast({
          title: "Sucesso",
          description: "Pedido criado com sucesso!",
        });
      }
      
    } catch (error) {
      console.error("=== ERRO AO PROCESSAR PEDIDO ===");
      console.error("Erro:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível processar o pedido. Tente novamente.",
      });
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
  const handleViewOrderDetails = (orderId: string) => {
    handleClose();
    // Navegar para detalhes do pedido seria implementado aqui
  };
  
  // Funções mock para handlers obrigatórios
  const noop = () => {};
  const noopAsync = async () => {};

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full overflow-y-auto max-h-[90vh] p-0 border-0">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {mode === "edit" ? "Editar Pedido" : "Novo Pedido"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Edite as informações do pedido existente" 
              : "Preencha as informações para criar um novo pedido"
            }
          </DialogDescription>
        </DialogHeader>
        
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
              onViewOrdersList={handleViewOrdersList}
              onViewOrderDetails={handleViewOrderDetails}
              onCreateNewOrder={handleCreateNewOrder}
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
              customersData={customersData}
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