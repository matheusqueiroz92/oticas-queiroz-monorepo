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
    const loadUserFromCookies = () => {
      try {
        console.log("=== CARREGANDO USUÁRIO DOS COOKIES ===");
        
        // Tentar várias formas de obter os cookies
        const getCookieValue = (name: string) => {
          // Método 1: js-cookie
          let value = Cookies.get(name);
          if (value) return decodeURIComponent(value);
          
          // Método 2: document.cookie
          const cookieString = document.cookie;
          const cookies = cookieString.split(';');
          for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name && cookieValue) {
              return decodeURIComponent(cookieValue);
            }
          }
          
          return null;
        };

        const role = getCookieValue("role");
        const name = getCookieValue("name");
        const userId = getCookieValue("userId");
        const email = getCookieValue("email");
        const cpf = getCookieValue("cpf");

        console.log("Cookies extraídos:");
        console.log("- Role:", role);
        console.log("- Name:", name);
        console.log("- UserId:", userId);
        console.log("- Email:", email);
        console.log("- CPF:", cpf);

        // Verificar se temos pelo menos role e userId (mínimo necessário)
        if (role && userId) {
          const userData = {
            _id: userId,
            name: name || "Usuário",
            role: role as any,
            email: email || "",
            cpf: cpf || "",
          };
          
          console.log("✅ Usuário carregado dos cookies:", userData);
          setUser(userData);
          setIsLoading(false);
          return true;
        } else {
          console.log("❌ Cookies insuficientes - role:", role, "userId:", userId);
          setIsLoading(false);
          return false;
        }
      } catch (error) {
        console.error("❌ Erro ao carregar usuário dos cookies:", error);
        setIsLoading(false);
        return false;
      }
    };

    const token = Cookies.get("token");
    
    if (token) {
      console.log("Token encontrado, tentando carregar da API...");
      // Tentar carregar o usuário da API
      api
        .get("/api/users/profile")
        .then((response) => {
          console.log("✅ Usuário carregado da API:", response.data);
          setUser(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("❌ Erro ao carregar perfil da API:", error);
          // Se falhar, tenta carregar do cookie
          loadUserFromCookies();
        });
    } else {
      console.log("Sem token, carregando dos cookies...");
      loadUserFromCookies();
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
