"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { useUsers } from "@/hooks/useUsers";

export function useCustomers() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { getUserImageUrl } = useUsers();

  // Query para listar todos os clientes
  const {
    data: customers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.CUSTOMERS(search),
    queryFn: async () => {
      try {
        const response = await api.get(API_ROUTES.USERS.CUSTOMERS, {
          params: { search: search || undefined },
        });
        return response.data;
      } catch (error: any) {
        // Se for um erro 404 específico de "nenhum cliente encontrado", retorna array vazio
        if (
          error.response?.status === 404 &&
          error.response?.data?.message ===
            "Nenhum usuário com role 'customer' encontrado"
        ) {
          return [];
        }
        throw error;
      }
    },
  });

  // Funções de navegação
  const navigateToCustomerDetails = (id: string) => {
    router.push(`/customers/${id}`);
  };

  const navigateToNewCustomer = () => {
    router.push("/customers/new");
  };

  return {
    customers,
    isLoading,
    error: error ? (error as Error).message : null,
    search,
    setSearch,
    refetch,
    navigateToCustomerDetails,
    navigateToNewCustomer,
    getUserImageUrl,
  };
}
