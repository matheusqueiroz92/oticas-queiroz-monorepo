import axios from "axios";
import Cookies from "js-cookie";
import type { Product } from "../types/product";

export interface ProductsResponse {
  products: Product[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchProducts = async (
  page = 1,
  limit = 10,
  search?: string
): Promise<ProductsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await api.get<ProductsResponse>(`/api/products?${params}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    throw new Error("Falha ao carregar produtos");
  }
};
