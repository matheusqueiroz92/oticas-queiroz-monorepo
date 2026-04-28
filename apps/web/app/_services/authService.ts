import axios from "axios";
import Cookies from "js-cookie";
import { API_ROUTES } from "../_constants/api-routes";

export interface User {
  _id: string;
  name: string;
  email: string;
  cpf?: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Definir a URL base da API
// Em produção, usa URLs relativas (vazio) para que o NGINX faça o proxy
// Em desenvolvimento, usa http://localhost:3333
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3333');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamos erros 401 somente se não estivermos em páginas relacionadas à autenticação
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isAuthRelatedPage =
        currentPath.includes("/auth/login") ||
        currentPath.includes("/auth/forgot-password") ||
        currentPath.includes("/auth/reset-password");

      // Só redirecionamos em caso de 401 em páginas protegidas
      if (!isAuthRelatedPage) {
        // Limpar cookies de autenticação
        clearAuthCookies();

        // Redirecionar para página de login
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export const loginWithCredentials = async (
  login: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, {
      login,
      password,
    });

    if (response.data.token) {
      Cookies.set("token", response.data.token, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        "Falha na autenticação. Verifique suas credenciais.";
      throw new Error(message);
    }
    throw new Error("Erro ao fazer login. Tente novamente.");
  }
};

// Funções para recuperação de senha

/**
 * Solicita o envio de um email de recuperação de senha
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        "Falha ao enviar o email de recuperação. Tente novamente.";
      throw new Error(message);
    }
    throw new Error("Erro ao solicitar recuperação de senha. Tente novamente.");
  }
};

/**
 * Valida se um token de redefinição de senha é válido
 */
export const validateResetToken = async (token: string): Promise<boolean> => {
  try {
    // Criamos uma instância separada do axios para não usar interceptors que possam redirecionar
    const validationApi = axios.create({
      baseURL: API_URL,
      headers: { "Content-Type": "application/json" },
    });

    const response = await validationApi.get(
      API_ROUTES.AUTH.VALIDATE_RESET_TOKEN(token)
    );
    return response.data.valid === true;
  } catch {
    return false;
  }
};

/**
 * Redefine a senha do usuário usando um token de recuperação
 */
export const resetPassword = async (
  token: string,
  password: string
): Promise<void> => {
  try {
    // Usando axios diretamente para evitar interceptors que possam causar redirecionamentos
    const resetApi = axios.create({
      baseURL: API_URL,
      headers: { "Content-Type": "application/json" },
    });

    await resetApi.post(API_ROUTES.AUTH.RESET_PASSWORD, { token, password });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        "Falha ao redefinir a senha. O token pode ter expirado.";
      throw new Error(message);
    }
    throw new Error("Erro ao redefinir a senha. Tente novamente.");
  }
};

export const clearAuthCookies = () => {
  Cookies.remove("token");
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = (): boolean => {
  return !!Cookies.get("token");
};

export const redirectAfterLogout = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
};
