"use client";

import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isCustomer = user?.role === "customer";

  // Verifica se o usuário tem uma das funções especificadas
  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Verifica permissões específicas para certas funcionalidades
  const canViewEmployees = isAdmin;
  const canViewReports = isAdmin || isEmployee;
  const canManageLaboratories = isAdmin || isEmployee;
  const canViewLaboratories = isAdmin || isEmployee;

  // Permissões de cliente
  const canViewDebts = isCustomer;

  // Permissões gerais
  const canViewAllOrders = isAdmin || isEmployee;
  const canViewOwnOrders = isCustomer;

  // Permissões de produtos
  const canManageProducts = isAdmin || isEmployee;
  const canViewProducts = isAdmin || isEmployee;

  return {
    isAdmin,
    isEmployee,
    isCustomer,
    hasRole,
    canViewEmployees,
    canViewReports,
    canManageLaboratories,
    canViewLaboratories,
    canViewDebts,
    canViewAllOrders,
    canViewOwnOrders,
    canManageProducts,
    canViewProducts,
  };
}
