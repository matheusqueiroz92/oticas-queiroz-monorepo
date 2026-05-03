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

  useEffect(() => {
    const token = Cookies.get("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<User>("/api/users/profile")
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        // Token inválido ou expirado — limpa o cookie e força re-login
        clearAuthCookies();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signIn = useCallback(async (_login: string, _password: string): Promise<void> => {
    // Login é feito diretamente via loginWithCredentials no componente de login
  }, []);

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
