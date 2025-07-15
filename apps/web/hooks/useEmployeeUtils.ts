import { useMemo } from "react";
import type { User } from "@/app/_types/user";

export function useEmployeeUtils() {
  
  /**
   * Calcula o tipo de funcionário baseado no número de vendas
   */
  const getEmployeeType = (employee: User): "Top" | "Regular" | "Novo" => {
    const sales = employee.sales?.length || 0;
    if (sales >= 10) return "Top";
    if (sales >= 1) return "Regular";
    return "Novo";
  };

  /**
   * Calcula estatísticas de uma lista de funcionários
   */
  const calculateEmployeeStats = useMemo(() => {
    return (employees: User[]) => {
      const totalEmployees = employees.length;
      
      // Funcionários top com mais de 10 vendas
      const topEmployees = employees.filter(employee => 
        (employee.sales?.length || 0) >= 10
      ).length;
      
      // Simular funcionários novos este mês (20% dos funcionários)
      const newThisMonth = Math.floor(totalEmployees * 0.2);
      
      // Funcionários ativos com vendas
      const activeEmployees = employees.filter(employee => 
        (employee.sales?.length || 0) > 0
      ).length;

      // Total de vendas
      const totalSales = employees.reduce((total, employee) => {
        return total + (employee.sales?.length || 0);
      }, 0);

      // Faturamento estimado (R$ 450 por venda em média)
      const totalRevenue = totalSales * 450;

      return {
        totalEmployees,
        topEmployees,
        newThisMonth,
        activeEmployees,
        totalSales,
        totalRevenue
      };
    };
  }, []);

  /**
   * Filtra funcionários baseado em critérios específicos
   */
  const filterEmployees = useMemo(() => {
    return (employees: User[], filters: {
      role?: string;
      status?: string;
      salesRange?: string;
    }) => {
      let filteredEmployees = [...employees];

      // Filtro por função
      if (filters.role && filters.role !== 'todos') {
        filteredEmployees = filteredEmployees.filter(employee => {
          switch (filters.role) {
            case 'admin':
              return employee.role === 'admin';
            case 'employee':
              return employee.role === 'employee';
            default:
              return true;
          }
        });
      }

      // Filtro por faixa de vendas
      if (filters.salesRange && filters.salesRange !== 'todos') {
        filteredEmployees = filteredEmployees.filter(employee => {
          const sales = employee.sales?.length || 0;
          switch (filters.salesRange) {
            case '0':
              return sales === 0;
            case '1-5':
              return sales >= 1 && sales <= 5;
            case '6-10':
              return sales >= 6 && sales <= 10;
            case '10+':
              return sales > 10;
            default:
              return true;
          }
        });
      }

      return filteredEmployees;
    };
  }, []);

  /**
   * Ordena funcionários por diferentes critérios
   */
  const sortEmployees = useMemo(() => {
    return (employees: User[], sortBy: string = "name") => {
      const sorted = [...employees];
      
      switch (sortBy) {
        case "name":
          return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        case "sales":
          return sorted.sort((a, b) => (b.sales?.length || 0) - (a.sales?.length || 0));
        case "revenue":
          return sorted.sort((a, b) => {
            const revenueA = (a.sales?.length || 0) * 450;
            const revenueB = (b.sales?.length || 0) * 450;
            return revenueB - revenueA;
          });
        case "createdAt":
          return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        default:
          return sorted;
      }
    };
  }, []);

  /**
   * Calcula crescimento percentual de funcionários
   */
  const calculateGrowthPercentage = (current: number, previous: number): string => {
    if (previous === 0) return "+100%";
    const growth = ((current - previous) / previous) * 100;
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  return {
    getEmployeeType,
    calculateEmployeeStats,
    filterEmployees,
    sortEmployees,
    calculateGrowthPercentage
  };
} 