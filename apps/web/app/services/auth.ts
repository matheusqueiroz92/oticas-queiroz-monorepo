import axios from "axios";
import Cookies from "js-cookie";

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
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
      // Token expirado, redirecionar para a página de login
      clearAuthCookies();
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// Função para salvar os dados de autenticação nos cookies
export const saveAuthData = (data: LoginResponse) => {
  // Salvando token
  Cookies.set("token", data.token, { expires: 7 }); // Expira em 7 dias

  // Salvando dados do usuário
  Cookies.set("userId", data.user._id, { expires: 7 });
  Cookies.set("userName", data.user.name, { expires: 7 });
  Cookies.set("userEmail", data.user.email, { expires: 7 });
  Cookies.set("userRole", data.user.role, { expires: 7 });
};

// Função para limpar os cookies de autenticação
export const clearAuthCookies = () => {
  Cookies.remove("token");
  Cookies.remove("userId");
  Cookies.remove("userName");
  Cookies.remove("userEmail");
  Cookies.remove("userRole");
};

// Função para obter os dados do usuário logado dos cookies
export const getLoggedUser = () => {
  const id = Cookies.get("userId");
  const name = Cookies.get("userName");
  const email = Cookies.get("userEmail");
  const role = Cookies.get("userRole");

  if (!id || !name || !email || !role) return null;

  return {
    id,
    name,
    email,
    role,
  };
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    });

    // Salvar os dados nos cookies
    saveAuthData(response.data);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Erro ao fazer login");
    }
    throw error;
  }
};

export const logout = () => {
  clearAuthCookies();
  window.location.href = "/auth/login";
};

// Verificar se o usuário está autenticado
export const isAuthenticated = (): boolean => {
  return !!Cookies.get("token");
};
