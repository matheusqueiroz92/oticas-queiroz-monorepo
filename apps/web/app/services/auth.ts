import axios from "axios";
import Cookies from "js-cookie";
import type { Product } from "../types/product"; // Importe o tipo Product

// Definindo o tipo de retorno da função login
type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type ApiResponse = {
  products: Product[]; // A resposta da API contém um array de produtos
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

// Função para fazer login
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
    {
      email,
      password,
    }
  );
  return response.data;
};

// Função para buscar os produtos (com autenticação)
export const fetchProducts = async (): Promise<ApiResponse> => {
  const token = Cookies.get("token"); // Busca o token dos cookies
  const response = await axios.get<ApiResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/products`,
    {
      headers: {
        Authorization: `Bearer ${token}`, // Adiciona o token no cabeçalho
      },
    }
  );
  return response.data; // Retorna o objeto completo da API
};
