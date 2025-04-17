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
  CardFooter,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  DollarSign,
  Loader2,
  User,
  Store,
  ClipboardCheck,
} from "lucide-react";
import ClientSearch from "@/components/Orders/ClientSearch";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import type { Order } from "@/app/types/order";
import type { User as UserType } from "@/app/types/user";
import type { LegacyClient } from "@/app/types/legacy-client";

type PaymentFormValues = any;

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
  legacyClientSearch: string;
  selectedEntityType: "customer" | "legacyClient" | null;
  showInstallments: boolean;
  showCheckFields: boolean;
  onShowCheckFields: (value: boolean) => void;
  onCustomerSearchChange: (value: string) => void;
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
  legacyClients,
  isLoadingLegacyClients,
  clientOrders,
  isLoadingOrders,
  legacyClientSearch,
  selectedEntityType,
  showInstallments,
  showCheckFields,
  onShowCheckFields,
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
  const selectedCustomerId = watch("customerId");
  const selectedOrderId = watch("orderId");
  
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
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {showCheckFields && (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50 col-span-2">
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
            
            <div className="grid grid-cols-1 gap-4">
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
      </div>

      {showInstallments && (
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

      {/* Substituído select de caixa por visualização de caixa atual */}
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

      {/* Status de pagamento removido do step 1 */}
    </div>
  );
  
  const renderStep2 = () => {
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

          {/* Status do pagamento como badge para despesas */}
          <div className="space-y-2">
            <FormLabel>Status do Pagamento</FormLabel>
            <div>
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                Concluído
              </Badge>
              <input 
                type="hidden" 
                name="status" 
                value="completed" 
                onChange={() => setValue("status", "completed")}
              />
            </div>
          </div>

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
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium">Informações Relacionadas</h3>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-medium">
              Selecione o tipo de cliente:
            </h4>
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

              {watch("legacyClientId") && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-800">
                    Cliente legado selecionado
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {legacyClients.find(
                      (c: LegacyClient) => c._id === watch("legacyClientId")
                    )?.name || "Cliente legado"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mostrar status de pagamento como badge quando um cliente é selecionado */}
          {(selectedCustomerId || watch("legacyClientId")) && (
            <div className="space-y-2 mt-4">
              <FormLabel>Status do Pagamento</FormLabel>
              <div>
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                  {selectedOrderId && getOrderPaymentStatus() ? 
                    getOrderPaymentStatus()?.label : 
                    "Concluído"}
                </Badge>
                <input 
                  type="hidden" 
                  name="status" 
                  value="completed" 
                  onChange={() => setValue("status", "completed")}
                />
              </div>
            </div>
          )}

          {(selectedCustomerId || watch("legacyClientId")) &&
            paymentType === "sale" && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-medium">
                    Pedidos do Cliente
                  </h3>
                  <Separator className="flex-1" />
                </div>

                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clientOrders && Array.isArray(clientOrders) ? (
                  <div 
                    key={`orders-list-${clientOrders.length}-${selectedCustomerId}`} 
                    className="border rounded-md p-4 max-h-80 overflow-y-auto"
                  >
                    <ul className="space-y-3">
                      {clientOrders.map((order) => {
                        // Adicione um log para cada pedido aqui para depuração
                        console.log("Renderizando pedido:", order);
                        
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
    );
  };
  
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição ou observações sobre este pagamento..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Adicione informações adicionais sobre este pagamento, se
                necessário
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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

            {watch("customerId") && (
              <>
                <div className="text-blue-700 font-medium">Cliente:</div>
                <div className="text-blue-900">
                  {customers.find(
                    (c: UserType) => c._id === watch("customerId")
                  )?.name || "Cliente selecionado"}
                </div>
              </>
            )}

            {watch("legacyClientId") && (
              <>
                <div className="text-blue-700 font-medium">Cliente Legado:</div>
                <div className="text-blue-900">
                  {legacyClients.find(
                    (c: LegacyClient) => c._id === watch("legacyClientId")
                  )?.name || "Cliente legado selecionado"}
                </div>
              </>
            )}

            {watch("orderId") && (
              <>
                <div className="text-blue-700 font-medium">
                  Pedido vinculado:
                </div>
                <div className="text-blue-900">
                  {clientOrders.find(order => order._id === watch("orderId"))?.serviceOrder 
                    ? `O.S. #${clientOrders.find(order => order._id === watch("orderId"))?.serviceOrder}` 
                    : `#${watch("orderId")?.substring(0, 8) ?? ""}`}
                </div>
                {watch("orderId") && (
                  <div className="text-blue-700 font-medium mt-2">
                    Valor do pedido:
                  </div>
                )}
                {watch("orderId") && (
                  <div className="text-blue-900">
                    {formatCurrency(clientOrders.find(order => order._id === watch("orderId"))?.finalPrice || 0)}
                  </div>
                )}
                {watch("orderId") && (
                  <div className="text-blue-700 font-medium mt-2">
                    Status de pagamento:
                  </div>
                )}
                {watch("orderId") && (
                  <div className="text-blue-900 flex items-center">
                    <Badge className={`mr-2 ${getOrderPaymentStatus()?.className || "bg-gray-100 text-gray-800"}`}>
                      {getOrderPaymentStatus()?.label || "Pendente"}
                    </Badge>
                  </div>
                )}
              </>
            )}

            {watch("type") === "expense" && watch("category") && (
              <>
                <div className="text-blue-700 font-medium">Categoria:</div>
                <div className="text-blue-900">{watch("category")}</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Função para determinar qual conteúdo renderizar com base no passo atual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };
  
  // Função para verificar se o botão próximo deve estar desabilitado
  const isNextButtonDisabled = () => {
    if (currentStep === 1) {
      // Verificar campos obrigatórios do Step 1
      const amount = watch("amount");
      const paymentDate = watch("paymentDate");
      const cashRegisterId = watch("cashRegisterId");
      
      return !amount || amount <= 0 || !paymentDate || !cashRegisterId || !isCashRegisterOpen;
    }
    
    if (currentStep === 2) {
      // Verificar campos obrigatórios do Step 2
      const type = watch("type");
      
      if (type === "expense") {
        // Para despesas, não precisamos de cliente ou pedido
        return false;
      } else {
        // Para vendas e pagamentos de débito, precisamos de um cliente
        const hasCustomer = !!watch("customerId") || !!watch("legacyClientId");
        
        // Para vendas, idealmente devemos ter um pedido selecionado
        if (type === "sale") {
          return !hasCustomer;
        }
        
        return !hasCustomer;
      }
    }
    
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Novo Pagamento</h1>
      </div>

      {!isCashRegisterOpen && !isLoadingCashRegister && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h3 className="text-lg font-medium">Nenhum caixa disponível</h3>
          <p className="mt-2">
            É necessário abrir um caixa antes de registrar um pagamento.
          </p>
          <Button
            className="mt-4"
            onClick={onCancel}
          >
            Abrir Caixa
          </Button>
        </div>
      )}

      {(isCashRegisterOpen || isLoadingCashRegister) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Informações Básicas"}
              {currentStep === 2 && "Informações Relacionadas"}
              {currentStep === 3 && "Detalhes e Confirmação"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Preencha os detalhes básicos do pagamento"}
              {currentStep === 2 && "Relacione este pagamento a clientes ou pedidos"}
              {currentStep === 3 && "Revise os detalhes e confirme o pagamento"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCashRegister ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form 
                  id="paymentForm" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    
                    if (currentStep === 3) {
                      onSubmit(form.getValues());
                    }
                  }}
                >
                  {renderStepContent()}
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={onPrev}>
                Anterior
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={onNext}
                disabled={isLoadingCashRegister || !isCashRegisterOpen || isNextButtonDisabled()}
              >
                Próximo
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => onSubmit(form.getValues())}
                disabled={
                  isSubmitting || isLoadingCashRegister || !isCashRegisterOpen
                }
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
          </CardFooter>
        </Card>
      )}

      {(isCashRegisterOpen || isLoadingCashRegister) && (
        <div className="flex justify-between items-center py-2">
          <div className="flex space-x-2">
            <div
              className={`h-2 w-12 rounded-full ${
                currentStep >= 1 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-2 w-12 rounded-full ${
                currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-2 w-12 rounded-full ${
                currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          </div>
          <div className="text-sm text-muted-foreground">Passo {currentStep} de 3</div>
        </div>
      )}
    </div>
  );
}