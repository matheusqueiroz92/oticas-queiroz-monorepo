import axios from "axios";
import Cookies from "js-cookie";

export interface User {
  _id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333",
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
    if (error.response?.status === 401 && typeof window !== "undefined") {
      console.log("Erro 401 detectado, limpando cookies e redirecionando");

      // Limpar cookies de autenticação
      clearAuthCookies();

      // Redirecionar para a página de login somente se não estivermos já na página de login
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/auth/login")) {
        // Usar window.location para garantir o recarregamento da página
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
    console.log(
      `Enviando requisição de login para ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"}/api/auth/login`
    );

    const response = await api.post<LoginResponse>("/api/auth/login", {
      login,
      password,
    });

    console.log("Resposta completa da API:", response.data);

    // Se chegou aqui, o login foi bem-sucedido
    // Vamos salvar os cookies
    if (response.data.token) {
      // Definir cookie token
      Cookies.set("token", response.data.token, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Outros cookies
      if (response.data.user) {
        Cookies.set("userId", response.data.user._id, { expires: 1 });
        Cookies.set("name", response.data.user.name, { expires: 1 });
        Cookies.set("role", response.data.user.role, { expires: 1 });

        if (response.data.user.email) {
          Cookies.set("email", response.data.user.email, { expires: 1 });
        }
        if (response.data.user.cpf) {
          Cookies.set("cpf", response.data.user.cpf, { expires: 1 });
        }
      }

      console.log("Login bem-sucedido, cookies definidos");
    }

    return response.data;
  } catch (error) {
    console.error("Erro detalhado na requisição de login:", error);

    if (axios.isAxiosError(error)) {
      console.error("Detalhes da resposta de erro:", {
        status: error.response?.status,
        data: error.response?.data,
      });

      const message =
        error.response?.data?.message ||
        "Falha na autenticação. Verifique suas credenciais.";
      throw new Error(message);
    }
    throw new Error("Erro ao fazer login. Tente novamente.");
  }
};

// Função para limpar os cookies de autenticação
export const clearAuthCookies = () => {
  const allCookies = ["token", "name", "role", "userId", "email", "cpf"];

  for (const cookieName of allCookies) {
    Cookies.remove(cookieName);
  }

  console.log("Todos os cookies de autenticação foram removidos");
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = (): boolean => {
  return !!Cookies.get("token");
};

// Função para obter o papel (role) do usuário
export const getUserRole = (): string | undefined => {
  return Cookies.get("role");
};

// Função para redirecionar após o login
export const redirectAfterLogin = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/dashboard";
  }
};

// Função para redirecionar após o logout
export const redirectAfterLogout = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
};
