"use client";

import { useCallback, useState, useEffect } from "react";
import { api, login } from "../app/services/auth";
import Cookies from "js-cookie";
import { AuthContext } from "../contexts/authContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      api
        .get<User>("/api/auth/me")
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          Cookies.remove("token");
          Cookies.remove("role");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await login(email, password);

      const { token, user } = response;

      Cookies.set("token", token, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      Cookies.set("role", user.role, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      setUser(user);
    } catch (error) {
      console.error("Erro durante login:", error);
      throw error;
    }
  }, []);

  const signOut = useCallback(() => {
    Cookies.remove("token");
    Cookies.remove("role");
    setUser(null);
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
