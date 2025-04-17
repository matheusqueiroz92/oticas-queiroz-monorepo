"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/services/authService";
import { usePayments } from "@/hooks/usePayments";
import { useCustomers } from "@/hooks/useCustomers";
import { paymentFormSchema } from "@/schemas/payment-schema";
import { useOrders } from "@/hooks/useOrders";
import type { CreatePaymentDTO } from "@/app/types/payment";
import { Order } from "@/app/types/order";

export function usePaymentForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEntityType, setSelectedEntityType] = useState<"customer" | "legacyClient" | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [legacyClientSearch, setLegacyClientSearch] = useState("");
  const [showInstallments, setShowInstallments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCheckFields, setShowCheckFields] = useState(false);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);

  const {
    handleCreatePayment,
    cashRegisterData,
    isLoadingCashRegister,
    checkForOpenCashRegisterBeforePayment
  } = usePayments();

  const { customers, isLoading: isLoadingCustomers, fetchAllCustomers } = useCustomers();

  // Usar a função useOrders para obter pedidos e funções relacionadas
  const ordersHook = useOrders();
  const isLoadingOrders = ordersHook.isLoading;

  // Query para buscar pedidos pelo cliente
  const fetchClientOrders = async (clientId: string) => {
    try {
      if (!clientId) return;
      console.log("Buscando pedidos para o cliente ID:", clientId);
      
      // Mudar a implementação para usar o service diretamente
      const response = await api.get(`/api/orders/client/${clientId}`);
      console.log("Resposta da API:", response.data);
      
      // Normalizar os dados dos pedidos se necessário
      const orders = Array.isArray(response.data) 
        ? response.data
        : [];
      setClientOrders(orders);

    } catch (error) {
      console.error("Erro ao buscar pedidos do cliente:", error);
      
      // Verificar se é um erro 404 (pedidos não encontrados)
      if (error instanceof Error && (error as any).response && (error as any).response.status === 404) {
        console.log("Nenhum pedido encontrado para este cliente");
        setClientOrders([]);
      } else {
        // Outro tipo de erro
        setClientOrders([]);
      }
    }

    console.log(clientOrders);
    
  };

  // Query to fetch legacy clients
  const { data: legacyClients = [], isLoading: isLoadingLegacyClients } =
    useQuery({
      queryKey: ["legacyClients", legacyClientSearch],
      queryFn: async () => {
        if (!legacyClientSearch || legacyClientSearch.length < 3) return [];
        const response = await api.get(
          `/api/legacy-clients?search=${legacyClientSearch}`
        );
        return response.data || [];
      },
      enabled: legacyClientSearch.length >= 3,
    });

  // Initialize form
  const form = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
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
  const selectedCustomerId = watch("customerId");

  // Check if we have an open cash register on initial load
  useEffect(() => {
    const checkCashRegister = async () => {
      const cashRegisterId = await checkForOpenCashRegisterBeforePayment();
      if (cashRegisterId) {
        setValue("cashRegisterId", cashRegisterId);
      }
    };
    
    checkCashRegister();
  }, [checkForOpenCashRegisterBeforePayment, setValue]);

  // Handle payment method change for installments
  useEffect(() => {
    setShowInstallments(paymentMethod === "credit");
    setShowCheckFields(paymentMethod === "check");
    
    if (paymentMethod !== "credit") {
      setValue("installments", 1);
    }
    
    if (paymentMethod !== "check") {
      setValue("check", undefined);
    }
  }, [paymentMethod, setValue]);

  // Handle payment type change
  useEffect(() => {
    if (paymentType === "expense") {
      setValue("customerId", undefined);
      setValue("legacyClientId", undefined);
      setValue("orderId", undefined);
      setSelectedEntityType(null);
    }
  }, [paymentType, setValue]);

  // Set cash register when available
  useEffect(() => {
    if (cashRegisterData) {
      setValue("cashRegisterId", cashRegisterData);
    }
  }, [cashRegisterData, setValue]);

  // Buscar pedidos quando um cliente é selecionado
  useEffect(() => {
    if (selectedCustomerId) {
      fetchClientOrders(selectedCustomerId);
    } else {
      setClientOrders([]);
    }
  }, [selectedCustomerId]);

  // Process payment submission
  const onSubmit = async (data: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert amount to number if it's a string
      let amountValue: number;
      
      if (typeof data.amount === 'string') {
        amountValue = parseFloat((data.amount as string).replace(',', '.'));
      } else {
        amountValue = data.amount as number;
      }
      
      // If not a valid number, use 0
      if (isNaN(amountValue)) {
        amountValue = 0;
      }
    
      const paymentData: CreatePaymentDTO = {
        amount: amountValue,
        type: data.type,
        paymentMethod: data.paymentMethod,
        date: data.paymentDate,
        description: data.description,
        category: data.category,
        cashRegisterId: data.cashRegisterId,
        customerId: data.customerId,
        legacyClientId: data.legacyClientId,
        orderId: data.orderId,
        status: "completed", // Sempre completado
      };
    
      // Add installments data if using credit card with multiple installments
      if (
        data.paymentMethod === "credit" &&
        data.installments &&
        data.installments > 1
      ) {
        paymentData.installments = {
          current: 1,
          total: data.installments,
          value: amountValue / data.installments,
        };
      }

      if (data.paymentMethod === "check" && data.check) {
        paymentData.check = {
          bank: data.check.bank,
          checkNumber: data.check.checkNumber,
          checkDate: data.check.checkDate,
          accountHolder: data.check.accountHolder,
          branch: data.check.branch,
          accountNumber: data.check.accountNumber,
          presentationDate: data.check.presentationDate || data.check.checkDate,
          compensationStatus: "pending"
        };
      }
    
      const response = await handleCreatePayment(paymentData);
      
      if (response && response._id) {
        router.push(`/payments/${response._id}`);
      } else {
        router.push("/payments");
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      setIsSubmitting(false);
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep === 1) {
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
    
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Handle entity type selection
  const handleEntityTypeSelect = (type: "customer" | "legacyClient" | null) => {
    setSelectedEntityType(type);
    
    if (type === "customer") {
      setValue("legacyClientId", undefined);
    } else if (type === "legacyClient") {
      setValue("customerId", undefined);
    }
  };

  // Handle client selection
  const handleClientSelect = (clientId: string, name: string) => {
    console.log("ID do cliente selecionado:", clientId);
    setValue("customerId", clientId);
    setCustomerSearch(name);
    
    // Quando um cliente é selecionado, procura os pedidos dele
    fetchClientOrders(clientId);
  };

  // Handle legacy client selection
  const handleLegacyClientSelect = (clientId: string, name: string) => {
    setValue("legacyClientId", clientId);
    setLegacyClientSearch(name);
  };

  // Handle order selection
  const handleOrderSelect = (orderId: string) => {
    setValue("orderId", orderId);
    
    // Quando um pedido é selecionado, preenche o valor do pagamento automaticamente
    const selectedOrder = clientOrders.find(order => order._id === orderId);
    if (selectedOrder) {
      // Se o pedido já estiver parcialmente pago, calcular o valor restante
      if (selectedOrder.paymentStatus === "partially_paid") {
        // Aqui você precisará obter o valor já pago do pedido
        // Por simplicidade, vamos presumir que o valor restante é o valor final
        setValue("amount", selectedOrder.finalPrice);
      } else if (selectedOrder.paymentStatus === "pending") {
        // Se estiver pendente, o valor é o total
        setValue("amount", selectedOrder.finalPrice);
      } else {
        // Se já estiver pago, deixar o valor como 0 ou perguntar ao usuário
        setValue("amount", 0);
      }
    }
  };

  // Handle cancel (go back to payments page)
  const handleCancel = () => {
    router.push("/payments");
  };

  // Return all required props and functions
  return {
    form,
    currentStep,
    isCashRegisterOpen: !!cashRegisterData,
    isLoadingCashRegister,
    cashRegister: cashRegisterData,
    isSubmitting,
    customers,
    isLoadingCustomers,
    legacyClients,
    isLoadingLegacyClients,
    clientOrders,
    isLoadingOrders,
    customerSearch,
    legacyClientSearch,
    selectedEntityType,
    showInstallments,
    showCheckFields,
    showConfirmDialog,
    setShowCheckFields,
    setCustomerSearch,
    setLegacyClientSearch,
    setSelectedEntityType,
    setShowConfirmDialog,
    onClientSelect: handleClientSelect,
    onLegacyClientSelect: handleLegacyClientSelect,
    onOrderSelect: handleOrderSelect,
    onEntityTypeSelect: handleEntityTypeSelect,
    onNext: nextStep,
    onPrev: prevStep,
    onSubmit,
    onCancel: handleCancel,
    fetchAllCustomers,
    fetchClientOrders
  };
}