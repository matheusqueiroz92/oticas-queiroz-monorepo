"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { api } from "@/app/services/authService";
import { API_ROUTES } from "@/app/constants/api-routes";
import { QUERY_KEYS } from "@/app/constants/query-keys";

export function useUsers() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Função para buscar usuário por ID
  const getUserById = async (id: string) => {
    try {
      const response = await api.get(API_ROUTES.USERS.BY_ID(id));
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar usuário"
      );
    }
  };

  // Query para buscar um usuário específico
  const useUserQuery = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.USERS.DETAIL(id),
      queryFn: () => getUserById(id),
      enabled: !!id,
    });
  };

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post(API_ROUTES.AUTH.REGISTER, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const role = variables.get("role") as string;
      toast({
        title:
          role === "customer" ? "Cliente cadastrado" : "Funcionário cadastrado",
        description:
          role === "customer"
            ? "O cliente foi cadastrado com sucesso."
            : "O funcionário foi cadastrado com sucesso.",
      });

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      if (role === "customer") {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.CUSTOMERS(),
        });
        router.push("/customers");
      } else {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.USERS.EMPLOYEES(),
        });
        router.push("/employees");
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar usuário",
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao cadastrar o usuário",
      });
    },
  });

  // Função para obter URL da imagem do usuário
  const getUserImageUrl = (imagePath?: string): string => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

    if (imagePath.includes("images/users")) {
      return `${baseUrl}/${imagePath.startsWith("/") ? imagePath.substring(1) : imagePath}`;
    }

    return `${baseUrl}/images/users/${imagePath}`;
  };

  return {
    getUserById,
    useUserQuery,
    createUserMutation,
    getUserImageUrl,
  };
}
