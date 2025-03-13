/**
 * Garante que uma URL tenha o prefixo /api/ se não for uma rota de autenticação
 */
export function ensureApiPrefix(url: string): string {
  // Se já começar com /api/ ou /auth/, não alteramos
  if (url.startsWith("/api/") || url.startsWith("/auth/")) {
    return url;
  }

  // Caso contrário, adiciona o prefixo /api
  return `/api${url.startsWith("/") ? url : `/${url}`}`;
}
