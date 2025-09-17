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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import OrderLaboratoryUpdate from "@/components/orders/OrderLaboratoryUpdate";
import OrderStatusUpdate from "@/components/orders/OrderStatusUpdate";
import OrderPaymentHistory from "@/components/orders/OrderPaymentHistory";
import { 
  Beaker, 
  FileText,
  User,
  CreditCard,
  Truck,
  ShoppingBag,
  Building,
  Phone,
  Mail,
  CalendarDays,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import { useOrders } from "@/hooks/orders/useOrders";
import { useToast } from "@/hooks/useToast";
import type { Order } from "@/app/_types/order";
import OrderPdfExporter from "./exports/OrderPdfExporter";

interface OrderDetailsProps {
  order: Order;
  onGoBack: () => void;
  onRefresh: () => void;
}

export default function OrderDetails({ order, onGoBack, onRefresh }: OrderDetailsProps) {
  const [client, setClient] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [laboratoryInfo, setLaboratoryInfo] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const { toast } = useToast();
  
  const { 
    getStatusBadge,
    getPaymentStatusBadge,
    getPaymentMethodText,
    getProductTypeLabel,
    fetchOrderComplementaryDetails,
    formatCurrency,
    formatDate,
    handleCancelOrder
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

  // Detectar mudanças de tema
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Função para cancelar pedido
  const handleCancelOrderClick = async () => {
    if (!order._id) return;
    
    setIsCancelling(true);
    try {
      await handleCancelOrder(order._id);
      toast({
        title: "Pedido cancelado",
        description: `Pedido #${order.serviceOrder} foi cancelado com sucesso.`,
        variant: "default",
      });
      onRefresh(); // Atualizar a lista de pedidos
    } catch (error: any) {
      console.error("Erro ao cancelar pedido:", error);
      toast({
        title: "Erro ao cancelar pedido",
        description: error?.response?.data?.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

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
          <Button variant="ghost" size="sm" onClick={onGoBack} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
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
            <TabsList 
              className="w-full border-b p-0 rounded-none h-12 tabs-list"
              style={{ 
                backgroundColor: isDark ? '#1f2937' : '#f9fafb'
              }}
            >
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
                              <p 
                                className="flex items-center gap-2"
                                style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                              >
                                <Mail 
                                  className="h-4 w-4" 
                                  style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                                /> 
                                {client.email}
                              </p>
                              {client.phone && (
                                <p 
                                  className="flex items-center gap-2"
                                  style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                                >
                                  <Phone 
                                    className="h-4 w-4" 
                                    style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                                  /> 
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
                            <p 
                              className="flex items-center gap-2"
                              style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                            >
                              <Mail 
                                className="h-4 w-4" 
                                style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                              /> 
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
                          <thead 
                            className="text-sm"
                            style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                          >
                            <tr className="border-b">
                              <th 
                                className="text-left font-medium p-3"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                Produto
                              </th>
                              <th 
                                className="text-left font-medium p-3"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                Tipo
                              </th>
                              <th 
                                className="text-right font-medium p-3"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                Preço
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {products.map((product: any, index: number) => (
                              <tr key={product._id || index} className="border-b">
                                <td 
                                  className="p-3 font-medium"
                                  style={{ color: isDark ? '#f9fafb' : '#111827' }}
                                >
                                  {product.name}
                                </td>
                                <td 
                                  className="p-3"
                                  style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                                >
                                  {getProductTypeLabel(product.productType)}
                                </td>
                                <td 
                                  className="p-3 text-right"
                                  style={{ color: isDark ? '#f9fafb' : '#111827' }}
                                >
                                  {formatCurrency(product.sellPrice || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div 
                          className="p-4"
                          style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                        >
                          <div className="flex justify-between items-center text-sm">
                            <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Subtotal:</span>
                            <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>{formatCurrency(order.totalPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Desconto:</span>
                            <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>-{formatCurrency(order.discount || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center font-medium text-base mt-3 pt-3 border-t">
                            <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>Total:</span>
                            <span 
                              className="text-lg"
                              style={{ color: isDark ? '#22c55e' : '#16a34a' }}
                            >
                              {formatCurrency(order.finalPrice || order.totalPrice)}
                            </span>
                          </div>
                        </div>

                        {order.observations && (
                          <div className="p-4 border-t">
                            <p 
                              className="text-sm font-medium mb-2"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Observações:
                            </p>
                            <p 
                              className="text-sm p-3 rounded"
                              style={{ 
                                color: isDark ? '#9ca3af' : '#4b5563',
                                backgroundColor: isDark ? '#374151' : '#f9fafb'
                              }}
                            >
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
                          <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>
                            {order.status === "pending" && "O pedido está aguardando processamento"}
                            {order.status === "in_production" && "O pedido está sendo produzido"}
                            {order.status === "ready" && "O pedido está pronto para retirada"}
                            {order.status === "delivered" && "O pedido foi entregue ao cliente"}
                            {order.status === "cancelled" && "O pedido foi cancelado"}
                          </span>
                        </div>
                        
                        {order.status === "pending" && !order.laboratoryId && (
                          <div 
                            className="mt-3 p-3 border rounded text-sm flex items-center gap-2"
                            style={{
                              backgroundColor: isDark ? '#451a03' : '#fefce8',
                              borderColor: isDark ? '#92400e' : '#fde047',
                              color: isDark ? '#fbbf24' : '#a16207'
                            }}
                          >
                            <AlertTriangle 
                              className="h-4 w-4" 
                              style={{ color: isDark ? '#fbbf24' : '#eab308' }}
                            />
                            <span>
                              Para mudar o status para "Em Produção", associe um laboratório a este pedido.
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div 
                            className="flex items-center gap-2"
                            style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                          >
                            <CalendarDays 
                              className="h-4 w-4" 
                              style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                            />
                            <span>Data do pedido:</span>
                          </div>
                          <span 
                            className="font-medium"
                            style={{ color: isDark ? '#f9fafb' : '#111827' }}
                          >
                            {formatDate(order.orderDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center gap-2"
                            style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
                          >
                            <CalendarDays 
                              className="h-4 w-4" 
                              style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                            />
                            <span>Data de entrega:</span>
                          </div>
                          <span 
                            className="font-medium"
                            style={{ color: isDark ? '#f9fafb' : '#111827' }}
                          >
                            {formatDate(order.deliveryDate)}
                          </span>
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
                          <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Status do Pagamento:</span>
                          <Badge
                            className={getPaymentStatusBadge(order.paymentStatus).className}
                            style={{ pointerEvents: 'none' }} 
                          >
                            {getPaymentStatusBadge(order.paymentStatus).label}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Método:</span>
                          <span 
                            className="font-medium"
                            style={{ color: isDark ? '#f9fafb' : '#111827' }}
                          >
                            {getPaymentMethodText(order.paymentMethod)}
                          </span>
                        </div>
                        
                        {(order.paymentEntry || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Entrada:</span>
                            <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>{formatCurrency(order.paymentEntry || 0)}</span>
                          </div>
                        )}
                        
                        {(order.installments || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Parcelas:</span>
                            <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>{order.installments}x</span>
                          </div>
                        )}
                        
                        <div className="pt-3 mt-3 border-t">
                          <div className="flex justify-between items-center">
                            <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Subtotal:</span>
                            <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>{formatCurrency(order.totalPrice || 0)}</span>
                          </div>
                          
                          {(order.discount || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Desconto:</span>
                              <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>-{formatCurrency(order.discount || 0)}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center font-medium text-base mt-3 pt-3 border-t">
                            <span style={{ color: isDark ? '#f9fafb' : '#111827' }}>Total:</span>
                            <span 
                              className="text-lg"
                              style={{ color: isDark ? '#22c55e' : '#16a34a' }}
                            >
                              {formatCurrency(order.finalPrice || order.totalPrice || 0)}
                            </span>
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
                <div 
                  className="p-5 rounded-md border shadow-sm"
                  style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                >
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                      <p 
                        className="text-sm"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                      >
                        <span className="font-semibold">Médico:</span>{" "}
                        {order.prescriptionData?.doctorName || "N/A"}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                      >
                        <span className="font-semibold">Clínica:</span>{" "}
                        {order.prescriptionData?.clinicName || "N/A"}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                      >
                        <span className="font-semibold">Data da Consulta:</span>{" "}
                        {formatDate(order.prescriptionData?.appointmentDate)}
                      </p>
                    </div>

                    {/* Tabela de receita */}
                    <div className="mt-4 overflow-x-auto">
                      <table 
                        className="min-w-full border text-sm shadow-sm"
                        style={{ 
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#d1d5db'
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                            <th 
                              className="py-3 px-4 text-left"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Olho
                            </th>
                            <th 
                              className="py-3 px-4 text-center"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Esf.
                            </th>
                            <th 
                              className="py-3 px-4 text-center"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Cil.
                            </th>
                            <th 
                              className="py-3 px-4 text-center"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Eixo
                            </th>
                            <th 
                              className="py-3 px-4 text-center"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              DP
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.prescriptionData?.leftEye && (
                            <tr className="border-t">
                              <td 
                                className="py-3 px-4 font-medium"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                Esquerdo
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {formatDioptriaDisplay(order.prescriptionData.leftEye.sph?.toString()) || "N/A"}
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {formatDioptriaDisplay(order.prescriptionData.leftEye.cyl?.toString()) || "N/A"}
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {order.prescriptionData.leftEye.axis || "N/A"}°
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {order.prescriptionData.leftEye.pd || "N/A"}
                              </td>
                            </tr>
                          )}

                          {order.prescriptionData?.rightEye && (
                            <tr className="border-t">
                              <td 
                                className="py-3 px-4 font-medium"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                Direito
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {formatDioptriaDisplay(order.prescriptionData.rightEye.sph?.toString()) || "N/A"}
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {formatDioptriaDisplay(order.prescriptionData.rightEye.cyl?.toString()) || "N/A"}
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {order.prescriptionData.rightEye.axis || "N/A"}°
                              </td>
                              <td 
                                className="py-3 px-4 text-center"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                {order.prescriptionData.rightEye.pd || "N/A"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                            <th 
                              className="py-3 px-4 text-left"
                              colSpan={5}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Informações adicionais
                            </th>
                          </tr>
                          <tr>
                            <td 
                              className="py-3 px-4 font-medium"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              D.N.P.
                            </td>
                            <td 
                              className="py-3 px-4 text-center" 
                              colSpan={4}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              {order.prescriptionData?.nd || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td 
                              className="py-3 px-4 font-medium"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              C.O.
                            </td>
                            <td 
                              className="py-3 px-4 text-center" 
                              colSpan={4}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              {order.prescriptionData?.oc || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td 
                              className="py-3 px-4 font-medium"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Adição
                            </td>
                            <td 
                              className="py-3 px-4 text-center" 
                              colSpan={4}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              {order.prescriptionData?.addition || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td 
                              className="py-3 px-4 font-medium"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Ponte
                            </td>
                            <td 
                              className="py-3 px-4 text-center" 
                              colSpan={4}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              {order.prescriptionData?.bridge || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td 
                              className="py-3 px-4 font-medium"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              Aro
                            </td>
                            <td 
                              className="py-3 px-4 text-center" 
                              colSpan={4}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              {order.prescriptionData?.rim || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td 
                              className="py-3 px-4 font-medium"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              AV
                            </td>
                            <td 
                              className="py-3 px-4 text-center" 
                              colSpan={4}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              {order.prescriptionData?.vh || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td 
                              className="py-3 px-4 font-medium"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              AM
                            </td>
                            <td 
                              className="py-3 px-4 text-center" 
                              colSpan={4}
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
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
                            <p style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Nome:</p>
                            <p 
                              className="font-medium flex items-center gap-2 text-base"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              <Building 
                                className="h-4 w-4" 
                                style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                              />
                              {laboratoryInfo.name}
                            </p>
                          </div>
                          
                          {laboratoryInfo.contactName && (
                            <div>
                              <p style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Contato:</p>
                              <p 
                                className="font-medium flex items-center gap-2"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                <User 
                                  className="h-4 w-4" 
                                  style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                                />
                                {laboratoryInfo.contactName}
                              </p>
                            </div>
                          )}
                          
                          {laboratoryInfo.phone && (
                            <div>
                              <p style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Telefone:</p>
                              <p 
                                className="font-medium flex items-center gap-2"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                <Phone 
                                  className="h-4 w-4" 
                                  style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                                />
                                {laboratoryInfo.phone}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {laboratoryInfo.email && (
                            <div>
                              <p style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Email:</p>
                              <p 
                                className="font-medium flex items-center gap-2"
                                style={{ color: isDark ? '#f9fafb' : '#111827' }}
                              >
                                <Mail 
                                  className="h-4 w-4" 
                                  style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                                />
                                {laboratoryInfo.email}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Status:</p>
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
                            <p style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>Data de entrega prevista:</p>
                            <p 
                              className="font-medium flex items-center gap-2"
                              style={{ color: isDark ? '#f9fafb' : '#111827' }}
                            >
                              <CalendarDays 
                                className="h-4 w-4" 
                                style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                              />
                              {formatDate(order.deliveryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div 
                  className="p-5 rounded-md border shadow-sm text-sm"
                  style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                >
                  <div className="space-y-4">
                    <p style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>
                      Nenhum laboratório associado a este pedido.
                    </p>
                    <p 
                      className="mt-2"
                      style={{ color: isDark ? '#f9fafb' : '#111827' }}
                    >
                      Use o botão "Associar Laboratório" para vincular um laboratório a este pedido.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t p-4 flex justify-between">
          <div className="flex gap-3">
            <OrderPdfExporter
              order={order}
              customer={client}
              buttonText="Exportar PDF"
              variant="outline"
              size="default"
            />
            
            {/* Botão de cancelar pedido - só aparece se não estiver cancelado ou entregue */}
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="default"
                    disabled={isCancelling}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    {isCancelling ? "Cancelando..." : "Cancelar Pedido"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar o pedido #{order.serviceOrder}?
                      <br />
                      <br />
                      <strong>Esta ação não pode ser desfeita.</strong> O pedido será marcado como cancelado e o número da OS não poderá ser reutilizado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Não, manter pedido</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelOrderClick}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sim, cancelar pedido
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}