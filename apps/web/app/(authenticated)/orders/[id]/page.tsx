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
import { Beaker, Calendar, FileText, User, CreditCard, Truck, ShoppingBag, ChevronLeft } from "lucide-react";
import type { Order } from "@/app/types/order";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { getProductTypeLabel } from "@/app/utils/product-utils";

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
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [employee, setEmployee] = useState<User | null>(null);
  const [laboratoryInfo, setLaboratoryInfo] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);

  // Usando useCallback para que possamos referenciar essa função no componente filho
  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/orders/${id}`);
      const orderData = response.data;

      setOrder(orderData);

      // Processar dados do cliente
      try {
        if (typeof orderData.clientId === "string") {
          // Tentativa de extrair dados do cliente de string
          const response = await api.get(`/api/users/${orderData.clientId}`);
          setClient(response.data);
        } else if (typeof orderData.clientId === "object" && orderData.clientId !== null) {
          // Já é um objeto
          setClient(orderData.clientId);
        }
      } catch (error) {
        console.error("Erro ao processar dados do cliente:", error);
      }

      // Processar dados do funcionário
      try {
        if (typeof orderData.employeeId === "string") {
          // Tentativa de buscar dados do funcionário
          const response = await api.get(`/api/users/${orderData.employeeId}`);
          setEmployee(response.data);
        } else if (typeof orderData.employeeId === "object" && orderData.employeeId !== null) {
          // Já é um objeto
          setEmployee(orderData.employeeId);
        }
      } catch (error) {
        console.error("Erro ao processar dados do funcionário:", error);
      }

      // Se o pedido tiver um laboratório associado, buscar seus detalhes
      if (orderData.laboratoryId) {
        try {
          // Verificar o formato do laboratoryId
          if (typeof orderData.laboratoryId === "string") {
            const labResponse = await api.get(`/api/laboratories/${orderData.laboratoryId}`);
            setLaboratoryInfo(labResponse.data);
          } else if (typeof orderData.laboratoryId === "object" && orderData.laboratoryId !== null) {
            // O laboratório já veio como objeto no pedido
            setLaboratoryInfo(orderData.laboratoryId as Laboratory);
          }
        } catch (labError) {
          console.error("Erro ao buscar informações do laboratório:", labError);
          setLaboratoryInfo(null);
        }
      } else {
        setLaboratoryInfo(null);
      }
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id, fetchOrderDetails]);

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Pedido não encontrado ou ocorreu um erro ao carregar os dados.
      </div>
    );
  }

  // Função para obter o badge de status
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
      ready: { label: "Pronto", className: "bg-green-100 text-green-800" },
      delivered: {
        label: "Entregue",
        className: "bg-purple-100 text-purple-800",
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-red-100 text-red-800",
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`${statusInfo.className} font-medium`}>
        {statusInfo.label}
      </Badge>
    );
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

  // Função para formatar valores de grau
  const formatRefractionValue = (value?: number) => {
    if (value === undefined || value === null) return "N/A";

    // Se o valor for exatamente zero, verificar se todos os valores estão zerados
    if (value === 0) {
      // Se todos os valores da receita forem zero, isso pode indicar que a informação não foi preenchida
      const allZeros =
        order.prescriptionData &&
        (!order.prescriptionData.leftEye?.sph ||
          order.prescriptionData.leftEye.sph === 0) &&
        (!order.prescriptionData.leftEye?.cyl ||
          order.prescriptionData.leftEye.cyl === 0) &&
        (!order.prescriptionData.rightEye?.sph ||
          order.prescriptionData.rightEye.sph === 0) &&
        (!order.prescriptionData.rightEye?.cyl ||
          order.prescriptionData.rightEye.cyl === 0) &&
        (!order.prescriptionData.nd || order.prescriptionData.nd === 0) &&
        (!order.prescriptionData.oc || order.prescriptionData.oc === 0) &&
        (!order.prescriptionData.addition ||
          order.prescriptionData.addition === 0);

      // Se todos forem zero, mostrar "Neutro" ou "Plano" em vez de "0,00"
      if (allZeros) return "Neutro";
    }

    // Para outros valores, mostrar sinal de + para positivos
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2).replace(".", ",")}`;
  };

  // Função para traduzir o status para português
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };

    return statusMap[status] || status;
  };

  // Determinar se o pedido tem produtos múltiplos
  const hasMultipleProducts = Array.isArray(order.product) && order.product.length > 0;
  
  // Verificar se há dados de receita
  const hasPrescriptionData = order.prescriptionData && 
    order.prescriptionData.leftEye && 
    order.prescriptionData.rightEye;

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
            {getStatusBadge(order.status || "")}
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
              {laboratoryInfo && (
                <TabsTrigger value="laboratory">
                  <Beaker className="h-4 w-4 mr-2" />
                  Laboratório
                </TabsTrigger>
              )}
            </TabsList>
            
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
                        {hasMultipleProducts ? (
                          // Renderizar múltiplos produtos
                          order.product.map((product, index) => (
                            <tr key={product._id || index} className="border-b">
                              <td className="py-2">{product.name}</td>
                              <td className="py-2">{getProductTypeLabel(product.productType)}</td>
                              <td className="py-2 text-right">{formatCurrency(product.sellPrice || 0)}</td>
                            </tr>
                          ))
                        ) : (
                          // Fallback para um único produto (para compatibilidade)
                          <tr className="border-b">
                            <td className="py-2">
                              {typeof order.product === 'string'
                                ? order.product
                                : (order.product as any)?.name || 'N/A'}
                            </td>
                            <td className="py-2">
                              {typeof order.product === 'object' && (order.product as any)?.productType
                                ? getProductTypeLabel((order.product as any).productType)
                                : 'N/A'}
                            </td>
                            <td className="py-2 text-right">
                              {formatCurrency(typeof order.product === 'object'
                                ? (order.product as any)?.sellPrice || 0
                                : 0)}
                            </td>
                          </tr>
                        )}
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
                    onUpdateSuccess={fetchOrderDetails}
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <Badge className={getStatusBadge(order.status).className}>
                      {translateStatus(order.status)}
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

            {/* Aba da Receita Médica */}
            {hasPrescriptionData && (
              <TabsContent value="prescription" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Receita Médica
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="space-y-3">
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
                              <th className="py-2 px-3 text-center">PD</th>
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
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Aba de Laboratório */}
            {laboratoryInfo && (
              <TabsContent value="laboratory" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg flex items-center">
                      <Beaker className="h-5 w-5 mr-2" /> Laboratório
                    </h3>
                    {/* Componente para atualizar laboratório */}
                    <OrderLaboratoryUpdate
                      order={order}
                      onUpdateSuccess={fetchOrderDetails}
                    />
                  </div>

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
                </div>
              </TabsContent>
            )}
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