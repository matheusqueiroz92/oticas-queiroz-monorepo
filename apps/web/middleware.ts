import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const role = request.cookies.get("role");
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota de redefinição de senha
  const isResetPasswordRoute = pathname.startsWith("/auth/reset-password/");

  // Se for uma rota de redefinição de senha, sempre permitir o acesso
  if (isResetPasswordRoute) {
    console.log(
      "Middleware: Permitindo acesso à rota de redefinição de senha:",
      pathname
    );
    return NextResponse.next();
  }

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
    "/public", // Nova pasta para conteúdos públicos
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se o usuário não está logado e tenta acessar uma rota protegida
  if (!token && !isPublicRoute) {
    console.log(
      "Middleware: Redirecionando para login, rota protegida:",
      pathname
    );
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Se o usuário está logado e tenta acessar uma rota pública de autenticação
  // IMPORTANTE: não redirecionamos para rotas públicas que não são de autenticação
  if (token && isPublicRoute && !pathname.startsWith("/public")) {
    console.log(
      "Middleware: Redirecionando usuário autenticado para dashboard:",
      pathname
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rotas que requerem permissões específicas (admin ou employee)
  const restrictedRoutes = [
    "/cash-register/open",
    "/cash-register/close",
  ];

  const isRestrictedRoute = restrictedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se está tentando acessar uma rota restrita, verificar o role
  if (isRestrictedRoute && token) {
    const userRole = role?.value;
    
    // Se não for admin nem employee, redirecionar para dashboard
    if (userRole !== "admin" && userRole !== "employee") {
      console.log(
        "Middleware: Redirecionando usuário sem permissão para dashboard:",
        pathname,
        "Role:",
        userRole
      );
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public).*)"],
};