"use client";

import { useCallback, useState, useEffect } from "react";
import {
  api,
  clearAuthCookies,
  redirectAfterLogout,
  type User,
} from "../app/_services/authService";
import Cookies from "js-cookie";
import { AuthContext } from "../contexts/authContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do usuário da API ou do cookie no carregamento inicial
  useEffect(() => {
    const token = Cookies.get("token");

    const loadUserFromCookies = () => {
      try {
        const role = Cookies.get("role");
        const name = Cookies.get("name");
        const userId = Cookies.get("userId");

        if (role && name && userId) {
          setUser({
            _id: userId,
            name,
            role,
            // Outros campos podem estar indisponíveis no cookie
            email: Cookies.get("email") || "",
            cpf: Cookies.get("cpf") || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar usuário dos cookies:", error);
        clearAuthCookies();
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      // Tentar carregar o usuário da API
      api
        .get("/api/users/profile")
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Erro ao carregar perfil do usuário:", error);
          // Se falhar, tenta carregar do cookie
          loadUserFromCookies();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Não há token, não está autenticado
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (login: string, password: string): Promise<void> => {
      // Não implementamos aqui porque vamos usar a função direta no Login
      console.log(
        "AuthProvider.signIn não implementado - use loginWithCredentials diretamente"
      );
    },
    []
  );

  const signOut = useCallback(() => {
    clearAuthCookies();
    setUser(null);
    redirectAfterLogout();
  }, []);

  const hasPermission = useCallback(
    (requiredRoles: string[]) => {
      if (!user) return false;
      return requiredRoles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
