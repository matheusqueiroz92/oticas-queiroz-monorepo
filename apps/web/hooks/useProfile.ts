"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/app/services/authService";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { API_ROUTES } from "@/app/constants/api-routes";
import type { User } from "@/app/types/user";

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export function useProfile() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar dados do perfil
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: QUERY_KEYS.AUTH.USER_PROFILE,
    queryFn: async () => {
      const response = await api.get(API_ROUTES.AUTH.PROFILE);
      return response.data as User;
    },
  });

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao alterar a senha. Tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    },
  });

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.put(API_ROUTES.AUTH.PROFILE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data as User;
    },
    onSuccess: (data) => {
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });

      // Invalidar query do perfil
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER_PROFILE });

      return data;
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao atualizar o perfil. Tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });

      throw error;
    },
  });

  // Funções expostas pelo hook
  const handleChangePassword = (data: ChangePasswordData) => {
    return changePasswordMutation.mutateAsync(data);
  };

  const handleUpdateProfile = (formData: FormData) => {
    return updateProfileMutation.mutateAsync(formData);
  };

  // Obter URL da imagem do usuário
  const getUserImageUrl = (imagePath?: string): string => {
    if (!imagePath) return "";

    // Verifica se a URL já é absoluta
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // Construir o caminho correto para as imagens de usuário
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

    // Se o caminho já contém 'images/users', não adicione novamente
    if (imagePath.includes("images/users")) {
      return `${baseUrl}/${imagePath.startsWith("/") ? imagePath.substring(1) : imagePath}`;
    }

    // Caso contrário, assume que é apenas o nome do arquivo e adiciona o caminho completo
    return `${baseUrl}/images/users/${imagePath}`;
  };

  return {
    // Dados e estados
    profile,
    isLoadingProfile,
    profileError,

    // Mutations e seus estados
    isChangingPassword: changePasswordMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,

    // Ações
    handleChangePassword,
    handleUpdateProfile,
    refetchProfile,
    getUserImageUrl,
  };
}
