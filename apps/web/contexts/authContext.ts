"use client";

import { createContext, useContext } from "react";

export interface UserLogged {
  _id: string;
  name: string;
  cpf: string;
  email: string;
  role: string;
}

export interface AuthContextData {
  user: UserLogged | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => void;
  hasPermission: (requiredRoles: string[]) => boolean;
}

const initialContext: AuthContextData = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signOut: () => {},
  hasPermission: () => false,
};

export const AuthContext = createContext<AuthContextData>(initialContext);

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
};
