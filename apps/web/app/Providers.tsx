"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

// Configuração do cliente com opções globais
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Desativamos o refetch ao focar na janela por padrão
      staleTime: 5 * 60 * 1000, // 5 minutos - consideramos os dados "stale" após 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos - mantemos no cache por 10 minutos (substituiu cacheTime)
      retry: false, // Uma tentativa de retry em caso de falha
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Uma tentativa de retry em caso de falha
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="oticas-queiroz-theme"
      >
      {children}
      </ThemeProvider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
