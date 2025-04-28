import React from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  DollarSign,
  Loader2,
  User,
  Store,
  ClipboardCheck,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import ClientSearch from "@/components/Orders/ClientSearch";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import type { Order } from "@/app/types/order";
import type { User as UserType } from "@/app/types/user";
import type { LegacyClient } from "@/app/types/legacy-client";

type PaymentFormValues = any;

const steps = [
  { id: "basic", label: "Informações Básicas" },
  { id: "details", label: "Detalhes Relacionados" },
  { id: "confirm", label: "Revisão e Confirmação" }
];

interface PaymentFormProps {
  form: ReturnType<typeof useForm<PaymentFormValues>>;
  currentStep: number;
  isCashRegisterOpen: boolean;
  isLoadingCashRegister: boolean;
  cashRegister: string | null;
  isSubmitting: boolean;
  customers: UserType[];
  isLoadingCustomers: boolean;
  legacyClients: LegacyClient[];
  isLoadingLegacyClients: boolean;
  clientOrders: Order[];
  isLoadingOrders: boolean;
  customerSearch: string;
  orderSearch: string;
  legacyClientSearch: string;
  selectedEntityType: "customer" | "legacyClient" | null;
  showInstallments: boolean;
  showCheckFields: boolean;
  showMercadoPagoOption?: boolean;
  onSelectMercadoPago?: () => void;
  onShowCheckFields: (value: boolean) => void;
  onCustomerSearchChange: (value: string) => void;
  onOrderSearchChange: (value: string) => void;
  onLegacyClientSearchChange: (value: string) => void;
  onEntityTypeSelect: (type: "customer" | "legacyClient" | null) => void;
  onClientSelect: (id: string, name: string) => void;
  onLegacyClientSelect: (id: string, name: string) => void;
  onOrderSelect: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: (data: PaymentFormValues) => void;
  onCancel: () => void;
  fetchAllCustomers: () => Promise<UserType[]>;
}

export function PaymentForm({
  form,
  currentStep,
  isCashRegisterOpen,
  isLoadingCashRegister,
  cashRegister,
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
  onShowCheckFields,
  onCustomerSearchChange,
  onOrderSearchChange,
  onLegacyClientSearchChange,
  onEntityTypeSelect,
  onClientSelect,
  onLegacyClientSelect,
  onOrderSelect,
  onNext,
  onPrev,
  onSubmit,
  onCancel,
  fetchAllCustomers,
}: PaymentFormProps) {
  const { watch, setValue } = form;
  const paymentType = watch("type");
  const paymentMethod = watch("paymentMethod");
  const selectedCustomerId = watch("customerId");
  const selectedOrderId = watch("orderId");
  const legacyClientId = watch("legacyClientId");
  
  // Função para obter o status do pagamento do pedido selecionado
  const getOrderPaymentStatus = () => {
    if (!selectedOrderId) return null;
    const selectedOrder = clientOrders.find(order => order._id === selectedOrderId);
    if (!selectedOrder) return null;
    
    return {
      status: selectedOrder.paymentStatus,
      label: selectedOrder.paymentStatus === "paid" 
        ? "Pago" 
        : selectedOrder.paymentStatus === "partially_paid" 
          ? "Parcialmente Pago" 
          : "Pendente",
      className: selectedOrder.paymentStatus === "paid" 
        ? "bg-green-100 text-green-800" 
        : selectedOrder.paymentStatus === "partially_paid" 
          ? "bg-yellow-100 text-yellow-800" 
          : "bg-red-100 text-red-800"
    };
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderRelatedDetailsStep();
      case 3:
        return renderConfirmationStep();
      default:
        return renderBasicInfoStep();
    }
  };
  
  const renderBasicInfoStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        className="pl-10"
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

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
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
                      <SelectItem value="sale">Venda</SelectItem>
                      <SelectItem value="debt_payment">
                        Pagamento de Débito
                      </SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento *</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "check") {
                      onShowCheckFields(true);
                    } else {
                      onShowCheckFields(false);
                    }
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentMethod === "credit" && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : Number.parseInt(e.target.value, 10)
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Aplicável apenas para pagamentos com cartão de crédito
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Campo Caixa movido aqui para ficar alinhado com "Valor (R$)" */}
            <FormField
              control={form.control}
              name="cashRegisterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caixa *</FormLabel>
                  <div className="border rounded-md p-3 bg-gray-50">
                    {isLoadingCashRegister ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-muted-foreground">Carregando caixa...</span>
                      </div>
                    ) : !cashRegister ? (
                      <div className="text-red-500">
                        Nenhum caixa disponível. Você precisa abrir um caixa primeiro.
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ClipboardCheck className="h-4 w-4 text-green-500" />
                        <span>Caixa Aberto: {cashRegister}</span>
                      </div>
                    )}
                  </div>
                  <input type="hidden" {...field} value={cashRegister || ""} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            {showCheckFields && (
              <div className="space-y-4 border p-4 rounded-md bg-gray-50">
                <h3 className="font-medium">Dados do Cheque</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="check.bank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Banco do Brasil" />
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
                          <Input {...field} placeholder="Ex: 000123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="check.checkDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Cheque *</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="check.presentationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Apresentação</FormLabel>
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
                        <FormDescription>
                          Para cheques pré-datados
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <FormField
                    control={form.control}
                    name="check.accountHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titular da Conta *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome completo do titular" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="check.branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 1234" />
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
                          <Input {...field} placeholder="Ex: 12345-6" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {paymentType === "expense" && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria da Despesa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="utilidades">
                          Água/Luz/Internet
                        </SelectItem>
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
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição ou observações sobre este pagamento..."
                      className="min-h-[80px]"
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
          </div>
        </div>
      </div>
    );
  };
  
  const renderRelatedDetailsStep = () => {
    if (paymentType === "expense") {
      return (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
            <h3 className="text-sm font-medium">Despesa</h3>
            <p className="text-sm mt-1">
              Registrando uma despesa. Você não precisa vincular a um cliente ou
              pedido.
            </p>
          </div>

          {/* Hidden status field - sempre completado para despesas */}
          <input 
            type="hidden" 
            name="status" 
            value="completed" 
            onChange={() => setValue("status", "completed")}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Selecione o tipo de cliente:</h3>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={
                  selectedEntityType === "customer" ? "default" : "outline"
                }
                onClick={() => onEntityTypeSelect("customer")}
                className="flex-1"
              >
                <User className="mr-2 h-4 w-4" />
                Cliente
              </Button>
              <Button
                type="button"
                variant={
                  selectedEntityType === "legacyClient" ? "default" : "outline"
                }
                onClick={() => onEntityTypeSelect("legacyClient")}
                className="flex-1"
              >
                <Store className="mr-2 h-4 w-4" />
                Cliente Legado
              </Button>
            </div>

            {selectedEntityType === "customer" && (
              <div className="space-y-4">
                <ClientSearch 
                  customers={customers || []}
                  form={form as any}
                  onClientSelect={onClientSelect}
                  fetchAllCustomers={fetchAllCustomers}
                />

                {selectedCustomerId && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-800">
                      Cliente selecionado
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      {customers.find(
                        (c: UserType) => c._id === selectedCustomerId
                      )?.name || "Cliente"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedEntityType === "legacyClient" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Buscar cliente legado por nome ou documento..."
                    value={legacyClientSearch}
                    onChange={(e) => onLegacyClientSearchChange(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {isLoadingLegacyClients && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {legacyClientSearch &&
                  legacyClientSearch.length >= 3 &&
                  legacyClients.length > 0 && (
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      <ul className="space-y-2">
                        {legacyClients.map((client: LegacyClient) => (
                          <li
                            key={client._id}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">
                                CPF: {client.cpf}
                                {client.totalDebt > 0 && (
                                  <span className="ml-2 text-red-500">
                                    Débito: R$ {client.totalDebt.toFixed(2)}
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onLegacyClientSelect(client._id!, client.name)}
                            >
                              Selecionar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {legacyClientSearch &&
                  legacyClientSearch.length >= 3 &&
                  legacyClients.length === 0 &&
                  !isLoadingLegacyClients && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhum cliente legado encontrado
                    </div>
                  )}

                {legacyClientId && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-800">
                      Cliente legado selecionado
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      {legacyClients.find(
                        (c: LegacyClient) => c._id === legacyClientId
                      )?.name || "Cliente legado"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Status de pagamento - hidden field */}
            <input 
              type="hidden" 
              name="status" 
              value="completed" 
              onChange={() => setValue("status", "completed")}
            />
          </div>

          <div className="space-y-4">
            {(selectedCustomerId || legacyClientId) &&
              paymentType === "sale" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">
                    Pedidos do Cliente
                  </h3>

                  {isLoadingOrders ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : clientOrders && clientOrders.length > 0 ? (
                    <div 
                      key={`orders-list-${clientOrders.length}-${selectedCustomerId}`} 
                      className="border rounded-md p-4 max-h-80 overflow-y-auto"
                    >
                      <ul className="space-y-3">
                        {clientOrders.map((order) => {
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
                            <li
                              key={order._id || `order-${Math.random()}`}
                              className={`flex justify-between items-start border-b pb-3 ${
                                selectedOrderId === order._id ? "bg-blue-50 p-2 rounded" : ""
                              }`}
                            >
                                <div>
                                  <p className="font-medium">
                                    {order.serviceOrder ? `O.S. #${order.serviceOrder}` : `Pedido #${order._id.substring(0, 8)}`}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge className={`text-xs ${statusClass}`}>
                                      {paymentStatus}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      Status: {order.status === "pending" ? "Pendente" :
                                            order.status === "in_production" ? "Em Produção" :
                                            order.status === "ready" ? "Pronto" :
                                            order.status === "delivered" ? "Entregue" :
                                            "Cancelado"}
                                    </span>
                                  </div>
                                  <div className="text-sm mt-1">
                                    <span className="font-medium text-green-700">
                                      {formatCurrency(order.finalPrice)}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      {formatDate(order.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <Button
                                    type="button"
                                    variant={selectedOrderId === order._id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onOrderSelect(order._id)}
                                    className="mt-2"
                                  >
                                    {selectedOrderId === order._id ? "Selecionado" : "Selecionar"}
                                  </Button>
                                </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground border rounded-md">
                      Nenhum pedido encontrado para este cliente
                    </div>
                  )}
                  
                  {selectedOrderId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                      <h4 className="text-sm font-medium text-blue-800">
                        Pedido selecionado
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {clientOrders.find(order => order._id === selectedOrderId)?.serviceOrder 
                          ? `O.S. #${clientOrders.find(order => order._id === selectedOrderId)?.serviceOrder}` 
                          : `Pedido #${selectedOrderId.substring(0, 8)}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderConfirmationStep = () => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
          <h3 className="text-md font-medium text-blue-800">
            Resumo do Pagamento
          </h3>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-blue-700 font-medium">Valor:</div>
            <div className="text-blue-900">
              {typeof watch("amount") === "number" 
                ? formatCurrency(watch("amount")) 
                : "R$ 0,00"}
            </div>

            <div className="text-blue-700 font-medium">Tipo:</div>
            <div className="text-blue-900">
              {watch("type") === "sale"
                ? "Venda"
                : watch("type") === "debt_payment"
                  ? "Pagamento de Débito"
                  : "Despesa"}
            </div>

            <div className="text-blue-700 font-medium">Método:</div>
            <div className="text-blue-900">
              {watch("paymentMethod") === "cash"
                ? "Dinheiro"
                : watch("paymentMethod") === "credit"
                  ? "Cartão de Crédito"
                  : watch("paymentMethod") === "debit"
                    ? "Cartão de Débito"
                    : watch("paymentMethod") === "pix"
                      ? "PIX"
                      : "Cheque"}
            </div>

            <div className="text-blue-700 font-medium">Data:</div>
            <div className="text-blue-900">
              {watch("paymentDate")
                ? format(watch("paymentDate"), "dd/MM/yyyy", { locale: ptBR })
                : "Não selecionada"}
            </div>

            <div className="text-blue-700 font-medium">Status:</div>
            <div className="text-blue-900">
              Concluído
            </div>

            {watch("paymentMethod") === "credit" &&
              watch("installments") &&
              (watch("installments") ?? 0) > 1 && (
                <>
                  <div className="text-blue-700 font-medium">Parcelas:</div>
                  <div className="text-blue-900">
                    {watch("installments")}x de {formatCurrency(
                      Number(watch("amount")) / (watch("installments") || 1)
                    )}
                  </div>
                </>
              )}

            {selectedCustomerId && (
              <>
                <div className="text-blue-700 font-medium">Cliente:</div>
                <div className="text-blue-900">
                  {customers.find(
                    (c: UserType) => c._id === selectedCustomerId
                  )?.name || "Cliente selecionado"}
                </div>
              </>
            )}

            {legacyClientId && (
              <>
                <div className="text-blue-700 font-medium">Cliente Legado:</div>
                <div className="text-blue-900">
                  {legacyClients.find(
                    (c: LegacyClient) => c._id === legacyClientId
                  )?.name || "Cliente legado selecionado"}
                </div>
              </>
            )}

            {selectedOrderId && (
              <>
                <div className="text-blue-700 font-medium">
                  Pedido vinculado:
                </div>
                <div className="text-blue-900">
                  {clientOrders.find(order => order._id === selectedOrderId)?.serviceOrder 
                    ? `O.S. #${clientOrders.find(order => order._id === selectedOrderId)?.serviceOrder}` 
                    : `#${selectedOrderId?.substring(0, 8) ?? ""}`}
                </div>
                {selectedOrderId && (
                  <div className="text-blue-700 font-medium mt-2">
                    Valor do pedido:
                  </div>
                )}
                {selectedOrderId && (
                  <div className="text-blue-900">
                    {formatCurrency(clientOrders.find(order => order._id === selectedOrderId)?.finalPrice || 0)}
                  </div>
                )}
                {selectedOrderId && (
                  <div className="text-blue-700 font-medium mt-2">
                    Status de pagamento:
                  </div>
                )}
                {selectedOrderId && (
                  <div className="text-blue-900 flex items-center">
                    <Badge className={`mr-2 ${getOrderPaymentStatus()?.className || "bg-gray-100 text-gray-800"}`}>
                      {getOrderPaymentStatus()?.label || "Pendente"}
                    </Badge>
                  </div>
                )}
              </>
            )}

            {paymentType === "expense" && watch("category") && (
              <>
                <div className="text-blue-700 font-medium">Categoria:</div>
                <div className="text-blue-900">{watch("category")}</div>
              </>
            )}
          </div>
        </div>
        
        {/* Campo de observações adicionado novamente no step 3 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione observações ou notas sobre este pagamento..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Revise e atualize as observações sobre este pagamento, se necessário
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };
  
  // Verificar se o botão de próximo deve estar desabilitado
  const isNextButtonDisabled = () => {
    if (currentStep === 1) {
      // Campos obrigatórios do passo 1
      const amount = watch("amount");
      const paymentDate = watch("paymentDate");
      const cashRegisterId = watch("cashRegisterId");
      
      return !amount || amount <= 0 || !paymentDate || !cashRegisterId || !isCashRegisterOpen;
    }
    
    if (currentStep === 2) {
      const type = watch("type");
      
      if (type === "expense") {
        return false;
      } else {
        const hasCustomer = !!selectedCustomerId || !!legacyClientId;
        // Para vendas, idealmente temos um pedido selecionado, mas não obrigatório
        return !hasCustomer;
      }
    }
    
    return false;
  };
  
  return (
    <div className="max-w-6xl mx-auto p-3">
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50 p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-primary">Novo Pagamento</CardTitle>
              <CardDescription>Registre um novo pagamento</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <Form {...form}>
            <form 
              id="paymentForm" 
              onSubmit={(e) => {
                e.preventDefault();
                // Não submete automaticamente ao chegar no passo 3
                // O usuário precisa clicar no botão "Registrar Pagamento"
              }}
              className="space-y-4"
            >
              <div className="w-full mb-6">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div 
                      key={step.id} 
                      className="flex flex-col items-center"
                      style={{ width: `${100/steps.length}%` }}
                    >
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full 
                        ${index < currentStep - 1 ? 'bg-green-500 text-white' : 
                          index === currentStep - 1 ? 'bg-primary text-white' : 
                          'bg-gray-200 text-gray-500'}
                        ${index <= currentStep - 1 ? 'cursor-pointer' : 'cursor-not-allowed'}
                      `}
                      onClick={() => {
                        if (index <= currentStep - 1) {
                          // Navegação para passos anteriores
                          if (index === 0) onPrev();
                          if (index === 1 && currentStep === 3) onPrev();
                        }
                      }}
                      >
                        <span>{index + 1}</span>
                      </div>
                      <span className={`
                        text-xs mt-1 text-center
                        ${index === currentStep - 1 ? 'text-primary font-medium' : 'text-gray-500'}
                      `}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="relative w-full h-1 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="absolute top-0 left-0 h-1 bg-primary rounded-full"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {renderStepContent()}
                
              <div className="flex justify-between pt-3 border-t">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onPrev}
                      size="sm"
                      className="flex items-center text-sm h-9"
                    >
                      <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                      Anterior
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    size="sm"
                    className="text-sm h-9"
                  >
                    Cancelar
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button 
                      type="button" 
                      onClick={onNext}
                      disabled={isNextButtonDisabled()}
                      size="sm"
                      className="flex items-center text-sm h-9"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={() => onSubmit(form.getValues())}
                      disabled={isSubmitting || isLoadingCashRegister || !isCashRegisterOpen}
                      size="sm"
                      className="text-sm h-9"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Registrar Pagamento"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}