import { useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../app/types/user";

export function usePermissions() {
  const { user, hasPermission } = useAuth();

  const can = useCallback(
    (roles: UserRole[]) => {
      return hasPermission(roles);
    },
    [hasPermission]
  );

  const isAdmin = useCallback(() => {
    return user?.role === "admin";
  }, [user]);

  const isEmployee = useCallback(() => {
    return user?.role === "employee";
  }, [user]);

  const isCustomer = useCallback(() => {
    return user?.role === "customer";
  }, [user]);

  return {
    can,
    isAdmin,
    isEmployee,
    isCustomer,
  };
}
