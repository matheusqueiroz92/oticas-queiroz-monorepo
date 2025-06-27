"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft,
  Edit, 
  DollarSign, 
  Eye, 
  Star,
  Calendar,
  Phone,
  Mail,
  Package,
  MapPin,
  Hash,
  AlertTriangle,
} from "lucide-react";
import { getUserById } from "@/app/_services/userService";
import { getOrdersByClient } from "@/app/_services/orderService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { useUsers } from "@/hooks/useUsers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getUserImageUrl } = useUsers();
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    data: customer,
    isLoading: isLoadingCustomer,
    error: customerError,
    refetch: refetchCustomer,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(id as string),
    queryFn: () => getUserById(id as string),
    enabled: !!id,
  });

  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.CLIENT(id as string),
    queryFn: () => getOrdersByClient(id as string),
    enabled: !!id,
  });

  const handleGoBack = () => {
    router.push("/customers");
  };

  const handleEditCustomer = () => {
    setEditDialogOpen(true);
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const isLoading = isLoadingCustomer || isLoadingOrders;
  const error = customerError || ordersError;

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !customer) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cliente não encontrado</AlertTitle>
          <AlertDescription>
            {error?.message || "O cliente que você está procurando não existe ou foi removido."} 
          </AlertDescription>
          <Button className="mt-4" variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Clientes
          </Button>
        </Alert>
      </div>
    );
  }

  // Processar pedidos reais
  const customerOrders = orders || [];
  
  // Filtrar pedidos baseado no filtro selecionado
  const filteredOrders = customerOrders.filter(order => {
    if (statusFilter === "todos") return true;
    if (statusFilter === "realizado") return order.status === "delivered";
    if (statusFilter === "pendente") return ["pending", "in_production", "ready"].includes(order.status);
    if (statusFilter === "cancelado") return order.status === "cancelled";
    return true;
  });

  // Calcular estatísticas baseadas nos pedidos reais
  const totalSpent = customerOrders.reduce((sum, order) => sum + (order.finalPrice || 0), 0);
  const totalOrders = customerOrders.length;
  const deliveredOrders = customerOrders.filter(order => order.status === "delivered");
  const totalGlasses = deliveredOrders.reduce((sum, order) => sum + order.products.length, 0);
  const loyaltyPoints = Math.floor(totalSpent * 0.1); // Mock calculation: 10% of total spent
  const customerSince = customer.createdAt ? format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A";

  // Calcular crescimento mensal (mock - poderia ser implementado com dados reais)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthOrders = customerOrders.filter(order => {
    const orderDate = new Date(order.createdAt || order.orderDate);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });
  const currentMonthSpent = currentMonthOrders.reduce((sum, order) => sum + (order.finalPrice || 0), 0);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { label: "Entregue", className: "bg-green-50 text-green-700 border-green-200" },
      ready: { label: "Pronto", className: "bg-blue-50 text-blue-700 border-blue-200" },
      in_production: { label: "Em Produção", className: "bg-orange-50 text-orange-700 border-orange-200" },
      pending: { label: "Pendente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      cancelled: { label: "Cancelado", className: "bg-red-50 text-red-700 border-red-200" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={`${config.className} border`}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <Button onClick={handleEditCustomer} className="gap-2">
          <Edit className="h-4 w-4" />
          Editar Cliente
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Coluna Principal - Informações e Estatísticas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Principal do Cliente */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={customer.image ? getUserImageUrl(customer.image) : undefined} alt={customer.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                    {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{customer.name}</h2>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Cliente desde {customerSince}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.email && (
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{customer.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.phone && (
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{customer.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.cpf && (
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">CPF</p>
                          <p className="font-medium">{customer.cpf}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Endereço</p>
                          <p className="font-medium">{customer.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Gasto
                </CardTitle>
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                <p className="text-xs text-green-600 mt-1">
                  +{formatCurrency(currentMonthSpent)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pedidos
                </CardTitle>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-blue-600 mt-1">
                  +{currentMonthOrders.length} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Óculos
                </CardTitle>
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGlasses}</div>
                <p className="text-xs text-purple-600 mt-1">
                  {deliveredOrders.length > 0 ? `Último: ${formatDate(deliveredOrders[0].createdAt || deliveredOrders[0].orderDate)}` : "Nenhum entregue"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fidelidade
                </CardTitle>
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loyaltyPoints.toLocaleString()}</div>
                <p className="text-xs text-yellow-600 mt-1">
                  Pontos acumulados
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coluna Lateral - Histórico de Pedidos */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pedidos Recentes
                </CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="realizado">Entregue</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredOrders.slice(0, 10).map((order, index) => (
                  <div key={order._id} className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${index !== filteredOrders.slice(0, 10).length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">#{order.serviceOrder || order._id.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt || order.orderDate)}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {order.products.length === 1 
                          ? order.products[0].name 
                          : `${order.products.length} produtos`
                        }
                      </p>
                      {order.products.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {order.products.map(p => p.name).join(", ").substring(0, 50)}...
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(order.finalPrice || 0)}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewOrder(order._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredOrders.length === 0 && (
                <div className="p-6 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {statusFilter === "todos" 
                      ? "Nenhum pedido encontrado" 
                      : `Nenhum pedido ${statusFilter === "realizado" ? "entregue" : statusFilter} encontrado`
                    }
                  </p>
                </div>
              )}

              {filteredOrders.length > 10 && (
                <div className="p-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push(`/orders?clientId=${id}`)}
                  >
                    Ver todos os {filteredOrders.length} pedidos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Edição do Cliente */}
      {editDialogOpen && (
        <CustomerDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          customer={customer}
          mode="edit"
          onSuccess={() => {
            refetchCustomer();
          }}
        />
      )}
    </div>
  );
}