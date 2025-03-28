"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { api } from "../../../services/authService";
import OrderDetailsPDF from "@/components/Orders/exports/OrderDetailsPdf";
import OrderLaboratoryUpdate from "@/components/Orders/OrderLaboratoryUpdate";
import OrderStatusUpdate from "@/components/Orders/OrderStatusUpdate";
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
  RefreshCw
} from "lucide-react";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { getProductTypeLabel } from "@/app/utils/product-utils";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";

interface Laboratory {
  _id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
}

export default function OrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast } = useToast();
  
  // Usar hook useOrders para aproveitar suas funcionalidades
  const { translateOrderStatus, fetchOrderById, navigateToOrderDetails } = useOrders();

  // Estado para armazenar dados complementares
  const [client, setClient] = useState<User | null>(null);
  const [employee, setEmployee] = useState<User | null>(null);
  const [laboratoryInfo, setLaboratoryInfo] = useState<Laboratory | null>(null);
  
  // Buscar detalhes do pedido
  const { data: order, isLoading, error, refetch } = fetchOrderById(id);

  // Função para buscar detalhes complementares (cliente, funcionário, laboratório)
  const fetchComplementaryDetails = useCallback(async () => {
    if (!order) return;

    try {
      // Processar dados do cliente
      if (typeof order.clientId === "string") {
        try {
          const response = await api.get(`/api/users/${order.clientId}`);
          setClient(response.data);
        } catch (clientError) {
          console.error("Erro ao buscar cliente:", clientError);
        }
      } else if (typeof order.clientId === "object" && order.clientId !== null) {
        setClient(order.clientId);
      }

      // Processar dados do funcionário
      if (typeof order.employeeId === "string") {
        try {
          const response = await api.get(`/api/users/${order.employeeId}`);
          setEmployee(response.data);
        } catch (employeeError) {
          console.error("Erro ao buscar funcionário:", employeeError);
        }
      } else if (typeof order.employeeId === "object" && order.employeeId !== null) {
        setEmployee(order.employeeId);
      }

      // Se o pedido tiver um laboratório associado, buscar seus detalhes
      if (order.laboratoryId) {
        try {
          if (typeof order.laboratoryId === "string") {
            const labResponse = await api.get(`/api/laboratories/${order.laboratoryId}`);
            setLaboratoryInfo(labResponse.data);
          } else if (typeof order.laboratoryId === "object" && order.laboratoryId !== null) {
            setLaboratoryInfo(order.laboratoryId as Laboratory);
          }
        } catch (labError) {
          console.error("Erro ao buscar laboratório:", labError);
        }
      } else {
        setLaboratoryInfo(null);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes complementares:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar detalhes complementares do pedido.",
      });
    }
  }, [order, toast]);

  // Efeito para buscar detalhes complementares quando o pedido for carregado
  useEffect(() => {
    if (order) {
      fetchComplementaryDetails();
    }
  }, [order, fetchComplementaryDetails]);

  // Função para atualizar todos os dados do pedido e detalhes relacionados
  const handleRefreshData = useCallback(() => {
    // Refetch do pedido atual
    refetch();
    toast({
      title: "Atualizado",
      description: "Informações do pedido atualizadas com sucesso."
    });
  }, [refetch, toast]);

  // Função para voltar à página de listagem
  const handleGoBack = () => {
    router.push('/orders');
  };

  // Função para obter as informações de status
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-800",
      },
      in_production: {
        label: "Em Produção",
        className: "bg-blue-100 text-blue-800",
      },
      ready: { 
        label: "Pronto", 
        className: "bg-green-100 text-green-800" 
      },
      delivered: {
        label: "Entregue",
        className: "bg-purple-100 text-purple-800",
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-red-100 text-red-800",
      },
    };

    return statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
  };

  // Função para obter texto do método de pagamento
  const getPaymentMethodText = (method?: string) => {
    if (!method) return "N/A";

    const methodMap: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      installment: "Parcelado",
    };

    return methodMap[method] || method;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-3">
        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
          {error instanceof Error ? error.message : error || "Pedido não encontrado ou ocorreu um erro ao carregar os dados."}
        </div>
      </div>
    );
  }

  // Verificar se há dados de receita
  const hasPrescriptionData = order.prescriptionData && 
    order.prescriptionData.leftEye && 
    order.prescriptionData.rightEye;

  // Determinar se o pedido tem produtos múltiplos
  const hasMultipleProducts = Array.isArray(order.products) && order.products.length > 0;
  
  // Normalizar produtos para garantir que sempre seja um array
  const products = hasMultipleProducts 
    ? order.products 
    : (order.products ? [order.products] : []);

  // Componente para exibir badge de status
  const StatusBadge = ({ status }: { status: string }) => {
    const statusInfo = getStatusBadge(status || "");
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="h-8 w-8 p-0">
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
                        onUpdateSuccess={handleRefreshData}
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
                  
                  <div className="flex gap-2">
                    <OrderDetailsPDF
                      order={order}
                      clientName={client ? client.name : "Cliente não encontrado"}
                      employeeName={employee ? employee.name : "Vendedor não encontrado"}
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs h-8"
                      onClick={handleRefreshData}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Aba de Receita Médica */}
            {hasPrescriptionData && (
              <TabsContent value="prescription" className="p-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="shadow-none border">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        Informações da Receita
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-600">Médico:</p>
                            <p className="font-medium">{order.prescriptionData?.doctorName || "Não informado"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Clínica:</p>
                            <p className="font-medium">{order.prescriptionData?.clinicName || "Não informada"}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-600">Data da Consulta:</p>
                            <p className="font-medium">{formatDate(order.prescriptionData?.appointmentDate) || "Não informada"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Adição:</p>
                            <p className="font-medium">{(order.prescriptionData?.addition || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                        <div>
                          <p className="text-gray-600">ND:</p>
                          <p className="font-medium">{(order.prescriptionData?.nd || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">OC:</p>
                          <p className="font-medium">{(order.prescriptionData?.oc || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Olho Esquerdo */}
                    <Card className="shadow-none border">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm">Olho Esquerdo (OE)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <table className="w-full text-xs">
                          <tbody>
                            <tr className="border-b">
                              <td className="py-1.5 text-gray-600">Esférico (sph)</td>
                              <td className="py-1.5 text-right font-medium">
                                {(order.prescriptionData?.leftEye.sph || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1.5 text-gray-600">Cilíndrico (cyl)</td>
                              <td className="py-1.5 text-right font-medium">
                                {(order.prescriptionData?.leftEye.cyl || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1.5 text-gray-600">Eixo (axis)</td>
                              <td className="py-1.5 text-right font-medium">
                                {order.prescriptionData?.leftEye.axis || 0}°
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5 text-gray-600">Dist. Pupilar (PD)</td>
                              <td className="py-1.5 text-right font-medium">
                                {order.prescriptionData?.leftEye.pd || 0} mm
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                    
                    {/* Olho Direito */}
                    <Card className="shadow-none border">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm">Olho Direito (OD)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <table className="w-full text-xs">
                          <tbody>
                            <tr className="border-b">
                              <td className="py-1.5 text-gray-600">Esférico (sph)</td>
                              <td className="py-1.5 text-right font-medium">
                                {(order.prescriptionData?.rightEye.sph || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1.5 text-gray-600">Cilíndrico (cyl)</td>
                              <td className="py-1.5 text-right font-medium">
                                {(order.prescriptionData?.rightEye.cyl || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1.5 text-gray-600">Eixo (axis)</td>
                              <td className="py-1.5 text-right font-medium">
                                {order.prescriptionData?.rightEye.axis || 0}°
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5 text-gray-600">Dist. Pupilar (PD)</td>
                              <td className="py-1.5 text-right font-medium">
                                {order.prescriptionData?.rightEye.pd || 0} mm
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Aba de Laboratório */}
            <TabsContent value="laboratory" className="p-3">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-medium">Laboratório Associado</h3>
                <OrderLaboratoryUpdate
                  order={order}
                  onUpdateSuccess={handleRefreshData}
                />
              </div>
              
              {laboratoryInfo ? (
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
                              className="mt-1 text-xs"
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
              ) : (
                <div className="bg-gray-50 p-4 rounded-md border text-sm">
                  <p className="text-gray-600 text-xs">
                    Nenhum laboratório associado a este pedido.
                  </p>
                  <p className="text-xs mt-1">
                    Use o botão "Associar Laboratório" para vincular um laboratório a este pedido.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t p-3 flex justify-between">
          <Button variant="outline" size="sm" onClick={handleGoBack} className="text-xs h-8">
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
              onClick={handleRefreshData} 
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