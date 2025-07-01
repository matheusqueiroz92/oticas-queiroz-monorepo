"use client";

import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Star,
  Calendar,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/app/_utils/profile-utils";

interface ProfileStatsData {
  totalSales: number;
  totalSalesAllTime: number;
  ordersCompleted: number;
  ordersCompletedAllTime: number;
  customersServed: number;
  customersServedAllTime: number;
  membershipDuration: string;
  customerStatus: string;
  userRating: number;
  ordersGrowth: number;
  starRating: string;
}

interface ProfileStatsProps {
  userRole: string;
  profileData: ProfileStatsData;
  isLoading?: boolean;
}

export function ProfileStats({ userRole, profileData, isLoading = false }: ProfileStatsProps) {

  // Gerar estatísticas baseadas em dados reais
  const getStatsForRole = () => {
    const isPositiveGrowth = profileData.ordersGrowth >= 0;
    const growthColor = isPositiveGrowth ? "text-green-600" : "text-red-600";
    const growthText = `${isPositiveGrowth ? '+' : ''}${profileData.ordersGrowth}% este mês`;
    const GrowthIconComponent = isPositiveGrowth ? TrendingUp : TrendingDown;

    switch (userRole) {
      case "admin":
      case "employee":
        return [
          {
            title: "Vendas Este Mês",
            value: formatCurrency(profileData.totalSales),
            icon: DollarSign,
            iconColor: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-100/10",
            description: (
              <>
                <GrowthIconComponent className={`h-4 w-4 inline mr-1 ${growthColor}`} />
                {growthText}
              </>
            )
          },
          {
            title: "Pedidos Realizados",
            value: profileData.ordersCompleted.toString(),
            icon: ShoppingBag,
            iconColor: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-100/10",
            badge: { 
              text: `${profileData.ordersCompletedAllTime} total`, 
              className: "bg-blue-500 text-white border-0" 
            }
          },
          {
            title: "Clientes Atendidos",
            value: profileData.customersServed.toString(),
            icon: Users,
            iconColor: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-100/10",
            badge: { 
              text: `${profileData.customersServedAllTime} total`, 
              className: "bg-purple-500 text-white border-0" 
            }
          },
          {
            title: "Avaliação Média",
            value: profileData.userRating.toFixed(1),
            icon: Star,
            iconColor: "text-yellow-600",
            bgColor: "bg-yellow-100 dark:bg-yellow-100/10",
            badge: { 
              text: profileData.starRating, 
              className: "bg-yellow-500 text-white border-0" 
            }
          }
        ];
      case "customer":
        return [
          {
            title: "Total Gasto",
            value: formatCurrency(profileData.totalSalesAllTime),
            icon: DollarSign,
            iconColor: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-100/10",
            badge: { 
              text: "histórico", 
              className: "bg-green-500 text-white border-0" 
            }
          },
          {
            title: "Pedidos Feitos",
            value: profileData.ordersCompletedAllTime.toString(),
            icon: ShoppingBag,
            iconColor: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-100/10",
            badge: { 
              text: "total", 
              className: "bg-blue-500 text-white border-0" 
            }
          },
          {
            title: "Membro há",
            value: profileData.membershipDuration,
            icon: Calendar,
            iconColor: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-100/10",
            badge: { 
              text: "ativo", 
              className: "bg-purple-500 text-white border-0" 
            }
          },
          {
            title: "Status",
            value: profileData.customerStatus,
            icon: Star,
            iconColor: "text-yellow-600",
            bgColor: "bg-yellow-100 dark:bg-yellow-100/10",
            badge: { 
              text: profileData.customerStatus === "Premium" ? "VIP" : "Cliente", 
              className: "bg-yellow-500 text-white border-0" 
            }
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
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.iconColor}
          bgColor={stat.bgColor}
          badge={stat.badge}
          description={stat.description}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
} 