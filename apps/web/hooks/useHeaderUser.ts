"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useUsers } from "@/hooks/useUsers";
import { useProfile } from "@/hooks/useProfile";

export function useHeaderUser() {
  const [cookieUserName, setCookieUserName] = useState("");
  const [cookieUserRole, setCookieUserRole] = useState("");
  const [cookieUserEmail, setCookieUserEmail] = useState("");
  const [cookieUserId, setCookieUserId] = useState("");

  const { getUserImageUrl } = useUsers();
  const { profile, isLoadingProfile } = useProfile();

  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";
    const email = Cookies.get("email") || "";
    const userId = Cookies.get("userId") || "";

    setCookieUserName(name);
    setCookieUserRole(role);
    setCookieUserEmail(email);
    setCookieUserId(userId);
  }, []);

  // Priorizar dados do profile sobre cookies, mas usar cookies como fallback
  const userName = profile?.name || cookieUserName || "Usuário";
  const userRole = profile?.role || cookieUserRole || "";
  const userEmail = profile?.email || cookieUserEmail || "";
  const userId = profile?._id || cookieUserId || "";
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