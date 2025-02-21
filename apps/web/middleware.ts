import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const { pathname } = request.nextUrl;

  // Se estiver na rota raiz, redireciona baseado na autenticação
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se o usuário não está logado e tenta acessar uma rota protegida
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Se o usuário está logado e tenta acessar uma rota pública
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
