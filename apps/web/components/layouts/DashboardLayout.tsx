"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Users,
  FileText,
  DollarSign,
  BarChart,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut, isAuthenticated } = useAuth();
  const { isAdmin, isEmployee } = usePermissions();
  const pathname = usePathname();

  // Lista de rotas onde não queremos mostrar o sidebar
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      roles: ["admin", "employee", "customer"],
    },
    {
      title: "Produtos",
      icon: Package,
      href: "/products",
      roles: ["admin", "employee"],
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/customers",
      roles: ["admin", "employee"],
    },
    {
      title: "Pedidos",
      icon: FileText,
      href: "/orders",
      roles: ["admin", "employee"],
    },
    {
      title: "Caixa",
      icon: DollarSign,
      href: "/cash-register",
      roles: ["admin", "employee"],
    },
    {
      title: "Relatórios",
      icon: BarChart,
      href: "/reports",
      roles: ["admin"],
    },
  ];

  // Se for uma rota pública ou usuário não autenticado, renderiza apenas o conteúdo
  if (isPublicRoute || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-primary text-white p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Óticas Queiroz</h1>
        </div>

        <NavigationMenu orientation="vertical" className="space-y-2">
          <NavigationMenuList className="flex flex-col space-y-2">
            {menuItems.map((item) => {
              if (!isAdmin && item.roles.includes("admin")) return null;
              if (!isEmployee && !isAdmin && item.roles.includes("employee"))
                return null;

              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    href={item.href}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-primary-foreground/10"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="mt-auto pt-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:text-white hover:bg-primary-foreground/10"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5 mr-2" />
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
