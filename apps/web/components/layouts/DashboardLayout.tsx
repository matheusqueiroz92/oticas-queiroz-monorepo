"use client";

import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Users,
  FileText,
  DollarSign,
  BarChart,
  LogOut,
  Microscope,
  User,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useEffect, useState } from "react";
import {
  clearAuthCookies,
  redirectAfterLogout,
} from "@/app/services/authService";
import Cookies from "js-cookie";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Buscar dados básicos do usuário dos cookies
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";

    setUserName(name);
    setUserRole(role);
  }, []);

  // Determinar o papel do usuário
  const isAdmin = userRole === "admin";
  const isEmployee = userRole === "employee";
  const isCustomer = userRole === "customer";

  // Lista de rotas onde não queremos mostrar o sidebar
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  // Função para lidar com o logout
  const handleSignOut = () => {
    clearAuthCookies();
    redirectAfterLogout();
  };

  // Define os itens de menu com base no papel do usuário
  const getMenuItems = () => {
    // Itens básicos comuns a todos os usuários
    const items = [
      {
        title: "Dashboard",
        icon: Home,
        href: "/dashboard",
        visible: true,
      },
      {
        title: "Perfil",
        icon: User,
        href: "/profile",
        visible: true,
      },
    ];

    // Itens para admin e funcionários
    if (isAdmin || isEmployee) {
      items.push(
        {
          title: "Produtos",
          icon: Package,
          href: "/products",
          visible: true,
        },
        {
          title: "Clientes",
          icon: Users,
          href: "/customers",
          visible: true,
        },
        {
          title: "Pedidos",
          icon: FileText,
          href: "/orders",
          visible: true,
        },
        {
          title: "Laboratórios",
          icon: Microscope,
          href: "/laboratories",
          visible: true,
        },
        {
          title: "Caixa",
          icon: DollarSign,
          href: "/cash-register",
          visible: true,
        }
      );
    }

    // Itens somente para admin
    if (isAdmin) {
      items.push(
        {
          title: "Funcionários",
          icon: Users,
          href: "/employees",
          visible: true,
        },
        {
          title: "Relatórios",
          icon: BarChart,
          href: "/reports",
          visible: true,
        }
      );
    }

    // Itens somente para clientes
    if (isCustomer) {
      items.push(
        {
          title: "Meus Pedidos",
          icon: FileText,
          href: "/my-orders",
          visible: true,
        },
        {
          title: "Meus Débitos",
          icon: Receipt,
          href: "/my-debts",
          visible: true,
        }
      );
    }

    return items.filter((item) => item.visible);
  };

  // Se for uma rota pública, renderiza apenas o conteúdo
  if (isPublicRoute) {
    return <>{children}</>;
  }

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-primary text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Óticas Queiroz</h1>
          {userName && (
            <p className="text-sm text-white/70 mt-2">Olá, {userName}</p>
          )}
        </div>

        <NavigationMenu orientation="vertical" className="space-y-2 flex-grow">
          <NavigationMenuList className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-primary-foreground/20 font-medium"
                      : "hover:bg-primary-foreground/10"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="mt-auto pt-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:text-white hover:bg-primary-foreground/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 bg-background">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
