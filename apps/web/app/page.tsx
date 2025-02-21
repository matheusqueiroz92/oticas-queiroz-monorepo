"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse">Redirecionando...</div>
    </div>
  );
}
