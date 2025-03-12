"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../services/auth";
import OrderDetailsPDF from "../../../../components/exports/OrderDetailsPdf";
import OrderLaboratoryUpdate from "../../../../components/OrderLaboratoryUpdate";
import OrderStatusUpdate from "../../../../components/OrderStatusUpdate";
import type { OrderDetail } from "@/app/types/order-details";
import { Beaker } from "lucide-react";

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
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
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

      // Extrair dados do cliente usando RegExp
      try {
        if (typeof orderData.clientId === "string") {
          // Usando expressões regulares para extrair as informações
          const nameMatch = orderData.clientId.match(/name: ['"](.+?)['"]/);
          const emailMatch = orderData.clientId.match(/email: ['"](.+?)['"]/);
          const idMatch = orderData.clientId.match(/ObjectId\(['"](.+?)['"]\)/);
          const roleMatch = orderData.clientId.match(/role: ['"](.+?)['"]/);

          if (nameMatch && emailMatch) {
            setClient({
              _id: idMatch ? idMatch[1] : "unknown-id",
              name: nameMatch[1],
              email: emailMatch[1],
              role: roleMatch ? roleMatch[1] : undefined,
            });
          }
        } else if (
          typeof orderData.clientId === "object" &&
          orderData.clientId !== null
        ) {
          // Já é um objeto
          setClient(orderData.clientId);
        }
      } catch (error) {
        console.error("Erro ao processar dados do cliente:", error);
      }

      // Extrair dados do funcionário usando RegExp
      try {
        if (typeof orderData.employeeId === "string") {
          // Usando expressões regulares para extrair as informações
          const nameMatch = orderData.employeeId.match(/name: ['"](.+?)['"]/);
          const emailMatch = orderData.employeeId.match(/email: ['"](.+?)['"]/);
          const idMatch = orderData.employeeId.match(
            /ObjectId\(['"](.+?)['"]\)/
          );

          if (nameMatch && emailMatch) {
            setEmployee({
              _id: idMatch ? idMatch[1] : "unknown-id",
              name: nameMatch[1],
              email: emailMatch[1],
            });
          }
        } else if (
          typeof orderData.employeeId === "object" &&
          orderData.employeeId !== null
        ) {
          // Já é um objeto
          setEmployee(orderData.employeeId);
        }
      } catch (error) {
        console.error("Erro ao processar dados do funcionário:", error);
      }

      // Se o pedido tiver um laboratório associado, buscar seus detalhes
      if (
        orderData.laboratoryId &&
        typeof orderData.laboratoryId === "string"
      ) {
        try {
          // Verificar se é um ID ou uma string de objeto
          if (orderData.laboratoryId.includes("ObjectId")) {
            // Extrair o ID do laboratório usando regex
            const idMatch = orderData.laboratoryId.match(
              /ObjectId\(['"](.+?)['"]\)/
            );
            if (idMatch?.[1]) {
              const labResponse = await api.get(
                `/api/laboratories/${idMatch[1]}`
              );
              setLaboratoryInfo(labResponse.data);
            }
          } else {
            // Já é um ID simples
            const labResponse = await api.get(
              `/api/laboratories/${orderData.laboratoryId}`
            );
            setLaboratoryInfo(labResponse.data);
          }
        } catch (labError) {
          console.error("Erro ao buscar informações do laboratório:", labError);
          setLaboratoryInfo(null);
        }
      } else if (
        typeof orderData.laboratoryId === "object" &&
        orderData.laboratoryId !== null
      ) {
        // O laboratório já veio como objeto no pedido
        setLaboratoryInfo(orderData.laboratoryId as Laboratory);
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

  // Função para formatar a data
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
      case "in_production":
        return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
      case "ready":
        return "text-green-600 bg-green-100 px-2 py-1 rounded";
      case "delivered":
        return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
      default:
        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
    }
  };

  // Função para traduzir o status para português
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
    };

    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {formatDate(order.createdAt)}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Pedido #{order._id}</CardTitle>
            {getStatusBadge(order.status || "")}
          </div>
          <CardDescription>
            Criado em {formatDate(order.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações principais */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Coluna Cliente */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Informações do Cliente</h3>
              <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <span className="font-semibold">Nome:</span>{" "}
                  {client
                    ? client.name
                    : order.customClientName || "Cliente não encontrado"}
                </p>
                {client && (
                  <p className="text-sm">
                    <span className="font-semibold">Email:</span> {client.email}
                  </p>
                )}
              </div>
            </div>

            {/* Coluna Vendedor */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Informações do Vendedor</h3>
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

          {/* Detalhes do Pedido */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Detalhes do Produto</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Produto:</span>{" "}
                  {order.product || "N/A"}
                </p>
                {order.description && (
                  <p className="text-sm">
                    <span className="font-semibold">Descrição:</span>{" "}
                    {order.description}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-semibold">Tipo:</span>{" "}
                  {order.glassesType === "prescription"
                    ? "Óculos de Grau"
                    : "Óculos Solar"}
                </p>
                {order.glassesType === "prescription" && (
                  <>
                    <p className="text-sm">
                      <span className="font-semibold">Tipo de Lente:</span>{" "}
                      {order.lensType || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Data de Entrega:</span>{" "}
                      {formatDate(order.deliveryDate)}
                    </p>
                  </>
                )}
                {order.observations && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold">Observações:</p>
                    <p className="text-sm bg-white p-2 rounded mt-1">
                      {order.observations}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Status do Pedido */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">Status do Pedido</h3>
              {/* Componente para atualizar o status */}
              <OrderStatusUpdate
                order={order}
                onUpdateSuccess={fetchOrderDetails}
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center">
                <div className={getStatusClass(order.status)}>
                  {translateStatus(order.status)}
                </div>
                <div className="ml-4 text-sm text-muted-foreground">
                  {order.status === "pending" &&
                    "O pedido está aguardando processamento"}
                  {order.status === "in_production" &&
                    "O pedido está sendo produzido"}
                  {order.status === "ready" &&
                    "O pedido está pronto para retirada"}
                  {order.status === "delivered" &&
                    "O pedido foi entregue ao cliente"}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Laboratório (apenas para óculos de grau) */}
          {order.glassesType === "prescription" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <Beaker className="h-5 w-5" /> Laboratório
                </h3>
                {/* Componente para atualizar laboratório */}
                <OrderLaboratoryUpdate
                  order={order}
                  onUpdateSuccess={fetchOrderDetails}
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
                    <div className="text-sm">
                      <span className="font-semibold">Status:</span>{" "}
                      <Badge
                        variant={
                          laboratoryInfo.isActive ? "outline" : "destructive"
                        }
                      >
                        {laboratoryInfo.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum laboratório associado a este pedido.
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Informações de Pagamento */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Informações de Pagamento</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Método de Pagamento:</span>{" "}
                    {getPaymentMethodText(order.paymentMethod)}
                  </p>
                  {(order.paymentEntry || 0) > 0 && (
                    <p className="text-sm">
                      <span className="font-semibold">Entrada:</span> R${" "}
                      {(order.paymentEntry || 0).toFixed(2)}
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
                  <p className="text-sm font-semibold">Valor Total:</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {(order.totalPrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Receita médica (somente se for óculos de grau) */}
          {order.prescriptionData && order.glassesType === "prescription" && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Receita Médica</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-sm">
                      <span className="font-semibold">Médico:</span>{" "}
                      {order.prescriptionData.doctorName || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Clínica:</span>{" "}
                      {order.prescriptionData.clinicName || "N/A"}
                    </p>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">Data da Consulta:</span>{" "}
                    {formatDate(order.prescriptionData.appointmentDate)}
                  </p>

                  {/* Tabela de receita */}
                  {order.prescriptionData.leftEye &&
                    order.prescriptionData.rightEye && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-3 text-left">Olho</th>
                              <th className="py-2 px-3 text-center">Esf.</th>
                              <th className="py-2 px-3 text-center">Cil.</th>
                              <th className="py-2 px-3 text-center">Eixo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.prescriptionData.leftEye && (
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
                                  {order.prescriptionData.leftEye.axis || "N/A"}
                                  °
                                </td>
                              </tr>
                            )}

                            {order.prescriptionData.rightEye && (
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
                                  {order.prescriptionData.rightEye.axis ||
                                    "N/A"}
                                  °
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-3 text-left" colSpan={4}>
                                Informações adicionais
                              </th>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium">D.N.P.</td>
                              <td className="py-2 px-3 text-center" colSpan={3}>
                                {order.prescriptionData.nd || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium">C.O.</td>
                              <td className="py-2 px-3 text-center" colSpan={3}>
                                {order.prescriptionData.oc || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium">Adição</td>
                              <td className="py-2 px-3 text-center" colSpan={3}>
                                {order.prescriptionData.addition || "N/A"}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Exportar Pedido</h3>
          <OrderDetailsPDF
            order={order}
            clientName={
              client
                ? client.name
                : order.customClientName || "Cliente não encontrado"
            }
            employeeName={employee ? employee.name : "Vendedor não encontrado"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
