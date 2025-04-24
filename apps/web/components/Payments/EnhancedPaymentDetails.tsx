import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ShoppingBag,
  User,
  DollarSign,
  FileText,
  Building,
  Phone,
  Mail,
  Loader2,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { api } from "@/app/services/authService";
import type { Order } from "@/app/types/order";
import type { IPayment } from "@/app/types/payment";
import type { User as UserType } from "@/app/types/user";
import type { LegacyClient } from "@/app/types/legacy-client";

interface EnhancedPaymentDetailsProps {
  payment: IPayment | null;
  customer: UserType | null;
  legacyClient: LegacyClient | null;
  translatePaymentType: (type: string) => string;
  translatePaymentMethod: (method: string) => string;
  translatePaymentStatus: (status: string) => string;
  getPaymentStatusClass: (status: string) => string;
  navigateToOrder?: (id: string) => void;
}

export function EnhancedPaymentDetails({
  payment,
  customer,
  legacyClient,
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentStatusClass,
  navigateToOrder
}: EnhancedPaymentDetailsProps) {
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!payment?.orderId) return;

      setIsLoadingOrder(true);
      try {
        const response = await api.get(`/api/orders/${payment.orderId}`);
        setOrderDetails(response.data);
      } catch (error) {
        console.error("Erro ao buscar detalhes do pedido:", error);
        setOrderError("Não foi possível carregar os detalhes do pedido");
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchOrderDetails();
  }, [payment]);

  if (!payment) return null;

  return (
    <div className="space-y-6">
      {/* Detalhes do Cliente */}
      {(customer || legacyClient) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {customer ? "Detalhes do Cliente" : "Detalhes do Cliente Legado"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="font-medium">{customer?.name || legacyClient?.name}</div>
                {customer?.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.email}
                  </div>
                )}
                {(customer?.phone || legacyClient?.phone) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {customer?.phone || legacyClient?.phone}
                  </div>
                )}
                {(customer?.cpf || legacyClient?.cpf) && (
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">CPF:</span> {customer?.cpf || legacyClient?.cpf}
                  </div>
                )}
              </div>

              {/* Endereço, se disponível */}
              {(customer?.address || (legacyClient?.address && Object.keys(legacyClient.address).length > 0)) && (
                <div className="space-y-2">
                  <h3 className="font-medium">Endereço</h3>
                  <div className="text-sm text-gray-600">
                    {customer?.address || 
                     (legacyClient?.address && `${legacyClient.address.street}, ${legacyClient.address.number}${legacyClient.address.complement ? ` - ${legacyClient.address.complement}` : ''}, ${legacyClient.address.neighborhood}, ${legacyClient.address.city}/${legacyClient.address.state}`)}
                  </div>
                </div>
              )}

              {/* Informações adicionais para clientes legados */}
              {legacyClient && legacyClient.totalDebt > 0 && (
                <div className="col-span-2 p-3 bg-red-50 rounded-md border border-red-100 text-red-700 mt-2">
                  <h3 className="font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Débito Pendente
                  </h3>
                  <p className="text-sm mt-1">
                    Este cliente possui um débito total de {formatCurrency(legacyClient.totalDebt)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes do Pedido Associado */}
      {payment.orderId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Pedido Associado
            </CardTitle>
            {orderDetails && (
              <CardDescription>
                {orderDetails.serviceOrder 
                  ? `O.S. ${orderDetails.serviceOrder}` 
                  : `Pedido #${payment.orderId.substring(0, 8)}`}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingOrder ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Carregando detalhes do pedido...</span>
              </div>
            ) : orderError ? (
              <div className="p-3 bg-red-50 rounded-md text-red-600 text-sm border border-red-200">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                {orderError}
              </div>
            ) : orderDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Status do Pedido</h3>
                    <Badge className={
                      orderDetails.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      orderDetails.status === "in_production" ? "bg-blue-100 text-blue-800" :
                      orderDetails.status === "ready" ? "bg-green-100 text-green-800" :
                      orderDetails.status === "delivered" ? "bg-purple-100 text-purple-800" :
                      "bg-red-100 text-red-800"
                    }>
                      {orderDetails.status === "pending" ? "Pendente" :
                       orderDetails.status === "in_production" ? "Em Produção" :
                       orderDetails.status === "ready" ? "Pronto" :
                       orderDetails.status === "delivered" ? "Entregue" :
                       "Cancelado"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Status de Pagamento</h3>
                    <Badge className={
                      orderDetails.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                      orderDetails.paymentStatus === "partially_paid" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }>
                      {orderDetails.paymentStatus === "paid" ? "Pago" :
                       orderDetails.paymentStatus === "partially_paid" ? "Parcialmente Pago" :
                       "Pendente"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Data do Pedido</h3>
                    <p className="text-sm">{formatDate(orderDetails.orderDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Data de Entrega</h3>
                    <p className="text-sm">{formatDate(orderDetails.deliveryDate)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <h3 className="text-sm font-medium mb-2">Produtos</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Array.isArray(orderDetails.products) ? (
                      orderDetails.products.map((product, idx) => (
                        <div key={product._id || idx} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                          <span>{product.name}</span>
                          <span className="font-medium">{formatCurrency(product.sellPrice || 0)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm p-2 bg-gray-50 rounded">
                        Informações de produto não disponíveis
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(orderDetails.totalPrice || 0)}</span>
                  </div>
                  {(orderDetails.discount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto:</span>
                      <span className="text-red-600">-{formatCurrency(orderDetails.discount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium pt-1 border-t">
                    <span>Total:</span>
                    <span className="text-green-700">{formatCurrency(orderDetails.finalPrice || orderDetails.totalPrice || 0)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => navigateToOrder && navigateToOrder(orderDetails._id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Detalhes Completos
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Não foi possível carregar informações do pedido
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detalhes do Pagamento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Detalhes do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor:</span>
                <span className={payment.type === "expense" ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Tipo:</span>
                <Badge className={
                  payment.type === "sale" ? "bg-green-100 text-green-800" :
                  payment.type === "debt_payment" ? "bg-blue-100 text-blue-800" :
                  "bg-red-100 text-red-800"
                }>
                  {translatePaymentType(payment.type)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Método:</span>
                <span>{translatePaymentMethod(payment.paymentMethod)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Data:</span>
                <span>{formatDate(payment.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <Badge className={getPaymentStatusClass(payment.status)}>
                  {translatePaymentStatus(payment.status)}
                </Badge>
              </div>
            </div>

            {/* Detalhes de Parcelamento ou Cheque */}
            <div>
              {payment.installments && payment.installments.total > 1 && (
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-3">
                  <h3 className="font-medium text-blue-800 mb-2">Detalhes do Parcelamento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Parcela Atual:</span>
                      <span>{payment.installments.current} de {payment.installments.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Valor da Parcela:</span>
                      <span>{formatCurrency(payment.installments.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Valor Total:</span>
                      <span>{formatCurrency(payment.installments.value * payment.installments.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhes de Cheque */}
              {payment.paymentMethod === "check" && payment.check && (
                <div className="bg-gray-50 border rounded-md p-3">
                  <h3 className="font-medium mb-2">Detalhes do Cheque</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Banco:</span>
                        <p>{payment.check.bank}</p>
                      </div>
                      <div>
                        <span className="font-medium">Número:</span>
                        <p>{payment.check.checkNumber}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Data do Cheque:</span>
                        <p>{formatDate(payment.check.checkDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Data de Apresentação:</span>
                        <p>{payment.check.presentationDate ? formatDate(payment.check.presentationDate) : "Imediata"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Titular:</span>
                      <p>{payment.check.accountHolder}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Agência:</span>
                        <p>{payment.check.branch}</p>
                      </div>
                      <div>
                        <span className="font-medium">Conta:</span>
                        <p>{payment.check.accountNumber}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Status de Compensação:</span>
                      <Badge className={
                        payment.check.compensationStatus === "compensated" ? "bg-green-100 text-green-800" :
                        payment.check.compensationStatus === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }>
                        {payment.check.compensationStatus === "compensated" ? "Compensado" :
                        payment.check.compensationStatus === "rejected" ? "Rejeitado" :
                        "Pendente"}
                      </Badge>
                      
                      {payment.check.compensationStatus === "rejected" && payment.check.rejectionReason && (
                        <div className="mt-1">
                          <span className="font-medium">Motivo da rejeição:</span>
                          <p className="text-red-600">{payment.check.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descrição do Pagamento */}
          {payment.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">Descrição</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  {payment.description}
                </div>
              </div>
            </>
          )}

          {/* Categorias de Despesa */}
          {payment.type === "expense" && payment.category && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">Categoria da Despesa</h3>
                <Badge variant="outline" className="text-base py-1 px-3">
                  {payment.category === "aluguel" ? "Aluguel" :
                   payment.category === "utilidades" ? "Água/Luz/Internet" :
                   payment.category === "fornecedores" ? "Fornecedores" :
                   payment.category === "salarios" ? "Salários" :
                   payment.category === "manutencao" ? "Manutenção" :
                   payment.category === "marketing" ? "Marketing" :
                   payment.category === "impostos" ? "Impostos" :
                   payment.category === "outros" ? "Outros" :
                   payment.category}
                </Badge>
              </div>
            </>
          )}

          {/* Informações de Auditoria */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-medium">Informações de Registro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>Criado em: {formatDate(payment.createdAt || payment.date)}</span>
              </div>
              {payment.updatedAt && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Atualizado em: {formatDate(payment.updatedAt)}</span>
                </div>
              )}
              {payment.createdBy && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Registrado por: {payment.createdBy}</span>
                </div>
              )}
              {payment.cashRegisterId && (
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Caixa: #{payment.cashRegisterId.substring(0, 8)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}