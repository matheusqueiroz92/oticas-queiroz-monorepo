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
    // subItems: [
    //   {
    //     title: "Novo Funcionário",
    //     icon: UserPlus,
    //     href: "/employees/new",
    //     roles: ["admin"],
    //   },
    // ],
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/customers",
    roles: ["admin", "employee"],
    // subItems: [
    //   {
    //     title: "Novo Cliente",
    //     icon: UserPlus,
    //     href: "/customers/new",
    //     roles: ["admin", "employee"],
    //   },
    // ],
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
    // subItems: [
    //   {
    //     title: "Novo Produto",
    //     icon: ShoppingCart,
    //     href: "/products/new",
    //     roles: ["admin", "employee"],
    //   },
    // ],
  },
  {
    title: "Laboratórios",
    icon: FlaskConical,
    href: "/laboratories",
    roles: ["admin", "employee"],
    // subItems: [
    //   {
    //     title: "Novo Laboratório",
    //     icon: Building2,
    //     href: "/laboratories/new",
    //     roles: ["admin"],
    //   },
    // ],
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

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Carregar dados do usuário dos cookies
  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";

    setUserName(name);
    setUserRole(role);
  }, []);

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

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-[var(--primary-blue)] text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Óticas Queiroz</h1>
          {userName && (
            <p className="text-sm text-white/70 mt-2">Olá, {userName}</p>
          )}
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            // Verificar se o item deve ser exibido para o papel atual do usuário
            if (!shouldShowMenuItem(item.roles)) return null;

            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-primary-foreground/10 text-white group w-full",
                    isActiveGroup(item) && "bg-primary-foreground/20"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>

                {item.subItems?.map((subItem) => {
                  // Verificar se o subitem deve ser exibido
                  if (!shouldShowMenuItem(subItem.roles)) return null;

                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 pl-10 rounded-lg hover:bg-primary-foreground/10 text-white/80 text-sm group w-full",
                        isActiveLink(subItem.href) && "bg-primary-foreground/20"
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      <span>{subItem.title}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:text-white hover:bg-primary-foreground/10"
            onClick={handleSignOut}
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
