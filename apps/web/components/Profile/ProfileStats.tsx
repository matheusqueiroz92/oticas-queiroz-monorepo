"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Star,
  Calendar
} from "lucide-react";

interface ProfileStatsProps {
  userRole: string;
  stats?: {
    totalSales?: number;
    ordersCompleted?: number;
    customersServed?: number;
    rating?: number;
  };
}

export function ProfileStats({ userRole, stats }: ProfileStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Estatísticas mockadas baseadas no role
  const getStatsForRole = () => {
    switch (userRole) {
      case "admin":
        return [
          {
            title: "Vendas Este Mês",
            value: formatCurrency(stats?.totalSales || 45280),
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100",
            badge: "5",
            badgeColor: "bg-green-500"
          },
          {
            title: "Pedidos Realizados",
            value: stats?.ordersCompleted?.toString() || "127",
            icon: ShoppingBag,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            badge: "12% este mês",
            badgeColor: "bg-blue-500"
          },
          {
            title: "Clientes Atendidos",
            value: stats?.customersServed?.toString() || "89",
            icon: Users,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            badge: "este mês",
            badgeColor: "bg-purple-500"
          },
          {
            title: "Avaliação Média",
            value: stats?.rating?.toFixed(1) || "4.8",
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            badge: "★★★★★",
            badgeColor: "bg-yellow-500"
          }
        ];
      case "employee":
        return [
          {
            title: "Vendas Este Mês",
            value: formatCurrency(stats?.totalSales || 28500),
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100",
            badge: "3",
            badgeColor: "bg-green-500"
          },
          {
            title: "Pedidos Realizados",
            value: stats?.ordersCompleted?.toString() || "84",
            icon: ShoppingBag,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            badge: "8% este mês",
            badgeColor: "bg-blue-500"
          },
          {
            title: "Clientes Atendidos",
            value: stats?.customersServed?.toString() || "56",
            icon: Users,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            badge: "este mês",
            badgeColor: "bg-purple-500"
          },
          {
            title: "Avaliação Média",
            value: stats?.rating?.toFixed(1) || "4.6",
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            badge: "★★★★☆",
            badgeColor: "bg-yellow-500"
          }
        ];
      case "customer":
        return [
          {
            title: "Total Gasto",
            value: formatCurrency(stats?.totalSales || 2850),
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100",
            badge: "histórico",
            badgeColor: "bg-green-500"
          },
          {
            title: "Pedidos Feitos",
            value: stats?.ordersCompleted?.toString() || "12",
            icon: ShoppingBag,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            badge: "total",
            badgeColor: "bg-blue-500"
          },
          {
            title: "Membro há",
            value: "2 anos",
            icon: Calendar,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            badge: "ativo",
            badgeColor: "bg-purple-500"
          },
          {
            title: "Status",
            value: "Premium",
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            badge: "VIP",
            badgeColor: "bg-yellow-500"
          }
        ];
      default:
        return [];
    }
  };

  const statsData = getStatsForRole();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`w-8 h-8 ${stat.bgColor} rounded-full flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <Badge 
              variant="secondary" 
              className={`text-xs ${stat.badgeColor} text-white border-0`}
            >
              {stat.badge}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 