"use client";

import { usePermissions } from "@/hooks/usePermissions";
import {
  Home,
  Package,
  Users,
  FileText,
  DollarSign,
  BarChart,
  LogOut,
  CircleUser,
  User,
  HandCoins,
  FlaskConical,
  type LucideIcon,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  clearAuthCookies,
  redirectAfterLogout,
} from "@/app/services/authService";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

interface SubMenuItem {
  title: string;
  icon: LucideIcon;
  href: string;
  roles: string[];
}

interface MenuItem {
  title: string;
  icon: LucideIcon;
  href: string;
  roles: string[];
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    roles: ["admin", "employee", "customer"],
  },
  {
    title: "Perfil",
    icon: User,
    href: "/profile",
    roles: ["admin", "employee", "customer"],
  },
  {
    title: "Funcionários",
    icon: CircleUser,
    href: "/employees",
    roles: ["admin"],
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
    title: "Meus Pedidos",
    icon: FileText,
    href: "/my-orders",
    roles: ["customer"],
  },
  {
    title: "Meus Débitos",
    icon: FileText,
    href: "/my-debts",
    roles: ["customer"],
  },
  {
    title: "Pagamentos",
    icon: HandCoins,
    href: "/payments",
    roles: ["admin", "employee"],
  },
  {
    title: "Caixa",
    icon: DollarSign,
    href: "/cash-register",
    roles: ["admin", "employee"],
  },
  {
    title: "Produtos",
    icon: Package,
    href: "/products",
    roles: ["admin", "employee"],
  },
  {
    title: "Laboratórios",
    icon: FlaskConical,
    href: "/laboratories",
    roles: ["admin", "employee"],
  },
  {
    title: "Relatórios",
    icon: BarChart,
    href: "/reports",
    roles: ["admin"],
  },
];

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isEmployee } = usePermissions();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Carregar dados do usuário dos cookies
  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";

    setUserName(name);
    setUserRole(role);
  }, []);

  // Fechar menu ao navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Determinar o papel do usuário diretamente dos cookies se usePermissions falhar
  const isAdminByRole = userRole === "admin";
  const isEmployeeByRole = userRole === "employee";
  const isCustomerByRole = userRole === "customer";

  // Usar dados dos hooks se disponíveis, senão usar os cookies
  const canAccessAdmin = isAdmin || isAdminByRole;
  const canAccessEmployee = isEmployee || isEmployeeByRole;
  const isCustomer =
    userRole === "customer" || (!canAccessAdmin && !canAccessEmployee);

  const isActiveLink = (href: string): boolean => pathname === href;
  const isActiveGroup = (item: MenuItem): boolean =>
    pathname === item.href ||
    item.subItems?.some((subItem) => pathname === subItem.href) ||
    false;

  const handleSignOut = () => {
    clearAuthCookies();
    redirectAfterLogout();
  };

  // Função para verificar se um item do menu deve ser exibido com base no papel do usuário
  const shouldShowMenuItem = (itemRoles: string[]): boolean => {
    // Se é admin, mostra todos os itens marcados para admin
    if (canAccessAdmin && itemRoles.includes("admin")) return true;

    // Se é funcionário, mostra todos os itens marcados para funcionário
    if (canAccessEmployee && itemRoles.includes("employee")) return true;

    // Se é cliente, mostra apenas os itens marcados para cliente
    if (isCustomer && itemRoles.includes("customer")) return true;

    return false;
  };

  // Toggle do menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Botão hambúrguer mobile - visível apenas em dispositivos móveis */}
      <div className="md:hidden bg-[var(--primary-blue)] p-4 flex justify-between items-center text-white">
        <h1 className="text-lg font-bold">Óticas Queiroz</h1>
        <button 
          onClick={toggleMobileMenu}
          className="p-1 rounded hover:bg-primary-foreground/20"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar com implementação responsiva */}
      <aside 
        className={cn(
          "bg-[var(--primary-blue)] text-white transition-all z-20",
          // Versão mobile
          "fixed inset-y-0 left-0 w-16 mt-14 md:mt-0",
          // Quando fechado em mobile
          !isMobileMenuOpen && "max-md:-translate-x-full",
          // Layout desktop
          "md:sticky md:top-0 md:w-64 md:flex md:flex-col md:translate-x-0"
        )}
      >
        {/* Cabeçalho - visível apenas em desktop */}
        <div className="hidden md:block mb-8 p-6">
          <h1 className="text-xl font-bold">Óticas Queiroz</h1>
          {userName && (
            <p className="text-sm text-white/70 mt-2">Olá, {userName}</p>
          )}
        </div>

        <nav className="space-y-2 flex-1 p-2 md:p-6">
          {menuItems.map((item) => {
            // Verificar se o item deve ser exibido para o papel atual do usuário
            if (!shouldShowMenuItem(item.roles)) return null;

            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg hover:bg-primary-foreground/10 text-white group w-full",
                    // Estilo quando ativo
                    isActiveGroup(item) && "bg-primary-foreground/20",
                    // Tamanho e padding responsivo
                    "max-md:justify-center max-md:p-2",
                    "md:space-x-2 md:px-4 md:py-2"
                  )}
                  title={item.title} // Adiciona tooltip para móveis
                >
                  <item.icon className="h-5 w-5" />
                  <span className="max-md:hidden">{item.title}</span>
                </Link>

                {item.subItems?.map((subItem) => {
                  // Verificar se o subitem deve ser exibido
                  if (!shouldShowMenuItem(subItem.roles)) return null;

                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center rounded-lg hover:bg-primary-foreground/10 text-white/80 text-sm group w-full",
                        isActiveLink(subItem.href) && "bg-primary-foreground/20",
                        // Estilo mobile
                        "max-md:justify-center max-md:p-2",
                        // Estilo desktop
                        "md:space-x-2 md:px-4 md:py-2 md:pl-10"
                      )}
                      title={subItem.title}
                    >
                      <subItem.icon className="h-4 w-4" />
                      <span className="max-md:hidden">{subItem.title}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/10 px-2 md:px-6 pb-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full text-white hover:text-white hover:bg-primary-foreground/10",
              "max-md:justify-center max-md:p-2",
              "md:justify-start md:px-4 md:py-2"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 md:mr-2" />
            <span className="max-md:hidden">Sair</span>
          </Button>
        </div>
      </aside>

      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Conteúdo principal */}
      <main className={cn(
        "flex-1 bg-background",
        "md:ml-0"
      )}>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}