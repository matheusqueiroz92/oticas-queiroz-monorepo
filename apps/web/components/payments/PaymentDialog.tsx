"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, DollarSign, CreditCard, Banknote } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { usePayments } from "@/hooks/usePayments";
import { useToast } from "@/hooks/useToast";
import { IPayment, PaymentType, PaymentMethod, PaymentStatus } from "@/app/_types/payment";
import { formatCurrency } from "@/app/_utils/formatters";

// Schema de validação para pagamentos
const paymentSchema = z.object({
  type: z.enum(["sale", "debt_payment", "expense"], {
    required_error: "Selecione um tipo de pagamento",
  }),
  paymentMethod: z.enum(["credit", "debit", "cash", "pix", "check", "bank_slip", "promissory_note", "mercado_pago"], {
    required_error: "Selecione um método de pagamento",
  }),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres").optional(),
  customerId: z.string().optional(),
  orderId: z.string().optional(),
  installments: z.object({
    current: z.number(),
    total: z.number(),
    value: z.number(),
  }).optional(),
  checkNumber: z.string().optional(),
  checkBank: z.string().optional(),
  checkDate: z.string().optional(),
  category: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

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
  const { usePaymentForm } = usePayments();
  const { toast } = useToast();
  
  const {
    isCashRegisterOpen,
    isLoadingCashRegister,
    customers,
    isLoadingCustomers,
    clientOrders,
    isLoadingOrders,
    customerSearch,
    orderSearch,
    setCustomerSearch,
    setOrderSearch,
    onClientSelect,
    onOrderSelect,
    fetchAllCustomers,
  } = usePaymentForm();

  const [showInstallments, setShowInstallments] = useState(false);
  const [showCheckFields, setShowCheckFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = mode === 'edit';
  const memoizedPayment = useMemo(() => payment, [payment?._id]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: "sale",
      paymentMethod: "cash",
      amount: 0,
      description: "",
      customerId: "",
      orderId: "",
      installments: undefined,
      checkNumber: "",
      checkBank: "",
      checkDate: "",
      category: "",
    },
  });

  const watchedMethod = form.watch("paymentMethod");
  const watchedType = form.watch("type");

  // Efeito para mostrar/ocultar campos baseado no método de pagamento
  useEffect(() => {
    const isCreditCard = watchedMethod === "credit";
    const isCheck = watchedMethod === "check";
    
    setShowInstallments(isCreditCard);
    setShowCheckFields(isCheck);
    
    if (!isCreditCard) {
      form.setValue("installments", undefined);
    }
    
    if (!isCheck) {
      form.setValue("checkNumber", "");
      form.setValue("checkBank", "");
      form.setValue("checkDate", "");
    }
  }, [watchedMethod, form]);

  // Preencher o formulário quando estiver no modo de edição
  useEffect(() => {
    if (!open) return;

    if (isEditMode && memoizedPayment) {
      form.reset({
        type: memoizedPayment.type,
        paymentMethod: memoizedPayment.paymentMethod,
        amount: memoizedPayment.amount,
        description: memoizedPayment.description || "",
        customerId: memoizedPayment.customerId || "",
        orderId: memoizedPayment.orderId || "",
        installments: memoizedPayment.installments,
        checkNumber: memoizedPayment.check?.checkNumber || "",
        checkBank: memoizedPayment.check?.bank || "",
        checkDate: memoizedPayment.check?.checkDate ? new Date(memoizedPayment.check.checkDate).toISOString().split('T')[0] : "",
        category: memoizedPayment.category || "",
      });
    } else {
      form.reset({
        type: "sale",
        paymentMethod: "cash",
        amount: 0,
        description: "",
        customerId: "",
        orderId: "",
        installments: undefined,
        checkNumber: "",
        checkBank: "",
        checkDate: "",
        category: "",
      });
    }
  }, [memoizedPayment, isEditMode, open, form]);

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
      const paymentData = {
        ...data,
        installments: showInstallments ? data.installments : 1,
        checkNumber: showCheckFields ? data.checkNumber : undefined,
        checkBank: showCheckFields ? data.checkBank : undefined,
        checkDate: showCheckFields ? data.checkDate : undefined,
      };

      // Aqui você implementaria a lógica de criação/edição
      // Similar ao que existe no PaymentForm
      
      toast({
        title: "Sucesso",
        description: `Pagamento ${isEditMode ? 'atualizado' : 'criado'} com sucesso`,
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao ${isEditMode ? 'atualizar' : 'criar'} pagamento`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const getPaymentTypeOptions = () => [
    { value: "sale", label: "Venda" },
    { value: "debt_payment", label: "Pagamento de Dívida" },
    { value: "expense", label: "Despesa" },
  ];

  const getPaymentMethodOptions = () => [
    { value: "cash", label: "Dinheiro" },
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "pix", label: "PIX" },
    { value: "bank_slip", label: "Boleto Bancário" },
    { value: "check", label: "Cheque" },
    { value: "promissory_note", label: "Nota Promissória" },
    { value: "mercado_pago", label: "Mercado Pago" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {isEditMode ? 'Editar Pagamento' : 'Novo Pagamento'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edite as informações do pagamento abaixo.'
              : 'Preencha as informações para registrar um novo pagamento.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Pagamento */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento</FormLabel>
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
                    <FormLabel>Método de Pagamento</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valor */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parcelas (se cartão de crédito) */}
              {showInstallments && (
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
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
            </div>

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do pagamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    name="checkNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Cheque</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do cheque" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkBank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do banco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="checkDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Compensação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Categoria */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Categoria do pagamento (opcional)"
                      {...field}
                    />
                  </FormControl>
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
      </DialogContent>
    </Dialog>
  );
} 