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

export function usePaymentForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEntityType, setSelectedEntityType] = useState<
    "customer" | "legacyClient" | null
  >(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [legacyClientSearch, setLegacyClientSearch] = useState("");
  const [showInstallments, setShowInstallments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    handleCreatePayment,
    isCreating,
    cashRegisterData,
    isLoadingCashRegister,
    checkForOpenCashRegisterBeforePayment
  } = usePayments();

  const { customers, isLoading: isLoadingCustomers, fetchAllCustomers } = useCustomers();

  const { orders, isLoading: isLoadingOrders } = useOrders();

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
    if (paymentMethod !== "credit") {
      setValue("installments", 1);
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
        status: data.status,
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
    setValue("customerId", clientId);
    setCustomerSearch(name);
  };

  // Handle legacy client selection
  const handleLegacyClientSelect = (clientId: string, name: string) => {
    setValue("legacyClientId", clientId);
    setLegacyClientSearch(name);
  };

  // Handle order selection
  const handleOrderSelect = (orderId: string, name: string) => {
    setValue("orderId", orderId);
    setOrderSearch(name);
  };

  // Handle cancel (go back to payments page)
  const handleCancel = () => {
    router.push("/payments");
  };

  // Load orders when searching
//   useEffect(() => {
//     if (orderSearch && orderSearch.length >= 3) {
//       getAllOrders({ search: orderSearch });
//     }
//   }, [orderSearch, getAllOrders]);

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
    orders,
    isLoadingOrders,
    customerSearch,
    orderSearch,
    legacyClientSearch,
    selectedEntityType,
    showInstallments,
    showConfirmDialog,
    setCustomerSearch,
    setOrderSearch,
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
    fetchAllCustomers
  };
}