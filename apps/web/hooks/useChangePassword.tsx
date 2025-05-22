"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface UseChangePasswordReturn {
  changePassword: (data: ChangePasswordData) => Promise<void>;
  isChanging: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

export function useChangePassword(): UseChangePasswordReturn {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await api.post(API_ROUTES.AUTH.CHANGE_PASSWORD, data);
      return response.data;
    },
    onSuccess: () => {
      setError(null);
      setSuccess("Senha alterada com sucesso!");
      
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
      setSuccess(null);
      
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao alterar a senha. Tente novamente.";
      
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: errorMessage,
      });
    },
  });

  const changePassword = async (data: ChangePasswordData) => {
    setError(null);
    setSuccess(null);
    return changePasswordMutation.mutateAsync(data);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    changePassword,
    isChanging: changePasswordMutation.isPending,
    error,
    success,
    clearMessages,
  };
}