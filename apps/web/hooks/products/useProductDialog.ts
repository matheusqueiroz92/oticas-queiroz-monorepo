"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { createProduct, updateProduct } from "@/app/_services/productService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";

export function useProductDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await createProduct(formData);
      return response;
    },
    onSuccess: () => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.PAGINATED() });
      
      toast({
        title: "Produto cadastrado",
        description: "O produto foi cadastrado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar produto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar produto",
        description: error.response?.data?.message || "Ocorreu um erro ao cadastrar o produto",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      const response = await updateProduct(id, formData);
      return response;
    },
    onSuccess: (data) => {
      // Atualizar o cache com os novos dados
      queryClient.setQueryData(QUERY_KEYS.PRODUCTS.DETAIL(data._id), data);
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.PAGINATED() });
      
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar produto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar produto",
        description: error.response?.data?.message || "Ocorreu um erro ao atualizar o produto",
      });
    },
  });

  return {
    createProductMutation,
    updateProductMutation,
  };
} 