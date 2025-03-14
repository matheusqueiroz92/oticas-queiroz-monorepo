"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { useUsers } from "@/hooks/useUsers";

export function useEmployees() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { getUserImageUrl } = useUsers();

  // Query para listar todos os funcionários
  const {
    data: employees = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.EMPLOYEES(search),
    queryFn: async () => {
      try {
        const response = await api.get(API_ROUTES.USERS.BASE, {
          params: {
            role: "employee",
            search: search || undefined,
          },
        });
        return response.data;
      } catch (error: any) {
        // Se for um erro 404 específico de "nenhum funcionário encontrado", retorna array vazio
        if (
          error.response?.status === 404 &&
          error.response?.data?.message ===
            "Nenhum usuário com role 'employee' encontrado"
        ) {
          return [];
        }
        throw error;
      }
    },
  });

  // Funções de navegação
  const navigateToEmployeeDetails = (id: string) => {
    router.push(`/employees/${id}`);
  };

  const navigateToNewEmployee = () => {
    router.push("/employees/new");
  };

  return {
    employees,
    isLoading,
    error: error ? (error as Error).message : null,
    search,
    setSearch,
    refetch,
    navigateToEmployeeDetails,
    navigateToNewEmployee,
    getUserImageUrl,
  };
}
