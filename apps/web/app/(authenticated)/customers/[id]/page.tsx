"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit, 
  DollarSign, 
  Eye, 
  Star,
  Calendar,
  Phone,
  Mail,
  Package,
  TrendingUp,
  Filter,
} from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { getUserById } from "@/app/_services/userService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { Loader2 } from "lucide-react";
import { ErrorAlert } from "@/components/ErrorAlert";
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

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getUserImageUrl } = useUsers();
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(id as string),
    queryFn: () => getUserById(id as string),
    enabled: !!id,
  });

  // Dados mockados para demonstração (substitua pela lógica real)
  const mockOrders = [
    {
      id: "PED-001289",
      date: "15/01/2024",
      products: "Óculos Ray-Ban Aviador",
      value: "R$ 890,00",
      status: "Realizado",
      statusColor: "bg-green-500"
    },
    {
      id: "PED-001245",
      date: "28/12/2023",
      products: "Óculos Oakley Holbrook",
      description: "Lentes Polarizadas",
      value: "R$ 650,00",
      status: "Realizado",
      statusColor: "bg-green-500"
    },
    {
      id: "PED-001188",
      date: "15/11/2023",
      products: "Óculos Armani Exchange",
      value: "R$ 420,00",
      status: "Realizado",
      statusColor: "bg-green-500"
    }
  ];

  const handleEditCustomer = () => {
    setEditDialogOpen(true);
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (error || !customer) {
    return (
      <PageContainer>
        <ErrorAlert message="Erro ao carregar dados do cliente" />
      </PageContainer>
    );
  }

  const totalSpent = mockOrders.reduce((sum, order) => {
    const value = parseFloat(order.value.replace("R$ ", "").replace(".", "").replace(",", "."));
    return sum + value;
  }, 0);

  const totalOrders = mockOrders.length;
  const totalGlasses = 8; // Mock data
  const loyaltyPoints = 2150; // Mock data
  const customerSince = customer.createdAt ? format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "10/05/2019";

  return (
    <PageContainer className="min-h-screen text-white">
      <div className="space-y-6">
        {/* Header do Cliente */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={customer.image ? getUserImageUrl(customer.image) : undefined} alt={customer.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-lg">
                    {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-gray-400">
                    {customer.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Cliente desde: {customerSince}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleEditCustomer}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Dados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Gasto
              </CardTitle>
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-green-400 mt-1">
                +R$ 890 este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total de Pedidos
              </CardTitle>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalOrders}</div>
              <p className="text-xs text-blue-400 mt-1">
                +1 este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Óculos Comprados
              </CardTitle>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalGlasses}</div>
              <p className="text-xs text-purple-400 mt-1">
                Último: Jan/2024
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Fidelidade
              </CardTitle>
              <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{loyaltyPoints.toLocaleString()}</div>
              <p className="text-xs text-yellow-400 mt-1">
                Pontos acumulados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Pedidos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">Histórico de Pedidos</CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Produtos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {mockOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{order.date}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{order.products}</div>
                        {order.description && (
                          <div className="text-xs text-gray-400">{order.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{order.value}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${order.statusColor} text-white border-0`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewOrder(order.id)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-400 hover:text-green-300 hover:bg-gray-700"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Edição do Cliente */}
      {editDialogOpen && (
        <CustomerDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          customer={customer}
          mode="edit"
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </PageContainer>
  );
}