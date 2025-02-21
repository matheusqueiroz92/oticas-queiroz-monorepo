import axios from "axios";
import Cookies from "js-cookie";

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      Cookies.remove("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Erro ao fazer login");
    }
    throw error;
  }
};
