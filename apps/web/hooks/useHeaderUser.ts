"use client";

import { useUsers } from "@/hooks/useUsers";
import { useProfile } from "@/hooks/profile/useProfile";

export function useHeaderUser() {
  const { getUserImageUrl } = useUsers();
  const { profile, isLoadingProfile } = useProfile();

  const userName = profile?.name || "Usuário";
  const userRole = profile?.role || "";
  const userEmail = profile?.email || "";
  const userId = profile?._id || "";
  const userImage = profile?.image ? getUserImageUrl(profile.image) : "";

  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "U";
    
    return name
      .trim()
      .split(" ")
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "employee":
        return "Funcionário";
      case "customer":
        return "Cliente";
      default:
        return "Usuário";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "employee":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "customer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return {
    userName,
    userRole,
    userEmail,
    userId,
    userImage,
    isLoadingProfile,
    getInitials,
    getRoleLabel,
    getRoleColor,
  };
} 