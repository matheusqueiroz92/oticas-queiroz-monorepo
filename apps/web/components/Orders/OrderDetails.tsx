import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderDetailsPDF from "@/components/Orders/exports/OrderDetailsPdf";
import OrderLaboratoryUpdate from "@/components/Orders/OrderLaboratoryUpdate";
import OrderStatusUpdate from "@/components/Orders/OrderStatusUpdate";
import OrderPaymentHistory from "@/components/Orders/OrderPaymentHistory";
import { 
  Beaker, 
  FileText,
  User,
  CreditCard,
  Truck,
  ShoppingBag,
  ChevronLeft,
  Building,
  Phone,
  Mail,
  CalendarDays,
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import type { Order } from "@/app/types/order";
import { formatRefractionValue } from "@/app/utils/formatters";

interface OrderDetailsProps {
  order: Order;
  onGoBack: () => void;
  onRefresh: () => void;
}

export default function OrderDetails({ order, onGoBack, onRefresh }: OrderDetailsProps) {
  const [client, setClient] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [laboratoryInfo, setLaboratoryInfo] = useState<any>(null);
  
  const { toast } = useToast();
  
  const { 
    getStatusBadge,
    getPaymentStatusBadge,
    getPaymentMethodText,
    getProductTypeLabel,
    fetchOrderComplementaryDetails,
    formatCurrency,
    formatDate
  } = useOrders();

  useEffect(() => {
    const fetchDetails = async () => {
      if (order) {
        try {
          const details = await fetchOrderComplementaryDetails(order);
          setClient(details.client);
          setEmployee(details.employee);
          setLaboratoryInfo(details.laboratoryInfo);
        } catch (error) {
          console.error("Erro ao buscar detalhes complementares:", error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Falha ao carregar detalhes complementares do pedido."
          });
        }
      }
    };
    
    fetchDetails();
  }, [order, fetchOrderComplementaryDetails, toast]);

  const hasPrescriptionData = order.prescriptionData && 
    order.prescriptionData.leftEye && 
    order.prescriptionData.rightEye;

  const hasMultipleProducts = Array.isArray(order.products) && order.products.length > 0;

  const products = hasMultipleProducts 
    ? order.products 
    : (order.products ? [order.products] : []);

  const StatusBadge = ({ status }: { status: string }) => {
    const statusInfo = getStatusBadge(status || "");
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onGoBack} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-primary">Detalhes do Pedido</h1>
        </div>
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          {formatDate(order.createdAt)}
        </Badge>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b p-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Pedido #{order._id.substring(0, 8)}
              </CardTitle>
              <CardDescription className="text-xs">
                Criado em {formatDate(order.createdAt)} • OS: {order.serviceOrder || 'N/A'}
              </CardDescription>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full bg-gray-50 border-b p-0 rounded-none h-10">
              <TabsTrigger value="details" className="text-xs flex items-center gap-1 rounded-none h-10 border-b-2 border-transparent data-[state=active]:border-primary">
                <ShoppingBag className="h-3.5 w-3.5" />
                Detalhes
              </TabsTrigger>
              {hasPrescriptionData && (
                <TabsTrigger value="prescription" className="text-xs flex items-center gap-1 rounded-none h-10 border-b-2 border-transparent data-[state=active]:border-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Receita
                </TabsTrigger>
              )}
              <TabsTrigger value="laboratory" className="text-xs flex items-center gap-1 rounded-none h-10 border-b-2 border-transparent data-[state=active]:border-primary">
                <Beaker className="h-3.5 w-3.5" />
                Laboratório
              </TabsTrigger>
            </TabsList>
            
            {/* Conteúdo da aba de detalhes */}
            <TabsContent value="details" className="p-3">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  {/* Informações Cliente e Vendedor */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Cliente */}
                    <Card className="shadow-none border">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-primary" />
                          Cliente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-medium">
                            {client ? client.name : "Cliente não encontrado"}
                          </p>
                          {client && (
                            <>
                              <p className="text-gray-600 flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-400" /> 
                                {client.email}
                              </p>
                              {client.phone && (
                                <p className="text-gray-600 flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-gray-400" /> 
                                  {client.phone}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vendedor */}
                    <Card className="shadow-none border">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-primary" />
                          Vendedor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-medium">
                            {employee ? employee.name : "Vendedor não encontrado"}
                          </p>
                          {employee && (
                            <p className="text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" /> 
                              {employee.email}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Produtos */}
                  <Card className="shadow-none border">
                    <CardHeader className="p-3 pb-2 flex flex-row justify-between items-center">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        Produtos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-hidden border-t">
                        <table className="w-full">
                          <thead className="bg-gray-50 text-xs">
                            <tr className="border-b">
                              <th className="text-left font-medium p-2">Produto</th>
                              <th className="text-left font-medium p-2">Tipo</th>
                              <th className="text-right font-medium p-2">Preço</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs">
                            {products.map((product: any, index: number) => (
                              <tr key={product._id || index} className="border-b">
                                <td className="p-2 font-medium">{product.name}</td>
                                <td className="p-2 text-gray-600">{getProductTypeLabel(product.productType)}</td>
                                <td className="p-2 text-right">{formatCurrency(product.sellPrice || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="p-3 bg-gray-50">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>{formatCurrency(order.totalPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mt-1">
                            <span className="text-gray-600">Desconto:</span>
                            <span className="text-red-600">-{formatCurrency(order.discount || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center font-medium text-sm mt-2 pt-2 border-t">
                            <span>Total:</span>
                            <span className="text-green-700">{formatCurrency(order.finalPrice || order.totalPrice)}</span>
                          </div>
                        </div>

                        {order.observations && (
                          <div className="p-3 border-t">
                            <p className="text-xs font-medium mb-1">Observações:</p>
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {order.observations}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status */}
                  <Card className="shadow-none border">
                    <CardHeader className="p-3 pb-2 flex flex-row justify-between items-center">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        Status do Pedido
                      </CardTitle>
                      <OrderStatusUpdate
                        order={order}
                        onUpdateSuccess={onRefresh}
                      />
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={order.status} />
                          <span className="text-gray-600">
                            {order.status === "pending" && "O pedido está aguardando processamento"}
                            {order.status === "in_production" && "O pedido está sendo produzido"}
                            {order.status === "ready" && "O pedido está pronto para retirada"}
                            {order.status === "delivered" && "O pedido foi entregue ao cliente"}
                            {order.status === "cancelled" && "O pedido foi cancelado"}
                          </span>
                        </div>
                        
                        {order.status === "pending" && !order.laboratoryId && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-700 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                            <span>
                              Para mudar o status para "Em Produção", associe um laboratório a este pedido.
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-gray-600">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                            <span>Data do pedido:</span>
                          </div>
                          <span className="font-medium">{formatDate(order.orderDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-gray-600">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                            <span>Data de entrega:</span>
                          </div>
                          <span className="font-medium">{formatDate(order.deliveryDate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna da direita - Resumo do pagamento */}
                <div className="space-y-4">
                  <Card className="shadow-none border">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                        Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status do Pagamento:</span>
                          <Badge className={getPaymentStatusBadge(order.paymentStatus).className}>{getPaymentStatusBadge(order.paymentStatus).label}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Método:</span>
                          <span className="font-medium">{getPaymentMethodText(order.paymentMethod)}</span>
                        </div>
                        
                        {(order.paymentEntry || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Entrada:</span>
                            <span>{formatCurrency(order.paymentEntry || 0)}</span>
                          </div>
                        )}
                        
                        {(order.installments || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Parcelas:</span>
                            <span>{order.installments}x</span>
                          </div>
                        )}
                        
                        <div className="pt-2 mt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>{formatCurrency(order.totalPrice || 0)}</span>
                          </div>
                          
                          {(order.discount || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Desconto:</span>
                              <span className="text-red-600">-{formatCurrency(order.discount || 0)}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center font-medium text-sm mt-2 pt-2 border-t">
                            <span>Total:</span>
                            <span className="text-green-700">{formatCurrency(order.finalPrice || order.totalPrice || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <OrderPaymentHistory 
                    orderId={order._id}
                    finalPrice={order.finalPrice || order.totalPrice || 0}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Aba de Receita Médica */}
            {hasPrescriptionData && (
              <TabsContent value="prescription">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-lg flex items-center p-4">
                    <FileText className="h-5 w-5 mr-2" />
                    Receita Médica
                  </h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <p className="text-sm">
                        <span className="font-semibold">Médico:</span>{" "}
                        {order.prescriptionData?.doctorName || "N/A"}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Clínica:</span>{" "}
                        {order.prescriptionData?.clinicName || "N/A"}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Data da Consulta:</span>{" "}
                        {formatDate(order.prescriptionData?.appointmentDate)}
                      </p>
                    </div>

                    {/* Tabela de receita */}
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-2 px-3 text-left">Olho</th>
                            <th className="py-2 px-3 text-center">Esf.</th>
                            <th className="py-2 px-3 text-center">Cil.</th>
                            <th className="py-2 px-3 text-center">Eixo</th>
                            <th className="py-2 px-3 text-center">DP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.prescriptionData?.leftEye && (
                            <tr className="border-t border-gray-200">
                              <td className="py-2 px-3 font-medium">
                                Esquerdo
                              </td>
                              <td className="py-2 px-3 text-center">
                                {formatRefractionValue(
                                  order.prescriptionData.leftEye.sph
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {formatRefractionValue(
                                  order.prescriptionData.leftEye.cyl
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {order.prescriptionData.leftEye.axis || "N/A"}°
                              </td>
                              <td className="py-2 px-3 text-center">
                                {order.prescriptionData.leftEye.pd || "N/A"}
                              </td>
                            </tr>
                          )}

                          {order.prescriptionData?.rightEye && (
                            <tr className="border-t border-gray-200">
                              <td className="py-2 px-3 font-medium">
                                Direito
                              </td>
                              <td className="py-2 px-3 text-center">
                                {formatRefractionValue(
                                  order.prescriptionData.rightEye.sph
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {formatRefractionValue(
                                  order.prescriptionData.rightEye.cyl
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {order.prescriptionData.rightEye.axis || "N/A"}°
                              </td>
                              <td className="py-2 px-3 text-center">
                                {order.prescriptionData.rightEye.pd || "N/A"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100">
                            <th className="py-2 px-3 text-left" colSpan={5}>
                              Informações adicionais
                            </th>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">D.N.P.</td>
                            <td className="py-2 px-3 text-center" colSpan={4}>
                              {order.prescriptionData?.nd || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">C.O.</td>
                            <td className="py-2 px-3 text-center" colSpan={4}>
                              {order.prescriptionData?.oc || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">Adição</td>
                            <td className="py-2 px-3 text-center" colSpan={4}>
                              {order.prescriptionData?.addition || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">Ponte</td>
                            <td className="py-2 px-3 text-center" colSpan={4}>
                              {order.prescriptionData?.bridge || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">Aro</td>
                            <td className="py-2 px-3 text-center" colSpan={4}>
                              {order.prescriptionData?.rim || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">AV</td>
                            <td className="py-2 px-3 text-center" colSpan={4}>
                              {order.prescriptionData?.vh || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">AM</td>
                            <td className="py-2 px-3 text-center" colSpan={4}>
                              {order.prescriptionData?.sh || "N/A"}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Aba de Laboratório */}
            <TabsContent value="laboratory">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-lg flex items-center p-4">
                  <Beaker className="h-5 w-5 mr-2" />
                  Laboratório Associado
                </h3>
                <div className="p-4">
                <OrderLaboratoryUpdate
                  order={order}
                  onUpdateSuccess={onRefresh}
                />
                </div>
              </div>
              
              {laboratoryInfo ? (
                <div className="p-4 rounded-md">
                  <Card className="shadow-none border">
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-600">Nome:</p>
                            <p className="font-medium flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-gray-400" />
                              {laboratoryInfo.name}
                            </p>
                          </div>
                          
                          {laboratoryInfo.contactName && (
                            <div>
                              <p className="text-gray-600">Contato:</p>
                              <p className="font-medium flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-gray-400" />
                                {laboratoryInfo.contactName}
                              </p>
                            </div>
                          )}
                          
                          {laboratoryInfo.phone && (
                            <div>
                              <p className="text-gray-600">Telefone:</p>
                              <p className="font-medium flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {laboratoryInfo.phone}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {laboratoryInfo.email && (
                            <div>
                              <p className="text-gray-600">Email:</p>
                              <p className="font-medium flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                {laboratoryInfo.email}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-gray-600">Status:</p>
                            <p>
                              <Badge
                                variant={laboratoryInfo.isActive ? "outline" : "destructive"}
                                className="mt-1 text-xs py-0 px-1 h-5"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {laboratoryInfo.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-600">Data de entrega prevista:</p>
                            <p className="font-medium flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                              {formatDate(order.deliveryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md border text-sm">
                  <div className="space-y-4">
                    <p className="text-gray-600 text-xs">
                      Nenhum laboratório associado a este pedido.
                    </p>
                    <p className="text-xs mt-1">
                      Use o botão "Associar Laboratório" para vincular um laboratório a este pedido.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t p-3 flex justify-between">
          <Button variant="outline" size="sm" onClick={onGoBack} className="text-xs h-8">
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Voltar para Pedidos
          </Button>
          
          <div className="flex gap-2">
            <OrderDetailsPDF
              order={order}
              clientName={client ? client.name : "Cliente não encontrado"}
              employeeName={employee ? employee.name : "Vendedor não encontrado"}
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh} 
              className="text-xs h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Atualizar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}