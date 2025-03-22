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
  Menu,
  X,
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
import { cn } from "@/lib/utils"; // Certifique-se de que esta importação existe

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";

    setUserName(name);
    setUserRole(role);
  }, []);

  // Fechar o menu mobile quando mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isAdmin = userRole === "admin";
  const isEmployee = userRole === "employee";
  const isCustomer = userRole === "customer";

  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const handleSignOut = () => {
    clearAuthCookies();
    redirectAfterLogout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getMenuItems = () => {
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

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Botão de menu móvel na parte superior (visível apenas em telas pequenas) */}
      <div className="md:hidden bg-primary text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Óticas Queiroz</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMobileMenu}
          className="text-white hover:bg-primary-foreground/20"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar - responsiva */}
      <aside 
        className={cn(
          "bg-primary text-white transition-all duration-300 ease-in-out",
          // Em dispositivos móveis
          isMobileMenuOpen 
            ? "fixed inset-0 z-50 w-full h-full pt-16" // Menu aberto cobre toda a tela
            : "fixed -left-full md:left-0 z-50 w-full h-full pt-16", // Menu fechado fica fora da tela
          // Em tablets e acima
          "md:relative md:pt-6 md:w-20 md:min-h-screen md:flex md:flex-col md:items-center",
          // Em desktops
          "lg:w-64 lg:items-stretch"
        )}
      >
        <div className="mb-8 px-6 hidden lg:block">
          <h1 className="text-xl font-bold">Óticas Queiroz</h1>
          {userName && (
            <p className="text-sm text-white/70 mt-2">Olá, {userName}</p>
          )}
        </div>

        {/* Versão mobile do nome do usuário */}
        {userName && (
          <div className="px-6 py-4 border-b border-primary-foreground/20 mb-4 md:hidden">
            <p className="text-sm text-white/70">Olá, {userName}</p>
          </div>
        )}

        <NavigationMenu orientation="vertical" className="space-y-2 flex-grow w-full">
          <NavigationMenuList className="flex flex-col space-y-2 px-4">
            {menuItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  href={item.href}
                  className={cn(
                    "flex items-center transition-colors rounded-lg",
                    // Base para todos os tamanhos
                    "px-4 py-3",
                    // Estilização baseada no pathname
                    pathname === item.href
                      ? "bg-primary-foreground/20 font-medium"
                      : "hover:bg-primary-foreground/10",
                    // Em tablets - apenas ícones
                    "md:justify-center md:px-0 md:py-3",
                    // Em desktops - ícones e texto
                    "lg:justify-start lg:px-4 lg:py-2"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "ml-2",
                    // Ocultar texto em tablets
                    "md:hidden",
                    // Mostrar texto em desktops
                    "lg:inline-block"
                  )}>
                    {item.title}
                  </span>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className={cn(
          "mt-auto pt-6 px-4",
          "md:w-full md:flex md:justify-center",
          "lg:justify-start"
        )}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-white hover:text-white hover:bg-primary-foreground/10",
              "md:w-10 md:h-10 md:p-0 md:justify-center",
              "lg:w-full lg:justify-start lg:px-4 lg:py-2"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 md:m-0 lg:mr-2" />
            <span className="md:hidden lg:inline-block">Sair</span>
          </Button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className={cn(
        "flex-1 bg-background",
        "md:ml-20", // Margem para compensar a largura da barra lateral em tablets
        "lg:ml-64" // Margem para compensar a largura da barra lateral em desktop
      )}>
        <div className="p-4 md:p-8">{children}</div>
      </main>
      
      {/* Overlay para fechar o menu quando clicado fora em mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}