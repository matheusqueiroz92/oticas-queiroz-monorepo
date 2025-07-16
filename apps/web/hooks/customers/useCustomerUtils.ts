import { useMemo } from "react";
import type { User } from "@/app/_types/user";

export function useCustomerUtils() {
  
  /**
   * Calcula o tipo de cliente baseado no número de compras
   */
  const getCustomerType = (customer: User): "VIP" | "Regular" | "Novo" => {
    const purchases = customer.purchases?.length || 0;
    if (purchases >= 5) return "VIP";
    if (purchases >= 1) return "Regular";
    return "Novo";
  };

  /**
   * Calcula estatísticas de uma lista de clientes
   */
  const calculateCustomerStats = useMemo(() => {
    return (customers: User[]) => {
      const totalCustomers = customers.length;
      
      // Clientes VIP com mais de 5 compras
      const vipCustomers = customers.filter(customer => 
        (customer.purchases?.length || 0) >= 5
      ).length;
      
      // Simular clientes novos este mês (30% dos clientes)
      const newThisMonth = Math.floor(totalCustomers * 0.3);
      
      // Clientes ativos com compras
      const activeCustomers = customers.filter(customer => 
        (customer.purchases?.length || 0) > 0
      ).length;

      return {
        totalCustomers,
        vipCustomers,
        newThisMonth,
        activeCustomers
      };
    };
  }, []);

  /**
   * Filtra clientes baseado em critérios específicos
   */
  const filterCustomers = useMemo(() => {
    return (customers: User[], filters: {
      customerType?: string;
      status?: string;
      purchaseRange?: string;
    }) => {
      let filteredCustomers = [...customers];

      // Filtro por tipo de cliente
      if (filters.customerType && filters.customerType !== 'all') {
        filteredCustomers = filteredCustomers.filter(customer => {
          const type = getCustomerType(customer);
          switch (filters.customerType) {
            case 'vip':
              return type === 'VIP';
            case 'regular':
              return type === 'Regular';
            case 'new':
              return type === 'Novo';
            default:
              return true;
          }
        });
      }

      // Filtro por faixa de compras
      if (filters.purchaseRange && filters.purchaseRange !== 'all') {
        filteredCustomers = filteredCustomers.filter(customer => {
          const purchases = customer.purchases?.length || 0;
          switch (filters.purchaseRange) {
            case '0':
              return purchases === 0;
            case '1-2':
              return purchases >= 1 && purchases <= 2;
            case '3-5':
              return purchases >= 3 && purchases <= 5;
            case '6-10':
              return purchases >= 6 && purchases <= 10;
            case '10+':
              return purchases > 10;
            default:
              return true;
          }
        });
      }

      return filteredCustomers;
    };
  }, []);

  /**
   * Ordena clientes por diferentes critérios
   */
  const sortCustomers = useMemo(() => {
    return (customers: User[], sortBy: string = "name") => {
      const sorted = [...customers];
      
      switch (sortBy) {
        case "name":
          return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        case "purchases":
          return sorted.sort((a, b) => (b.purchases?.length || 0) - (a.purchases?.length || 0));
        case "debts":
          return sorted.sort((a, b) => (b.debts || 0) - (a.debts || 0));
        case "createdAt":
          return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        default:
          return sorted;
      }
    };
  }, []);

  /**
   * Calcula crescimento percentual de clientes
   */
  const calculateGrowthPercentage = (current: number, previous: number): string => {
    if (previous === 0) return "+100%";
    const growth = ((current - previous) / previous) * 100;
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  return {
    getCustomerType,
    calculateCustomerStats,
    filterCustomers,
    sortCustomers,
    calculateGrowthPercentage
  };
} 