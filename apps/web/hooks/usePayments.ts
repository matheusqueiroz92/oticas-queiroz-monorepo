"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  cancelPayment,
  getPaymentsByCashRegister,
} from "@/app/services/paymentService";
import { checkOpenCashRegister } from "@/app/services/cashRegisterService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import { API_ROUTES } from "../app/constants/api-routes";
import { api } from "@/app/services/authService";
import { paymentFormSchema } from "@/schemas/payment-schema";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import type {
  CreatePaymentDTO,
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  IPayment
} from "@/app/types/payment";
import { Order } from "@/app/types/order";
import { formatCurrency } from "@/app/utils/formatters";

interface PaymentFilters {
  search?: string;
  page?: number;
  type?: PaymentType;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}

export function usePayments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar pagamentos paginados com filtros
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.PAGINATED(currentPage, filters),
    queryFn: () => getAllPayments({ ...filters, page: currentPage }),
    placeholderData: (prevData) => prevData,
  });

  // Dados normalizados
  const payments = data?.payments || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalPayments = data?.pagination?.total || 0;

  // Mutation para criar pagamento
  const createPaymentMutation = useMutation({
    mutationFn: async (data: CreatePaymentDTO) => {
      // Verificar se há um caixa aberto e obter seu ID
      const cashRegisterResult = await checkOpenCashRegister();

      if (!cashRegisterResult.isOpen || !cashRegisterResult.data) {
        throw new Error(
          "É necessário abrir um caixa antes de registrar pagamentos."
        );
      }

      // Adicionar o ID do caixa aos dados do pagamento se não foi fornecido
      const paymentData = {
        ...data,
        cashRegisterId: data.cashRegisterId || cashRegisterResult.data._id,
      };

      return createPayment(paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });
    },
    onError: (error: unknown) => {
      console.error("Erro ao criar pagamento:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o pagamento. Verifique as informações e tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });

      // Se o erro for relacionado ao caixa fechado, redireciona para abrir um caixa
      if (errorMessage.includes("caixa")) {
        router.push("/cash-register/open");
      }
    },
  });

  // Mutation para cancelar pagamento
  const cancelPaymentMutation = useMutation({
    mutationFn: cancelPayment,
    onSuccess: (result, id) => {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PAYMENTS.DETAIL(id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PAYMENTS.PAGINATED(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });

      return result;
    },
    onError: (error: unknown, id) => {
      console.error(`Erro ao cancelar pagamento com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar o pagamento.",
      });
    },
  });

  // Função para buscar pagamentos por caixa (retorna a configuração da query)
  const getPaymentsByCashRegisterQuery = (cashRegisterId: string) => ({
    queryKey: QUERY_KEYS.PAYMENTS.BY_CASH_REGISTER(cashRegisterId),
    queryFn: () => getPaymentsByCashRegister(cashRegisterId),
    enabled: !!cashRegisterId,
  });

  // Função para verificar se há um caixa aberto
  const checkForOpenCashRegisterBeforePayment = async (): Promise<
    string | null
  > => {
    try {
      const result = await checkOpenCashRegister();

      if (result.isOpen && result.data) {
        return result.data._id;
      }

      // Notificar que não há caixa aberto
      toast({
        variant: "destructive",
        title: "Nenhum caixa aberto",
        description:
          "É necessário abrir um caixa antes de registrar pagamentos.",
      });

      return null;
    } catch (error) {
      console.error("Erro ao verificar status do caixa:", error);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar o status do caixa.",
      });

      return null;
    }
  };

  // Query para verificar se há um caixa aberto
  const { data: cashRegisterData, isLoading: isLoadingCashRegister } = useQuery(
    {
      queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      queryFn: checkOpenCashRegister,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
    }
  );

  // Função para atualizar filtros
  const updateFilters = (newFilters: PaymentFilters) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Funções que utilizam as mutations
  const handleCreatePayment = (data: CreatePaymentDTO) => {
    console.log("Dados recebidos em handleCreatePayment:", data);
    console.log("Valor final antes de enviar para o backend:", data.amount);
    
    // VERIFICAÇÃO IMPORTANTE: Se houver um pedido selecionado, NÃO substitua o valor
    // Remova ou comente qualquer código similar a este:
    /*
    if (data.orderId) {
      const selectedOrder = clientOrders.find(order => order._id === data.orderId);
      if (selectedOrder) {
        data.amount = selectedOrder.finalPrice; // <-- REMOVA ESTA LINHA
      }
    }
    */
    
    return createPaymentMutation.mutateAsync(data);
  };

  const handleCancelPayment = (id: string) => {
    return cancelPaymentMutation.mutateAsync(id);
  };

  // Funções de navegação
  const navigateToPaymentDetails = (id: string) => {
    router.push(`/payments/${id}`);
  };

  const navigateToCreatePayment = () => {
    router.push("/payments/new");
  };

// Hook integrado usePaymentForm dentro do usePayments
const usePaymentForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEntityType, setSelectedEntityType] = useState<"customer" | "legacyClient" | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [legacyClientSearch, setLegacyClientSearch] = useState("");
  const [showInstallments, setShowInstallments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCheckFields, setShowCheckFields] = useState(false);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState("");

  // Query para verificar se há um caixa aberto
  const { 
    data: formCashRegisterData, 
    isLoading: isLoadingFormCashRegister 
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
    queryFn: checkOpenCashRegister,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { customers, isLoading: isLoadingCustomers, fetchAllCustomers } = useCustomers();

  // Usar a função useOrders para obter pedidos e funções relacionadas
  const ordersHook = useOrders();
  const isLoadingOrders = ordersHook.isLoading;

  // Query para buscar pedidos pelo cliente
  const fetchClientOrders = async (clientId: string) => {
    try {
      if (!clientId) return;
      console.log("Buscando pedidos para o cliente ID:", clientId);
      
      // Usar o endpoint de orders com API_ROUTES
      const response = await api.get(API_ROUTES.ORDERS.CLIENT(clientId));
      console.log("Resposta da API:", response.data);
      
      // Garantir que estamos sempre trabalhando com um array
      if (Array.isArray(response.data)) {
        setClientOrders(response.data);
      } else if (response.data) {
        // Se a resposta não for um array, mas tiver dados, transformar em array
        setClientOrders([response.data]);
      } else {
        setClientOrders([]);
      }

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

  // Inicializa o formulário
  const form = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      type: "sale" as PaymentType,
      paymentMethod: "cash" as PaymentMethod,
      paymentDate: new Date(),
      description: "",
      category: "",
      installments: 1,
      status: "completed" as PaymentStatus,
    },
  });

  const { watch, setValue } = form;
  const paymentMethod = watch("paymentMethod");
  const paymentType = watch("type");
  const selectedCustomerId = watch("customerId");

  // Verificar se há um caixa aberto ao carregar a página
  useEffect(() => {
    const checkCashRegister = async () => {
      const cashRegisterResult = await checkOpenCashRegister();
      if (cashRegisterResult && cashRegisterResult.isOpen && cashRegisterResult.data) {
        setValue("cashRegisterId", cashRegisterResult.data._id);
      }
    };
    
    checkCashRegister();
  }, [setValue]);

  // Gerenciar installments e campos do cheque com base no método de pagamento
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

  // Limpar campos de cliente ao alterar o tipo de pagamento para despesa
  useEffect(() => {
    if (paymentType === "expense") {
      setValue("customerId", undefined);
      setValue("legacyClientId", undefined);
      setValue("orderId", undefined);
      setSelectedEntityType(null);
    }
  }, [paymentType, setValue]);

  // Definir o ID do caixa quando disponível
  useEffect(() => {
    if (formCashRegisterData && formCashRegisterData.isOpen && formCashRegisterData.data) {
      setValue("cashRegisterId", formCashRegisterData.data._id);
    }
  }, [formCashRegisterData, setValue]);

  // Buscar pedidos quando um cliente é selecionado
  useEffect(() => {
    if (selectedCustomerId) {
      fetchClientOrders(selectedCustomerId);
    } else {
      setClientOrders([]);
    }
  }, [selectedCustomerId]);

  const amountValue = watch('amount');
  // Monitorar o valor do pagamento
  useEffect(() => {
    console.log('Valor do pagamento monitorado:', amountValue);
  }, [amountValue]);

  // Processar o envio do pagamento
  const onSubmit = async (data: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Valores do formulário antes do processamento:", data);
      console.log("Valor do pagamento antes do processamento:", data.amount);
      
      // Converter amount para número se for uma string
      let amountValue: number;
      
      if (typeof data.amount === 'string') {
        amountValue = parseFloat((data.amount as string).replace(',', '.'));
      } else {
        amountValue = data.amount as number;
      }
      
      // Se não for um número válido, usar 0
      if (isNaN(amountValue)) {
        amountValue = 0;
      }
      
      console.log("Valor de pagamento processado:", amountValue);
    
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
        status: "completed" as PaymentStatus,
      };
      
      // IMPORTANTE: Verificar se o valor ainda é o correto após criar o objeto
      console.log("Dados de pagamento construídos:", paymentData);
      console.log("Verificação final do valor de pagamento:", paymentData.amount);
    
      // Adicionar dados de parcelamento se usar cartão de crédito com múltiplas parcelas
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
  
      // Adicionar dados do cheque se o método de pagamento for cheque
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
      
      console.log("Dados de pagamento finais antes do envio:", paymentData);
      console.log("Verificação final do valor de pagamento antes do envio:", paymentData.amount);
      
      const response = await handleCreatePayment(paymentData);
      
      console.log("Resposta do servidor após criar pagamento:", response);
      
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

  // Navegação entre etapas
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

  // Gerenciar seleção de tipo de entidade
  const handleEntityTypeSelect = (type: "customer" | "legacyClient" | null) => {
    setSelectedEntityType(type);
    
    if (type === "customer") {
      setValue("legacyClientId", undefined);
    } else if (type === "legacyClient") {
      setValue("customerId", undefined);
    }
  };

  // Gerenciar seleção de cliente
  const handleClientSelect = (clientId: string, name: string) => {
    console.log("ID do cliente selecionado:", clientId);
    setValue("customerId", clientId);
    setCustomerSearch(name);
    
    // Quando um cliente é selecionado, procura os pedidos dele
    fetchClientOrders(clientId);
  };

  // Gerenciar seleção de cliente legado
  const handleLegacyClientSelect = (clientId: string, name: string) => {
    setValue("legacyClientId", clientId);
    setLegacyClientSearch(name);
  };

  // Gerenciar seleção de pedido - versão atualizada
  const handleOrderSelect = (orderId: string) => {
    setValue("orderId", orderId);
    
    // NÃO modifique o valor amount aqui! Deixe o valor que o usuário já digitou
    
    // Quando um pedido é selecionado, apenas notificar sobre o valor total
    const selectedOrder = clientOrders.find(order => order._id === orderId);
    if (selectedOrder) {
      toast({
        title: "Pedido selecionado",
        description: `Pedido no valor total de ${formatCurrency(selectedOrder.finalPrice)}. Informe o valor que deseja pagar.`,
      });
      
      // Se estiver parcialmente pago, mostrar quanto já foi pago
      if (selectedOrder.paymentStatus === "partially_paid" && selectedOrder.paymentHistory) {
        const totalPaid = selectedOrder.paymentHistory.reduce((sum, entry) => sum + entry.amount, 0) || 0;
        const remainingAmount = Math.max(0, selectedOrder.finalPrice - totalPaid);
        
        toast({
          title: "Pagamento parcial",
          description: `Este pedido já possui pagamentos: ${formatCurrency(totalPaid)} de ${formatCurrency(selectedOrder.finalPrice)}. Restante: ${formatCurrency(remainingAmount)}.`,
        });
      }
      
      // Se já estiver pago, alertar o usuário
      if (selectedOrder.paymentStatus === "paid") {
        toast({
          variant: "warning",
          title: "Pedido já pago",
          description: "Este pedido já está marcado como pago. Confirme se realmente deseja adicionar um novo pagamento.",
        });
      }
    }
  };

  // Gerenciar cancelamento (voltar para a página de pagamentos)
  const handleCancel = () => {
    router.push("/payments");
  };

  return {
    form,
    currentStep,
    isCashRegisterOpen: !!(formCashRegisterData && formCashRegisterData.isOpen && formCashRegisterData.data),
    isLoadingCashRegister: isLoadingFormCashRegister,
    cashRegister: formCashRegisterData?.data?._id || null,
    isSubmitting,
    customers,
    isLoadingCustomers,
    legacyClients,
    isLoadingLegacyClients,
    clientOrders,
    isLoadingOrders,
    customerSearch,
    orderSearch,
    legacyClientSearch,
    selectedEntityType,
    showInstallments,
    showCheckFields,
    showConfirmDialog,
    setShowCheckFields,
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
    fetchAllCustomers,
    fetchClientOrders
  };
};

  return {
    payments,
    isLoading,
    cashRegisterData,
    isLoadingCashRegister,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalPayments,
    filters,
    isCreating: createPaymentMutation.isPending,
    isCancelling: cancelPaymentMutation.isPending,
    setCurrentPage,
    updateFilters,
    getPaymentById,
    handleCreatePayment,
    handleCancelPayment,
    getPaymentsByCashRegisterQuery,
    navigateToPaymentDetails,
    navigateToCreatePayment,
    checkForOpenCashRegisterBeforePayment,
    refetch,
    usePaymentForm,
  };
}