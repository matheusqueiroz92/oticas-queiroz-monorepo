"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  formatCurrency,
} from "../app/services/productService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import { Product } from "@/app/types/product";
import { 
  getCorrectPrice, 
  normalizeProduct 
} from "../app/utils/product-utils";

interface ProductFilters {
  search?: string;
  page?: number;
  limit?: number;
  productType?: "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame";
  minSellPrice?: number;
  maxSellPrice?: number;
  brand?: string;
  lensType?: string;
  typeFrame?: string;
  color?: string;
  shape?: string;
  reference?: string;
  modelSunglasses?: string;
}

export function useProducts() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [productId, setProductId] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar produtos paginados com filtros
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.PAGINATED(currentPage, filters),
    queryFn: () => getAllProducts({ ...filters, page: currentPage, limit: 10 }),
    placeholderData: (prevData) => prevData,
  });

  // Query para buscar um produto específico
  const {
    data: productData,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.DETAIL(productId as string),
    queryFn: () => getProductById(productId as string),
    enabled: !!productId,
  });

  // Dados normalizados da query
  const products = data?.products || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalProducts = data?.pagination?.total || 0;

  // Mutation para criar produto
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });

      return newProduct;
    },
    onError: (error: unknown) => {
      console.error("Erro ao criar produto:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Não foi possível criar o produto.",
      });
    },
  });

  // Mutation para atualizar produto
  const updateProductMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateProduct(id, formData),
    onSuccess: (updatedProduct) => {
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCTS.DETAIL(updatedProduct._id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCTS.PAGINATED(),
      });

      return updatedProduct;
    },
    onError: (error: unknown, variables) => {
      console.error(`Erro ao atualizar produto com ID ${variables.id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o produto.",
      });
    },
  });

  // Mutation para deletar produto
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });

      return true;
    },
    onError: (error: unknown, id) => {
      console.error(`Erro ao excluir produto com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o produto.",
      });
      return false;
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => {
      const formData = new FormData();
      formData.append("stock", stock.toString());
      return updateProduct(id, formData);
    },
    onSuccess: (updatedProduct) => {
      toast({
        title: "Estoque atualizado",
        description: "O estoque do produto foi atualizado com sucesso.",
      });
  
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCTS.DETAIL(updatedProduct._id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCTS.PAGINATED(),
      });
  
      return updatedProduct;
    },
    onError: (error: unknown, variables) => {
      console.error(`Erro ao atualizar estoque do produto com ID ${variables.id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o estoque do produto.",
      });
    },
  });
  
  // Função para atualizar o estoque
  const handleUpdateStock = (id: string, stock: number) => {
    return updateStockMutation.mutateAsync({ id, stock });
  };


  // Função para buscar um produto por ID
  const fetchProductById = (id: string) => {
    setProductId(id);
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: ProductFilters) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Função para navegar para a página de detalhes do produto
  const navigateToProductDetails = (id: string) => {
    router.push(`/products/${id}`);
  };

  // Função para navegar para a página de criação de produto
  const navigateToCreateProduct = () => {
    router.push("/products/new");
  };

  // Função para navegar para a página de edição de produto
  const navigateToEditProduct = (id: string) => {
    router.push(`/products/${id}/edit`);
  };

  // Funções expostas pelo hook que utilizam as mutations
  const handleCreateProduct = (formData: FormData) => {
    return createProductMutation.mutateAsync(formData);
  };

  const handleUpdateProduct = (id: string, formData: FormData) => {
    return updateProductMutation.mutateAsync({ id, formData });
  };

  const handleDeleteProduct = (id: string) => {
    return deleteProductMutation.mutateAsync(id);
  };

  /**
   * Busca um produto com detalhes consistentes
   */
  const fetchProductWithConsistentDetails = async (id: string): Promise<Product | null> => {
    try {
      const product = await getProductById(id);
      if (!product) return null;
      
      // Usamos as-any como intermediário para evitar erros de tipo
      return normalizeProduct(product as any);
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  return {
    // Dados e estado
    products,
    currentProduct: productData as Product | null,
    loading: isLoading || isProductLoading,
    isUpdatingStock: updateStockMutation.isPending,
    error: error || productError,
    totalPages,
    totalProducts,
    filters,
    currentPage,

    // Mutações e seus estados
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,

    // Ações
    setCurrentPage,
    updateFilters,
    fetchProductById,
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleUpdateStock,
    navigateToProductDetails,
    navigateToCreateProduct,
    navigateToEditProduct,
    formatCurrency,
    refetch,
    
    // Funções importadas
    getCorrectPrice,
    normalizeProduct,
    fetchProductWithConsistentDetails
  };
}