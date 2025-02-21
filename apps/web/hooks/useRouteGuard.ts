"use client";

import { useAuth } from "./useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRouteGuard(allowedRoles: string[]) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, router, allowedRoles]);

  // O componente só deve ser renderizado se o usuário estiver autenticado
  // e tiver as permissões necessárias
  const hasPermission = user && allowedRoles.includes(user.role);

  return hasPermission;
}
