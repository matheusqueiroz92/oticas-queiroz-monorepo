import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Extrai o role do payload do JWT sem verificar assinatura.
 * Seguro para uso em redirects de UX — a verificação real ocorre no backend.
 */
function extractRoleFromToken(token: string): string | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/public",
];

const ADMIN_EMPLOYEE_ROUTES = [
  "/cash-register/open",
  "/cash-register/close",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas de redefinição de senha são sempre públicas
  if (pathname.startsWith("/auth/reset-password/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Redireciona raiz baseado na autenticação
  if (pathname === "/") {
    return token
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Rota protegida sem token
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Usuário autenticado tentando acessar rota de auth
  if (token && isPublicRoute && !pathname.startsWith("/public")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rotas restritas a admin/employee — extrai role do token JWT
  const isRestrictedRoute = ADMIN_EMPLOYEE_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isRestrictedRoute && token) {
    const role = extractRoleFromToken(token);
    if (role !== "admin" && role !== "employee") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public).*)"],
};
