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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../services/authService";
import OrderDetailsPDF from "@/components/Orders/exports/OrderDetailsPdf";
import OrderLaboratoryUpdate from "@/components/Orders/OrderLaboratoryUpdate";
import OrderStatusUpdate from "@/components/Orders/OrderStatusUpdate";
import { Beaker, FileText, User, CreditCard, Truck, ShoppingBag, ChevronLeft } from "lucide-react";
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
  const { translateOrderStatus, fetchOrderById } = useOrders();

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
  }, [refetch]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error instanceof Error ? error.message : error || "Pedido não encontrado ou ocorreu um erro ao carregar os dados."}
      </div>
    );
  }

  // Verificar se há dados de receita
  const hasPrescriptionData = order.prescriptionData && 
    order.prescriptionData.leftEye && 
    order.prescriptionData.rightEye;

  // Determinar se o pedido tem produtos múltiplos
  const hasMultipleProducts = Array.isArray(order.product) && order.product.length > 0;
  
  // Normalizar produtos para garantir que sempre seja um array
  const products = hasMultipleProducts 
    ? order.product 
    : (order.product ? [order.product] : []);

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
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {formatDate(order.createdAt)}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Pedido #{order._id.substring(0, 8)}</CardTitle>
            <StatusBadge status={order.status} />
          </div>
          <CardDescription>
            Criado em {formatDate(order.createdAt)}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Detalhes
              </TabsTrigger>
              {hasPrescriptionData && (
                <TabsTrigger value="prescription">
                  <FileText className="h-4 w-4 mr-2" />
                  Receita
                </TabsTrigger>
              )}
              <TabsTrigger value="laboratory">
                <Beaker className="h-4 w-4 mr-2" />
                Laboratório
              </TabsTrigger>
            </TabsList>
            
            {/* Conteúdo da aba de detalhes */}
            <TabsContent value="details" className="space-y-6">
              {/* Informações principais */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Coluna Cliente */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informações do Cliente
                  </h3>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-semibold">Nome:</span>{" "}
                      {client ? client.name : "Cliente não encontrado"}
                    </p>
                    {client && (
                      <>
                        <p className="text-sm">
                          <span className="font-semibold">Email:</span> {client.email}
                        </p>
                        {client.phone && (
                          <p className="text-sm">
                            <span className="font-semibold">Telefone:</span> {client.phone}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Coluna Vendedor */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informações do Vendedor
                  </h3>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-semibold">Nome:</span>{" "}
                      {employee ? employee.name : "Vendedor não encontrado"}
                    </p>
                    {employee && (
                      <p className="text-sm">
                        <span className="font-semibold">Email:</span>{" "}
                        {employee.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Detalhes dos Produtos */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Detalhes dos Produtos
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm font-semibold border-b">
                          <th className="pb-2">Produto</th>
                          <th className="pb-2">Tipo</th>
                          <th className="pb-2 text-right">Preço</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product: any, index: number) => (
                          <tr key={product._id || index} className="border-b">
                            <td className="py-2">{product.name}</td>
                            <td className="py-2">{getProductTypeLabel(product.productType)}</td>
                            <td className="py-2 text-right">{formatCurrency(product.sellPrice || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold">
                          <td colSpan={2} className="pt-3 text-right">Total:</td>
                          <td className="pt-3 text-right">{formatCurrency(order.totalPrice)}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="pt-1 text-right">Desconto:</td>
                          <td className="pt-1 text-right text-red-600">-{formatCurrency(order.discount || 0)}</td>
                        </tr>
                        <tr className="font-bold text-lg">
                          <td colSpan={2} className="pt-2 text-right">Preço Final:</td>
                          <td className="pt-2 text-right text-green-700">{formatCurrency(order.finalPrice || order.totalPrice)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {order.observations && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-sm font-semibold">Observações:</p>
                      <p className="text-sm bg-white p-2 rounded mt-1">
                        {order.observations}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Status do Pedido */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Status do Pedido
                  </h3>
                  {/* Componente para atualizar o status */}
                  <OrderStatusUpdate
                    order={order}
                    onUpdateSuccess={handleRefreshData}
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <Badge className={getStatusBadge(order.status).className}>
                      {translateOrderStatus(order.status)}
                    </Badge>
                    <div className="ml-4 text-sm text-muted-foreground">
                      {order.status === "pending" &&
                        "O pedido está aguardando processamento"}
                      {order.status === "in_production" &&
                        "O pedido está sendo produzido"}
                      {order.status === "ready" &&
                        "O pedido está pronto para retirada"}
                      {order.status === "delivered" &&
                        "O pedido foi entregue ao cliente"}
                      {order.status === "cancelled" &&
                        "O pedido foi cancelado"}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informações de Pagamento */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Informações de Pagamento
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">Método de Pagamento:</span>{" "}
                        {getPaymentMethodText(order.paymentMethod)}
                      </p>
                      {(order.paymentEntry || 0) > 0 && (
                        <p className="text-sm">
                          <span className="font-semibold">Entrada:</span>{" "}
                          {formatCurrency(order.paymentEntry || 0)}
                        </p>
                      )}
                      {(order.installments || 0) > 0 && (
                        <p className="text-sm">
                          <span className="font-semibold">Parcelas:</span>{" "}
                          {order.installments}x
                        </p>
                      )}
                    </div>
                    <div className="md:text-right">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Total:</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(order.totalPrice || 0)}
                        </p>
                        {(order.discount || 0) > 0 && (
                          <>
                            <p className="text-sm font-semibold">Desconto:</p>
                            <p className="text-sm text-red-600">
                              -{formatCurrency(order.discount || 0)}
                            </p>
                          </>
                        )}
                        <p className="text-sm font-semibold mt-2">Preço Final:</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(order.finalPrice || order.totalPrice || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Aba de Receita Médica */}
            {hasPrescriptionData && (
              <TabsContent value="prescription" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" /> Receita Médica
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Informações da Receita</h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-semibold">Médico:</span>{" "}
                            {order.prescriptionData?.doctorName || "Não informado"}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Clínica:</span>{" "}
                            {order.prescriptionData?.clinicName || "Não informada"}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Data da Consulta:</span>{" "}
                            {formatDate(order.prescriptionData?.appointmentDate) || "Não informada"}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Valores Adicionais</h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-semibold">Adição:</span>{" "}
                            {(order.prescriptionData?.addition || 0).toFixed(2)}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">ND:</span>{" "}
                            {(order.prescriptionData?.nd || 0).toFixed(2)}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">OC:</span>{" "}
                            {(order.prescriptionData?.oc || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Olho Esquerdo (OE)</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1">Medida</th>
                              <th className="text-right py-1">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-1">Esférico (sph)</td>
                              <td className="text-right py-1">
                                {(order.prescriptionData?.leftEye.sph || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1">Cilíndrico (cyl)</td>
                              <td className="text-right py-1">
                                {(order.prescriptionData?.leftEye.cyl || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1">Eixo (axis)</td>
                              <td className="text-right py-1">
                                {order.prescriptionData?.leftEye.axis || 0}°
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1">Distância Pupilar (PD)</td>
                              <td className="text-right py-1">
                                {order.prescriptionData?.leftEye.pd || 0} mm
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Olho Direito (OD)</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1">Medida</th>
                              <th className="text-right py-1">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-1">Esférico (sph)</td>
                              <td className="text-right py-1">
                                {(order.prescriptionData?.rightEye.sph || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1">Cilíndrico (cyl)</td>
                              <td className="text-right py-1">
                                {(order.prescriptionData?.rightEye.cyl || 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1">Eixo (axis)</td>
                              <td className="text-right py-1">
                                {order.prescriptionData?.rightEye.axis || 0}°
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1">Distância Pupilar (PD)</td>
                              <td className="text-right py-1">
                                {order.prescriptionData?.rightEye.pd || 0} mm
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Aba de Laboratório */}
            <TabsContent value="laboratory" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg flex items-center">
                    <Beaker className="h-5 w-5 mr-2" /> Laboratório
                  </h3>
                  {/* Componente para atualizar laboratório - independente do tipo de produto */}
                  <OrderLaboratoryUpdate
                    order={order}
                    onUpdateSuccess={handleRefreshData}
                  />
                </div>

                {laboratoryInfo ? (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold">Nome:</span>{" "}
                        {laboratoryInfo.name}
                      </p>
                      {laboratoryInfo.contactName && (
                        <p className="text-sm">
                          <span className="font-semibold">Contato:</span>{" "}
                          {laboratoryInfo.contactName}
                        </p>
                      )}
                      {laboratoryInfo.phone && (
                        <p className="text-sm">
                          <span className="font-semibold">Telefone:</span>{" "}
                          {laboratoryInfo.phone}
                        </p>
                      )}
                      {laboratoryInfo.email && (
                        <p className="text-sm">
                          <span className="font-semibold">Email:</span>{" "}
                          {laboratoryInfo.email}
                        </p>
                      )}
                      <div className="text-sm mt-2">
                        <span className="font-semibold">Status:</span>{" "}
                        <Badge
                          variant={
                            laboratoryInfo.isActive ? "outline" : "destructive"
                          }
                        >
                          {laboratoryInfo.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <div className="mt-4 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          Data de entrega prevista: <span className="font-medium">{formatDate(order.deliveryDate)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Nenhum laboratório associado a este pedido.
                    </p>
                    <p className="text-sm mt-2">
                      Use o botão "Associar Laboratório" para vincular um laboratório a este pedido.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline" onClick={handleGoBack}>
            Voltar para Pedidos
          </Button>
          
          <OrderDetailsPDF
            order={order}
            clientName={client ? client.name : "Cliente não encontrado"}
            employeeName={employee ? employee.name : "Vendedor não encontrado"}
          />
        </CardFooter>
      </Card>
    </div>
  );
}