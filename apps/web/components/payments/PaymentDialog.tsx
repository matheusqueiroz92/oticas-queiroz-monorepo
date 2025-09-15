"use client";

import { Loader2, DollarSign, Banknote, Calendar as CalendarIcon, User, Store, ClipboardCheck } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PaymentSuccessScreen from "./PaymentSuccessScreen";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { usePayments } from "@/hooks/payments/usePayments";
import { useToast } from "@/hooks/useToast";
import { handleError, showSuccess } from "@/app/_utils/error-handler";
import { IPayment } from "@/app/_types/payment";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import ClientSearch from "@/components/orders/ClientSearch";
import type { User as UserType } from "@/app/_types/user";
import type { LegacyClient } from "@/app/_types/legacy-client";
import type { Order } from "@/app/_types/order";
import { Badge } from "@/components/ui/badge";

// Tipo para dados do formulário de pagamento
type PaymentFormData = {
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix" | "check" | "bank_slip" | "promissory_note" | "mercado_pago" | "sicredi_boleto";
  amount: number;
  paymentDate: Date;
  description?: string;
  customerId?: string;
  legacyClientId?: string;
  orderId?: string;
  installments?: number;
  cashRegisterId: string;
  check?: {
    bank?: string;
    checkNumber?: string;
    checkDate?: Date;
    presentationDate?: Date;
    accountHolder?: string;
    branch?: string;
    accountNumber?: string;
  };
  category?: string;
  status: "completed" | "pending" | "cancelled";
};

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  payment?: IPayment;
  mode?: 'create' | 'edit';
}

export function PaymentDialog({
  open,
  onOpenChange,
  onSuccess,
  payment,
  mode = 'create',
}: PaymentDialogProps) {
  const { usePaymentForm, handleCreatePayment, refetch } = usePayments();
  const { toast } = useToast();
  
  const {
    form,
    isCashRegisterOpen,
    isLoadingCashRegister,
    cashRegister,
    customers,
    legacyClients,
    clientOrders,
    isLoadingOrders,
    legacyClientSearch,
    selectedEntityType,
    setLegacyClientSearch,
    onClientSelect,
    onOrderSelect,
    onEntityTypeSelect,
    fetchAllCustomers,
    fetchClientOrders,
  } = usePaymentForm();

  const [showInstallments, setShowInstallments] = useState(false);
  const [showCheckFields, setShowCheckFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para tela de confirmação
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState<IPayment | null>(null);
  const [associatedOrder, setAssociatedOrder] = useState<Order | null>(null);
  const [associatedCustomer, setAssociatedCustomer] = useState<UserType | null>(null);

  const isEditMode = mode === 'edit';
  const memoizedPayment = useMemo(() => payment, [payment?._id]);

  const watchedMethod = form.watch("paymentMethod");
  const watchedType = form.watch("type");
  const selectedCustomerId = form.watch("customerId");
  const legacyClientId = form.watch("legacyClientId");
  const selectedOrderId = form.watch("orderId");

  // Efeito para mostrar/ocultar campos baseado no método de pagamento
  useEffect(() => {
    const isCreditCard = watchedMethod === "credit";
    const isCheck = watchedMethod === "check";
    
    setShowInstallments(isCreditCard);
    setShowCheckFields(isCheck);
    
    if (!isCreditCard) {
      form.setValue("installments", 1);
    }
    
    if (!isCheck) {
      form.setValue("check", undefined);
    }
  }, [watchedMethod, form]);

  // Definir o ID do caixa quando disponível
  useEffect(() => {
    if (cashRegister) {
      form.setValue("cashRegisterId", cashRegister);
    }
  }, [cashRegister, form]);

  // Limpar campos de cliente ao alterar o tipo de pagamento para despesa
  useEffect(() => {
    if (watchedType === "expense") {
      form.setValue("customerId", "");
      form.setValue("legacyClientId", "");
      form.setValue("orderId", "");
      onEntityTypeSelect(null);
    }
  }, [watchedType, form, onEntityTypeSelect]);

  // Buscar pedidos quando um cliente for selecionado
  useEffect(() => {
    if (selectedCustomerId && selectedEntityType === "customer") {
      // Chamar fetchClientOrders do hook
      fetchClientOrders(selectedCustomerId);
    }
  }, [selectedCustomerId, selectedEntityType, fetchClientOrders]);

  // Resetar estados quando o dialog fechar
  useEffect(() => {
    if (!open) {
      setShowSuccessScreen(false);
      setSubmittedPayment(null);
      setAssociatedOrder(null);
      setAssociatedCustomer(null);
      return;
    }
  }, [open]);

  // Preencher o formulário quando estiver no modo de edição
  useEffect(() => {
    if (!open) return;

    if (isEditMode && memoizedPayment) {
      form.reset({
        type: memoizedPayment.type,
        paymentMethod: memoizedPayment.paymentMethod,
        amount: memoizedPayment.amount,
        paymentDate: new Date(memoizedPayment.date),
        description: memoizedPayment.description || "",
        customerId: memoizedPayment.customerId || "",
        legacyClientId: memoizedPayment.legacyClientId || "",
        orderId: memoizedPayment.orderId || "",
        installments: typeof memoizedPayment.installments === 'number' ? memoizedPayment.installments : 1,
        cashRegisterId: memoizedPayment.cashRegisterId || cashRegister || "",
        check: memoizedPayment.check,
        category: memoizedPayment.category || "",
        status: memoizedPayment.status || "completed",
      });
    } else {
      form.reset({
        type: "sale",
        paymentMethod: "cash",
        amount: 0,
        paymentDate: new Date(),
        description: "",
        customerId: "",
        legacyClientId: "",
        orderId: "",
        installments: 1,
        cashRegisterId: cashRegister || "",
        check: undefined,
        category: "",
        status: "completed",
      });
    }
  }, [memoizedPayment, isEditMode, open, form, cashRegister]);

  const handleSubmit = async (data: PaymentFormData) => {
    if (!isCashRegisterOpen) {
      toast({
        title: "Erro",
        description: "O caixa deve estar aberto para registrar pagamentos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Preparar dados para criação do pagamento
      const paymentData: any = {
        amount: data.amount,
        type: data.type,
        paymentMethod: data.paymentMethod,
        date: data.paymentDate,
        description: data.description,
        category: data.category,
        cashRegisterId: data.cashRegisterId,
        customerId: data.customerId || undefined,
        legacyClientId: data.legacyClientId || undefined,
        orderId: data.orderId || undefined,
        status: data.status,
      };

      // Adicionar dados de parcelamento se usar cartão de crédito
      if (showInstallments && data.installments && data.installments > 1) {
        paymentData.installments = {
          current: 1,
          total: data.installments,
          value: data.amount / data.installments,
        };
      }

      // Adicionar dados do cheque se necessário
      if (showCheckFields && data.check) {
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

      console.log('Creating payment with data:', paymentData);

      if (isEditMode) {
        // TODO: Implementar lógica de edição quando necessário
        toast({
          title: "Aviso",
          description: "Funcionalidade de edição em desenvolvimento",
          variant: "destructive",
        });
        return;
      } else {
        // Usar a função handleCreatePayment do usePayments
        const response = await handleCreatePayment(paymentData);
        
        if (response) {
          // Forçar atualização da lista de pagamentos
          await refetch();
          
          // Capturar dados para a tela de confirmação
          setSubmittedPayment(response);
          
          // Buscar dados do pedido associado se houver
          if (data.orderId) {
            const orderData = clientOrders?.find((order: Order) => order._id === data.orderId);
            setAssociatedOrder(orderData || null);
          }
          
          // Buscar dados do cliente associado se houver
          if (data.customerId) {
            const customerData = customers?.find((customer: UserType) => customer._id === data.customerId);
            setAssociatedCustomer(customerData || null);
          }
          
          // Mostrar tela de confirmação
          setShowSuccessScreen(true);
          
          showSuccess(
            "Pagamento criado com sucesso",
            "Pagamento registrado e processado no sistema"
          );
        }
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      handleError(
        error,
        `Erro ao ${isEditMode ? 'atualizar' : 'criar'} pagamento`,
        true // Mostrar detalhes do erro
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setShowSuccessScreen(false);
    setSubmittedPayment(null);
    setAssociatedOrder(null);
    setAssociatedCustomer(null);
    onOpenChange(false);
  };

  // Funções para navegação na tela de confirmação
  const handleViewPaymentsList = () => {
    handleCancel();
    onSuccess?.();
  };

  const handleCreateNewPayment = () => {
    setShowSuccessScreen(false);
    setSubmittedPayment(null);
    setAssociatedOrder(null);
    setAssociatedCustomer(null);
    form.reset({
      type: "sale",
      paymentMethod: "cash",
      amount: 0,
      paymentDate: new Date(),
      description: "",
      customerId: "",
      legacyClientId: "",
      orderId: "",
      installments: 1,
      cashRegisterId: cashRegister || "",
      check: undefined,
      category: "",
      status: "completed",
    });
  };

  const handleCloseSuccessScreen = () => {
    handleCancel();
    onSuccess?.();
  };

  const getPaymentTypeOptions = () => [
    { value: "sale", label: "Venda" },
    { value: "debt_payment", label: "Pagamento de Débito" },
    { value: "expense", label: "Despesa" },
  ];

  const getPaymentMethodOptions = () => [
    { value: "cash", label: "Dinheiro" },
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "pix", label: "PIX" },
    { value: "check", label: "Cheque" },
    { value: "bank_slip", label: "Boleto Bancário" },
    { value: "sicredi_boleto", label: "Boleto SICREDI" },
    { value: "promissory_note", label: "Nota Promissória" },
    { value: "mercado_pago", label: "Mercado Pago" },
  ];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/60" />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showSuccessScreen && submittedPayment ? (
          <PaymentSuccessScreen
            submittedPayment={submittedPayment}
            associatedOrder={associatedOrder}
            associatedCustomer={associatedCustomer}
            onViewPaymentsList={handleViewPaymentsList}
            onCreateNewPayment={handleCreateNewPayment}
            onClose={handleCloseSuccessScreen}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-[var(--primary-blue)]" />
                {isEditMode ? 'Editar Pagamento' : 'Novo Pagamento'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Edite as informações do pagamento no sistema'
                  : 'Cadastre um novo pagamento no sistema'
                }
              </DialogDescription>
            </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valor */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          className="pl-10 bg-background text-foreground border-border placeholder:text-muted-foreground"
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data do Pagamento */}
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Pagamento */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getPaymentTypeOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Método de Pagamento */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getPaymentMethodOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Parcelas e Caixa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Parcelas (se cartão de crédito) */}
              {showInstallments && (
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Status do Caixa */}
              <FormField
                control={form.control}
                name="cashRegisterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caixa Atual *</FormLabel>
                    <div className="border rounded-md p-3 bg-background text-foreground border-border">
                      {isLoadingCashRegister ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-muted-foreground text-sm">Carregando caixa...</span>
                        </div>
                      ) : !isCashRegisterOpen || !cashRegister ? (
                        <div className="text-red-500 text-sm">
                          Nenhum caixa disponível. Você precisa abrir um caixa primeiro.
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <ClipboardCheck className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Caixa Aberto</span>
                        </div>
                      )}
                    </div>
                    <input type="hidden" {...field} value={cashRegister || ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seleção de Cliente - Apenas se não for despesa */}
            {watchedType !== "expense" && (
              <div className="space-y-4 border p-4 rounded-md bg-background text-foreground border-border">
                {/* Header com título e pedidos no mesmo nível */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Coluna esquerda - Título, botões e campo de busca */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Informações do Cliente</h4>
                    
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant={selectedEntityType === "customer" ? "default" : "outline"}
                        onClick={() => onEntityTypeSelect("customer")}
                        size="sm"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Cliente
                      </Button>
                      <Button
                        type="button"
                        variant={selectedEntityType === "legacyClient" ? "default" : "outline"}
                        onClick={() => onEntityTypeSelect("legacyClient")}
                        size="sm"
                      >
                        <Store className="mr-2 h-4 w-4" />
                        Cliente Legado
                      </Button>
                    </div>

                    {/* Campo de busca do cliente */}
                    {selectedEntityType === "customer" && (
                      <div className="space-y-2">
                        <ClientSearch 
                          customers={customers || []}
                          form={form as any}
                          onClientSelect={onClientSelect}
                          fetchAllCustomers={fetchAllCustomers}
                        />
                        {selectedCustomerId && (
                          <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                            Cliente selecionado: {customers?.find((c: UserType) => c._id === selectedCustomerId)?.name}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Campo para cliente legado */}
                    {selectedEntityType === "legacyClient" && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Buscar cliente legado..."
                          value={legacyClientSearch}
                          onChange={(e) => setLegacyClientSearch(e.target.value)}
                        />
                        {legacyClientId && (
                          <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                            Cliente legado selecionado: {legacyClients?.find((c: LegacyClient) => c._id === legacyClientId)?.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Coluna direita - Pedidos do Cliente (mesmo nível do título) */}
                  {(selectedCustomerId || clientOrders.length > 0) && watchedType === "sale" && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Pedidos do Cliente</h5>
                      
                      {isLoadingOrders ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                        </div>
                      ) : clientOrders && clientOrders.length > 0 ? (
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                          <div className="space-y-2 p-3">
                            {clientOrders.map((order: Order) => {
                              const paymentStatus = order.paymentStatus === "paid" 
                                ? "Pago" 
                                : order.paymentStatus === "partially_paid" 
                                  ? "Parcialmente Pago" 
                                  : "Pendente";
                                  
                              const statusClass = order.paymentStatus === "paid" 
                                ? "bg-green-100 text-green-800" 
                                : order.paymentStatus === "partially_paid" 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-red-100 text-red-800";
                                
                              return (
                                <div
                                  key={order._id}
                                  className={`p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedOrderId === order._id ? "bg-blue-50 border-blue-200" : ""
                                  }`}
                                  onClick={() => {
                                    form.setValue("orderId", order._id);
                                    onOrderSelect(order._id);
                                  }}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">
                                        {order.serviceOrder ? `O.S. #${order.serviceOrder}` : `#${order._id.substring(0, 8)}`}
                                      </span>
                                      <Badge className={`text-xs ${statusClass}`}>
                                        {paymentStatus}
                                      </Badge>
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-medium text-green-700">
                                        {formatCurrency(order.finalPrice)}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {formatDate(order.createdAt)}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        {order.status === "pending" ? "Pendente" :
                                         order.status === "in_production" ? "Em Produção" :
                                         order.status === "ready" ? "Pronto" :
                                         order.status === "delivered" ? "Entregue" :
                                         "Cancelado"}
                                      </span>
                                      <Button
                                        type="button"
                                        variant={selectedOrderId === order._id ? "default" : "outline"}
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          form.setValue("orderId", order._id);
                                          onOrderSelect(order._id);
                                        }}
                                      >
                                        {selectedOrderId === order._id ? "Selecionado" : "Selecionar"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground border rounded-md">
                          <p className="text-sm">Nenhum pedido encontrado</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pedido selecionado (full width abaixo) */}
                {selectedOrderId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h6 className="text-sm font-medium text-blue-800">
                      Pedido selecionado
                    </h6>
                    <p className="text-sm text-blue-700 mt-1">
                      {clientOrders.find((order: Order) => order._id === selectedOrderId)?.serviceOrder 
                        ? `O.S. #${clientOrders.find((order: Order) => order._id === selectedOrderId)?.serviceOrder}` 
                        : `Pedido #${selectedOrderId.substring(0, 8)}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Campos específicos para cheque */}
            {showCheckFields && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Informações do Cheque
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="check.bank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Banco do Brasil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="check.checkNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Cheque *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 000123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="check.accountHolder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titular da Conta *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do titular" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="check.branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="check.accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Conta *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 12345-6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Categoria para despesas */}
            {watchedType === "expense" && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria da Despesa *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="utilidades">Água/Luz/Internet</SelectItem>
                        <SelectItem value="fornecedores">Fornecedores</SelectItem>
                        <SelectItem value="salarios">Salários</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="impostos">Impostos</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição/Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição ou observações sobre este pagamento..." 
                      className="min-h-[80px] bg-background text-foreground border-border placeholder:text-muted-foreground"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Adicione informações adicionais sobre este pagamento, se necessário
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de ação */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isCashRegisterOpen}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Atualizar' : 'Criar'} Pagamento
              </Button>
            </div>
          </form>
        </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 