"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { DashboardHeader } from "../../components/DashBoardHeader";
import { AdminPanel } from "../../components/roles/AdminPanel";
import { EmployeePanel } from "../../components/roles/EmployeePanel";
import { CustomerPanel } from "../../components/roles/CustomerPanel";

export default function Dashboard() {
  const router = useRouter();
  const token = Cookies.get("token");
  const userRole = Cookies.get("role"); // Supondo que o role é armazenado no cookie após o login

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="p-6">
        {userRole === "admin" && <AdminPanel />}
        {userRole === "employee" && <EmployeePanel />}
        {userRole === "customer" && <CustomerPanel />}
      </main>
    </div>
  );
}
