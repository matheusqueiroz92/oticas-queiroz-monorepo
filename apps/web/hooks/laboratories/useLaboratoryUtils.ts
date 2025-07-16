import { useMemo } from "react";
import type { Laboratory } from "@/app/_types/laboratory";

export function useLaboratoryUtils() {
  
  /**
   * Calcula o tipo de laboratório baseado no status
   */
  const getLaboratoryType = (laboratory: Laboratory): "Ativo" | "Inativo" => {
    return laboratory.isActive ? "Ativo" : "Inativo";
  };

  /**
   * Calcula estatísticas de uma lista de laboratórios
   */
  const calculateLaboratoryStats = useMemo(() => {
    return (laboratories: Laboratory[]) => {
      const totalLaboratories = laboratories.length;
      
      // Laboratórios ativos
      const activeLaboratories = laboratories.filter(laboratory => 
        laboratory.isActive
      ).length;
      
      // Simular laboratórios novos este mês (15% dos laboratórios)
      const newThisMonth = Math.floor(totalLaboratories * 0.15);
      
      // Laboratórios por cidade (top 3)
      const citiesCount = laboratories.reduce((acc, laboratory) => {
        const city = laboratory.address.city;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topCities = Object.entries(citiesCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([city, count]) => ({ city, count }));

      // Laboratórios inativos
      const inactiveLaboratories = totalLaboratories - activeLaboratories;

      return {
        totalLaboratories,
        activeLaboratories,
        inactiveLaboratories,
        newThisMonth,
        topCities
      };
    };
  }, []);

  /**
   * Filtra laboratórios baseado em critérios específicos
   */
  const filterLaboratories = useMemo(() => {
    return (laboratories: Laboratory[], filters: {
      status?: string;
      city?: string;
      search?: string;
    }) => {
      let filteredLaboratories = [...laboratories];

      // Filtro por status
      if (filters.status && filters.status !== 'todos') {
        filteredLaboratories = filteredLaboratories.filter(laboratory => {
          switch (filters.status) {
            case 'ativo':
              return laboratory.isActive;
            case 'inativo':
              return !laboratory.isActive;
            default:
              return true;
          }
        });
      }

      // Filtro por cidade
      if (filters.city && filters.city !== 'todos') {
        filteredLaboratories = filteredLaboratories.filter(laboratory => 
          laboratory.address.city.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }

      // Filtro por busca (nome, email, telefone)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredLaboratories = filteredLaboratories.filter(laboratory => 
          laboratory.name.toLowerCase().includes(searchTerm) ||
          laboratory.email.toLowerCase().includes(searchTerm) ||
          laboratory.phone.includes(searchTerm) ||
          laboratory.contactName.toLowerCase().includes(searchTerm)
        );
      }

      return filteredLaboratories;
    };
  }, []);

  /**
   * Ordena laboratórios por diferentes critérios
   */
  const sortLaboratories = useMemo(() => {
    return (laboratories: Laboratory[], sortBy: string = "name") => {
      const sorted = [...laboratories];
      
      switch (sortBy) {
        case "name":
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "city":
          return sorted.sort((a, b) => a.address.city.localeCompare(b.address.city));
        case "status":
          return sorted.sort((a, b) => {
            if (a.isActive === b.isActive) return 0;
            return a.isActive ? -1 : 1;
          });
        case "createdAt":
          return sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        default:
          return sorted;
      }
    };
  }, []);

  /**
   * Formata endereço completo do laboratório
   */
  const formatAddress = (address: Laboratory["address"]): string => {
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  /**
   * Calcula crescimento percentual de laboratórios
   */
  const calculateGrowthPercentage = (current: number, previous: number): string => {
    if (previous === 0) return "+100%";
    const growth = ((current - previous) / previous) * 100;
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  return {
    getLaboratoryType,
    calculateLaboratoryStats,
    filterLaboratories,
    sortLaboratories,
    formatAddress,
    calculateGrowthPercentage
  };
} 