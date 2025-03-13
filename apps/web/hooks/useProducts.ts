import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  formatCurrency,
} from "../app/services/productService";
import type { Product } from "@/app/types/product";

interface ProductFilters {
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filters, setFilters] = useState<ProductFilters>({});

  const router = useRouter();
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar parâmetros de busca
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
      };

      // Buscar todos os produtos
      const result = await getAllProducts(params);

      setProducts(result.products);
      setTotalPages(result.pagination.totalPages || 1);
      setTotalProducts(result.pagination.total || result.products.length);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setError("Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchProductById = async (id: string): Promise<Product | null> => {
    try {
      setLoading(true);
      setError(null);

      const product = await getProductById(id);

      if (product) {
        setCurrentProduct(product);
        return product;
      }
      setError("Produto não encontrado.");
      return null;
    } catch (error) {
      console.error(`Erro ao buscar produto com ID ${id}:`, error);
      setError("Não foi possível carregar os detalhes do produto.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (
    formData: FormData
  ): Promise<Product | null> => {
    try {
      setLoading(true);
      const newProduct = await createProduct(formData);

      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso.",
      });

      return newProduct;
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Não foi possível criar o produto.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (
    id: string,
    formData: FormData
  ): Promise<Product | null> => {
    try {
      setLoading(true);
      const updatedProduct = await updateProduct(id, formData);

      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });

      if (currentProduct?._id === id) {
        setCurrentProduct(updatedProduct);
      }

      return updatedProduct;
    } catch (error) {
      console.error(`Erro ao atualizar produto com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o produto.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteProduct(id);

      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });

      if (currentProduct?._id === id) {
        setCurrentProduct(null);
      }

      fetchProducts();
      return true;
    } catch (error) {
      console.error(`Erro ao excluir produto com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o produto.",
      });
      return false;
    } finally {
      setLoading(false);
    }
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

  return {
    products,
    currentProduct,
    loading,
    error,
    currentPage,
    totalPages,
    totalProducts,
    filters,
    setCurrentPage,
    updateFilters,
    fetchProducts,
    fetchProductById,
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    navigateToProductDetails,
    navigateToCreateProduct,
    navigateToEditProduct,
    formatCurrency,
  };
}
