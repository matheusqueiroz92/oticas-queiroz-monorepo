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
  AlertTriangle,
  PencilIcon,
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import type { Order } from "@/app/types/order";
import OrderReceiptPrinter from "./OrderReceiptPrint";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  
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
      <Badge className={statusInfo.className} style={{ pointerEvents: 'none' }} >
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDioptriaDisplay = (value: string | null | undefined): string => {
    if (!value || value === "" || value === "0" || value === "+0" || value === "-0") {
      return "0.00"; // Ou outro valor de exibição padrão
    }
    
    // Formatar valor para exibição
    const numValue = parseFloat(value);
    
    // Formata com sinal e 2 casas decimais
    return numValue > 0 
      ? `+${numValue.toFixed(2)}` 
      : numValue.toFixed(2);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onGoBack} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Detalhes do Pedido</h1>
        </div>
      </div>

      <Card className="shadow-md overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Pedido #{order._id.substring(0, 8)}
              </CardTitle>
              <CardDescription className="text-sm">
                Criado em {formatDate(order.createdAt)} • Nº OS: {order.serviceOrder || 'N/A'}
              </CardDescription>
            </div>
            <div className="badge-container">
              <StatusBadge status={order.status} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 card-content">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full bg-gray-50 border-b p-0 rounded-none h-12 tabs-list">
              <TabsTrigger value="details" className="text-sm flex items-center gap-1 rounded-none h-12 border-b-2 border-transparent data-[state=active]:border-primary">
                <ShoppingBag className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
              {hasPrescriptionData && (
                <TabsTrigger value="prescription" className="text-sm flex items-center gap-1 rounded-none h-12 border-b-2 border-transparent data-[state=active]:border-primary">
                  <FileText className="h-4 w-4" />
                  Receita
                </TabsTrigger>
              )}
              <TabsTrigger value="laboratory" className="text-sm flex items-center gap-1 rounded-none h-12 border-b-2 border-transparent data-[state=active]:border-primary">
                <Beaker className="h-4 w-4" />
                Laboratório
              </TabsTrigger>
            </TabsList>
            
            {/* Conteúdo da aba de detalhes */}
            <TabsContent value="details" className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Informações Cliente e Vendedor */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Cliente */}
                    <Card className="shadow-md border">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Cliente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-base">
                            {client ? client.name : "Cliente não encontrado"}
                          </p>
                          {client && (
                            <>
                              <p className="text-gray-600 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" /> 
                                {client.email}
                              </p>
                              {client.phone && (
                                <p className="text-gray-600 flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" /> 
                                  {client.phone}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vendedor */}
                    <Card className="shadow-md border">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Vendedor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-base">
                            {employee ? employee.name : "Vendedor não encontrado"}
                          </p>
                          {employee && (
                            <p className="text-gray-600 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" /> 
                              {employee.email}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Produtos */}
                  <Card className="shadow-md border">
                    <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        Produtos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-hidden border-t">
                        <table className="w-full">
                          <thead className="bg-gray-50 text-sm">
                            <tr className="border-b">
                              <th className="text-left font-medium p-3">Produto</th>
                              <th className="text-left font-medium p-3">Tipo</th>
                              <th className="text-right font-medium p-3">Preço</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {products.map((product: any, index: number) => (
                              <tr key={product._id || index} className="border-b">
                                <td className="p-3 font-medium">{product.name}</td>
                                <td className="p-3 text-gray-600">{getProductTypeLabel(product.productType)}</td>
                                <td className="p-3 text-right">{formatCurrency(product.sellPrice || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="p-4 bg-gray-50">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>{formatCurrency(order.totalPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600">Desconto:</span>
                            <span className="text-red-600">-{formatCurrency(order.discount || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center font-medium text-base mt-3 pt-3 border-t">
                            <span>Total:</span>
                            <span className="text-green-700 text-lg">{formatCurrency(order.finalPrice || order.totalPrice)}</span>
                          </div>
                        </div>

                        {order.observations && (
                          <div className="p-4 border-t">
                            <p className="text-sm font-medium mb-2">Observações:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {order.observations}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status */}
                  <Card className="shadow-md border">
                    <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        Status do Pedido
                      </CardTitle>
                      <OrderStatusUpdate
                        order={order}
                        onUpdateSuccess={onRefresh}
                      />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="text-sm space-y-3">
                        <div className="flex items-center gap-3">
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
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-700 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span>
                              Para mudar o status para "Em Produção", associe um laboratório a este pedido.
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <span>Data do pedido:</span>
                          </div>
                          <span className="font-medium">{formatDate(order.orderDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <span>Data de entrega:</span>
                          </div>
                          <span className="font-medium">{formatDate(order.deliveryDate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna da direita - Resumo do pagamento */}
                <div className="space-y-6">
                  <Card className="shadow-md border">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status do Pagamento:</span>
                          <Badge
                            className={getPaymentStatusBadge(order.paymentStatus).className}
                            style={{ pointerEvents: 'none' }} 
                          >
                            {getPaymentStatusBadge(order.paymentStatus).label}
                          </Badge>
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
                        
                        <div className="pt-3 mt-3 border-t">
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
                          
                          <div className="flex justify-between items-center font-medium text-base mt-3 pt-3 border-t">
                            <span>Total:</span>
                            <span className="text-green-700 text-lg">{formatCurrency(order.finalPrice || order.totalPrice || 0)}</span>
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
              <TabsContent value="prescription" className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-xl flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Receita Médica
                  </h3>
                </div>
                <div className="bg-gray-50 p-5 rounded-md border shadow-sm">
                  <div className="space-y-5">
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
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 text-sm shadow-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-3 px-4 text-left">Olho</th>
                            <th className="py-3 px-4 text-center">Esf.</th>
                            <th className="py-3 px-4 text-center">Cil.</th>
                            <th className="py-3 px-4 text-center">Eixo</th>
                            <th className="py-3 px-4 text-center">DP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.prescriptionData?.leftEye && (
                            <tr className="border-t border-gray-200">
                              <td className="py-3 px-4 font-medium">
                                Esquerdo
                              </td>
                              <td className="py-3 px-4 text-center">
                                {formatDioptriaDisplay(order.prescriptionData.leftEye.sph?.toString()) || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {formatDioptriaDisplay(order.prescriptionData.leftEye.cyl?.toString()) || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {order.prescriptionData.leftEye.axis || "N/A"}°
                              </td>
                              <td className="py-3 px-4 text-center">
                                {order.prescriptionData.leftEye.pd || "N/A"}
                              </td>
                            </tr>
                          )}

                          {order.prescriptionData?.rightEye && (
                            <tr className="border-t border-gray-200">
                              <td className="py-3 px-4 font-medium">
                                Direito
                              </td>
                              <td className="py-3 px-4 text-center">
                                {formatDioptriaDisplay(order.prescriptionData.rightEye.sph?.toString()) || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {formatDioptriaDisplay(order.prescriptionData.rightEye.cyl?.toString()) || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {order.prescriptionData.rightEye.axis || "N/A"}°
                              </td>
                              <td className="py-3 px-4 text-center">
                                {order.prescriptionData.rightEye.pd || "N/A"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100">
                            <th className="py-3 px-4 text-left" colSpan={5}>
                              Informações adicionais
                            </th>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium">D.N.P.</td>
                            <td className="py-3 px-4 text-center" colSpan={4}>
                              {order.prescriptionData?.nd || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium">C.O.</td>
                            <td className="py-3 px-4 text-center" colSpan={4}>
                              {order.prescriptionData?.oc || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium">Adição</td>
                            <td className="py-3 px-4 text-center" colSpan={4}>
                              {order.prescriptionData?.addition || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium">Ponte</td>
                            <td className="py-3 px-4 text-center" colSpan={4}>
                              {order.prescriptionData?.bridge || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium">Aro</td>
                            <td className="py-3 px-4 text-center" colSpan={4}>
                              {order.prescriptionData?.rim || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium">AV</td>
                            <td className="py-3 px-4 text-center" colSpan={4}>
                              {order.prescriptionData?.vh || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium">AM</td>
                            <td className="py-3 px-4 text-center" colSpan={4}>
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
            <TabsContent value="laboratory" className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-xl flex items-center">
                  <Beaker className="h-5 w-5 mr-2" />
                  Laboratório Associado
                </h3>
                <div>
                <OrderLaboratoryUpdate
                  order={order}
                  onUpdateSuccess={onRefresh}
                />
                </div>
              </div>
              
              {laboratoryInfo ? (
                <div className="p-4 rounded-md">
                  <Card className="shadow-md border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-600">Nome:</p>
                            <p className="font-medium flex items-center gap-2 text-base">
                              <Building className="h-4 w-4 text-gray-400" />
                              {laboratoryInfo.name}
                            </p>
                          </div>
                          
                          {laboratoryInfo.contactName && (
                            <div>
                              <p className="text-gray-600">Contato:</p>
                              <p className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                {laboratoryInfo.contactName}
                              </p>
                            </div>
                          )}
                          
                          {laboratoryInfo.phone && (
                            <div>
                              <p className="text-gray-600">Telefone:</p>
                              <p className="font-medium flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {laboratoryInfo.phone}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {laboratoryInfo.email && (
                            <div>
                              <p className="text-gray-600">Email:</p>
                              <p className="font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {laboratoryInfo.email}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-gray-600">Status:</p>
                            <div>
                              <Badge
                                variant={laboratoryInfo.isActive ? "outline" : "destructive"}
                                className="mt-1 text-sm py-0 px-2 h-6"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {laboratoryInfo.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-gray-600">Data de entrega prevista:</p>
                            <p className="font-medium flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              {formatDate(order.deliveryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="bg-gray-50 p-5 rounded-md border shadow-sm text-sm">
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Nenhum laboratório associado a este pedido.
                    </p>
                    <p className="mt-2">
                      Use o botão "Associar Laboratório" para vincular um laboratório a este pedido.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t p-4 flex justify-between">
          <Button variant="outline" onClick={onGoBack} className="text-sm gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar para Pedidos
          </Button>

          <Button 
            variant="outline" 
            onClick={() => router.push(`/orders/${order._id}/edit`)} 
            className="text-sm gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </Button>
          
          <div className="flex gap-3">
            <OrderDetailsPDF
              order={order}
              clientName={client ? client.name : "Cliente não encontrado"}
              employeeName={employee ? employee.name : "Vendedor não encontrado"}
            />
            
            {/* Substituir o botão de impressão anterior por este componente */}
            <OrderReceiptPrinter
              order={order}
              client={client}
              employee={employee}
              getStatusBadge={getStatusBadge}
            />
            
            <Button 
              variant="outline" 
              onClick={onRefresh} 
              className="text-sm gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}