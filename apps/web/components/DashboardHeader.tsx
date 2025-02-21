import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";
import LogoOticasQueiroz from "@/public/logo-oticas-queiroz-branca.png";

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
        <div className="relative h-12 w-32">
          <Image
            src={LogoOticasQueiroz}
            alt="Logo Óticas Queiroz"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <h1 className="text-xl font-bold">Painel de Controle</h1>
      </div>

      <Button
        onClick={handleLogout}
        variant="destructive"
        className="bg-[var(--secondary-red)] hover:bg-red-700"
      >
        Sair
      </Button>
    </header>
  );
};
