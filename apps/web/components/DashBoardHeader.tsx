"use client";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export const DashboardHeader = () => {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    router.push("/auth/login");
  };

  return (
    <header className="bg-[var(--primary-blue)] text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img
          src="/logo-oticas-queiroz.png"
          alt="Logo Óticas Queiroz"
          className="h-12 w-auto"
        />
        <h1 className="text-xl font-bold">Painel de Controle</h1>
      </div>

      <Button
        onClick={handleLogout}
        className="bg-[var(--secondary-red)] hover:bg-red-700"
      >
        Sair
      </Button>
    </header>
  );
};
