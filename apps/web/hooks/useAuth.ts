import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export const useAuth = (allowedRoles: string[]) => {
  const router = useRouter();
  const role = Cookies.get("role");

  useEffect(() => {
    if (!role || !allowedRoles.includes(role)) {
      router.push("/dashboard");
    }
  }, [role, router, allowedRoles]);
};
