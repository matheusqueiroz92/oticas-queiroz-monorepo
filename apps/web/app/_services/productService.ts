import { api } from "./authService";
import { Product } from "../_types/product";

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

/**
 * Busca todos os produtos com opções de filtro
 */
export async function getAllProducts(
  filters: ProductFilters = {}
): Promise<ProductsResponse> {
  try {
    const response = await api.get<ProductsResponse>("/api/products", {
      params: filters,
    });
    return response.data;
  } catch (error: any) {
    // Verificar se é o erro específico de "Nenhum produto encontrado"
    if (error.response?.status === 404 && error.response?.data?.message === "Nenhum produto encontrado") {
      // Retornar uma resposta vazia ao invés de lançar erro
      return {
        products: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 15,
          total: 0,
          totalPages: 0,
        },
      };
    }
    
    console.error("Erro ao buscar produtos:", error);
    throw new Error("Falha ao carregar produtos");
  }
}

/**
 * Busca um produto pelo ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar produto com ID ${id}:`, error);
    return null;
  }
}

/**
 * Cria um novo produto
 */
export async function createProduct(data: FormData): Promise<Product> {
  try {
    const response = await api.post<Product>("/api/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    throw error;
  }
}

/**
 * Atualiza um produto existente
 */
export async function updateProduct(
  id: string,
  data: FormData
): Promise<Product> {
  try {
    const response = await api.put<Product>(`/api/products/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar produto com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Exclui um produto
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await api.delete(`/api/products/${id}`);
  } catch (error) {
    console.error(`Erro ao excluir produto com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Formata um valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Busca o histórico de estoque de um produto
 */
export async function getProductStockHistory(productId: string): Promise<any[]> {
  try {
    const response = await api.get(`/api/products/${productId}/stock-history`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar histórico de estoque do produto ${productId}:`, error);
    return [];
  }
}

/**
 * Retorna o nome amigável do tipo de produto
 */
export function getProductTypeName(productType: string): string {
  const typeNames: Record<string, string> = {
    lenses: "Lentes",
    clean_lenses: "Lentes de Limpeza",
    prescription_frame: "Armação de Grau",
    sunglasses_frame: "Armação de Sol",
  };
  
  return typeNames[productType] || productType;
}