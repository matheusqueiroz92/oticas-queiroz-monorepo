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
  const canViewReports = isAdmin;
  const canManageLaboratories = isAdmin; // Apenas admin pode gerenciar (adicionar/editar/excluir)
  const canViewLaboratories = isAdmin || isEmployee; // Admin e employee podem visualizar

  // Permissões de cliente
  const canViewDebts = isCustomer;

  // Permissões gerais
  const canViewAllOrders = isAdmin || isEmployee;
  const canViewOwnOrders = isCustomer;

  // Permissões de produtos
  const canManageProducts = isAdmin;
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
