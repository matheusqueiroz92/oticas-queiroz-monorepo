"use client";

import { createContext } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
