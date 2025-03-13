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

// Definir a URL base da API e registrar no console para diagnóstico
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
console.log(`API configurada para: ${API_URL}`);

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

    // Verificar e corrigir URLs
    if (config.url) {
      // Garantir que a URL comece com barra
      if (!config.url.startsWith("/")) {
        config.url = `/${config.url}`;
      }

      // Log apenas em ambiente de desenvolvimento
      if (process.env.NODE_ENV === "development") {
        console.log(`Requisição para: ${config.baseURL}${config.url}`);
      }
    }

    return config;
  },
  (error) => {
    console.error("Erro na preparação da requisição:", error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detalhado do erro para diagnóstico
    if (axios.isAxiosError(error)) {
      const errorDetails = {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        data: error.response?.data,
      };

      // Log específico para erros 404
      if (error.response?.status === 404) {
        console.warn(`ERRO 404: URL não encontrada - ${error.config?.url}`);
        console.warn("Detalhes do erro 404:", errorDetails);
      } else {
        console.error(
          `Erro ${error.response?.status || "de rede"} na API:`,
          errorDetails
        );
      }

      // Tratamos erros 401 somente se não estivermos em páginas relacionadas à autenticação
      if (error.response?.status === 401 && typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isAuthRelatedPage =
          currentPath.includes("/auth/login") ||
          currentPath.includes("/auth/forgot-password") ||
          currentPath.includes("/auth/reset-password");

        // Só redirecionamos em caso de 401 em páginas protegidas
        if (!isAuthRelatedPage) {
          console.log("Erro 401 detectado em página protegida, redirecionando");

          // Limpar cookies de autenticação
          clearAuthCookies();

          // Redirecionar para página de login
          window.location.href = "/auth/login";
        } else {
          console.log(
            "Erro 401 em página de autenticação, sem redirecionamento"
          );
        }
      }
    } else {
      console.error("Erro não-Axios na resposta:", error);
    }

    return Promise.reject(error);
  }
);

// Função auxiliar para verificar disponibilidade da API
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    // Tentar acessar um endpoint de health check ou similar
    await axios.get(`${API_URL}/health`, { timeout: 5000 });
    console.log("API está disponível.");
    return true;
  } catch (error) {
    console.error("API não está disponível:", error);
    return false;
  }
};

// Função para teste de endpoints
export const testEndpoint = async (
  endpoint: string
): Promise<{
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}> => {
  try {
    const response = await api.get(endpoint);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error.response?.status,
        error: error.message,
      };
    }
    return {
      success: false,
      error: String(error),
    };
  }
};

// O resto do arquivo permanece o mesmo...
export const loginWithCredentials = async (
  login: string,
  password: string
): Promise<LoginResponse> => {
  try {
    console.log(`Enviando requisição de login para ${API_URL}/api/auth/login`);

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

// Funções para recuperação de senha

/**
 * Solicita o envio de um email de recuperação de senha
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post("/api/auth/forgot-password", { email });
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
      `/api/auth/validate-reset-token/${token}`
    );
    return response.data.valid === true;
  } catch (error) {
    console.error("Erro ao validar token:", error);
    // Exibir detalhes para facilitar a depuração
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
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

    await resetApi.post("/api/auth/reset-password", { token, password });
    console.log("Senha redefinida com sucesso");
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
      });

      const message =
        error.response?.data?.message ||
        "Falha ao redefinir a senha. O token pode ter expirado.";
      throw new Error(message);
    }
    throw new Error("Erro ao redefinir a senha. Tente novamente.");
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
