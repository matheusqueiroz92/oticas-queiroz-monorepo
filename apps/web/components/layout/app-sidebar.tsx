"use client";

import React from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  DollarSign,
  LogOut,
  CircleUser,
  User,
  HandCoins,
  FlaskConical,
  Timer,
  Landmark,
  NotepadText,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
  ListCheck,
  ContactRound,
  ChartNoAxesCombined,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import {
  clearAuthCookies,
  redirectAfterLogout,
} from "@/app/_services/authService";
import LogoOticasQueiroz from "../../public/logo-oticas-queiroz-branca.png";

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
    icon: LayoutDashboard,
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
    roles: ["admin", "employee", "customer"],
    subItems: [
      {
        title: "Todos os Pedidos",
        icon: ListCheck,
        href: "/orders",
        roles: ["admin", "employee"],
      },
      {
        title: "Meus Pedidos",
        icon: ContactRound,
        href: "/my-orders",
        roles: ["customer", "employee", "admin"],
      },
    ],
  },
  {
    title: "Produtos",
    icon: Package,
    href: "/products",
    roles: ["admin", "employee"],
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
    title: "Laboratórios",
    icon: FlaskConical,
    href: "/laboratories",
    roles: ["admin", "employee"],
  },
  {
    title: "Relatórios",
    icon: ChartNoAxesCombined,
    href: "/reports",
    roles: ["admin", "employee"],
  },
  {
    title: "Clientes Legados",
    icon: Timer,
    href: "/legacy-clients",
    roles: ["admin", "employee"],
  },
  {
    title: "Instituições",
    icon: Landmark,
    href: "/institutions",
    roles: ["admin", "employee"],
  },
  {
    title: "Gestão de Cheques",
    icon: NotepadText,
    href: "/checks",
    roles: ["admin", "employee"],
  },
];

export function AppSidebar() {
  const { isAdmin, isEmployee } = usePermissions();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    const role = Cookies.get("role") || "";
    setUserRole(role);
  }, []);

  // Expandir automaticamente o menu se o usuário estiver em uma sub-rota
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems?.some((subItem) => pathname === subItem.href)) {
        setExpandedMenus(prev => new Set(prev).add(item.href));
      }
    });
  }, [pathname]);

  const isAdminByRole = userRole === "admin";
  const isEmployeeByRole = userRole === "employee";

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

  const shouldShowMenuItem = (itemRoles: string[]): boolean => {
    if (canAccessAdmin && itemRoles.includes("admin")) return true;
    if (canAccessEmployee && itemRoles.includes("employee")) return true;
    if (isCustomer && itemRoles.includes("customer")) return true;
    return false;
  };

  const toggleMenu = (href: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (href: string): boolean => {
    return expandedMenus.has(href);
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r-0"
      style={{
        "--sidebar-background": "var(--primary-blue)",
        "--sidebar-foreground": "white",
        "--sidebar-accent": "rgba(255, 255, 255, 0.1)",
        "--sidebar-accent-foreground": "white",
        "--sidebar-border": "rgba(255, 255, 255, 0.1)",
      } as React.CSSProperties}
    >
      {/* Header com Logo */}
      <SidebarHeader className="p-6 bg-[var(--primary-blue)] border-b border-white/10">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-48 h-24 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 transition-all">
            <Image
              src={LogoOticasQueiroz}
              alt="Óticas Queiroz Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </SidebarHeader>

      {/* Conteúdo do Menu */}
      <SidebarContent className="bg-[var(--primary-blue)] text-white p-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            if (!shouldShowMenuItem(item.roles)) return null;

            const hasSubItems = item.subItems && item.subItems.length > 0;
            const hasVisibleSubItems = hasSubItems && item.subItems!.some(subItem => shouldShowMenuItem(subItem.roles));

            return (
              <React.Fragment key={item.href}>
                <SidebarMenuItem>
                  {hasVisibleSubItems ? (
                    // Item com sub-menu (botão expansível)
                    <SidebarMenuButton
                      onClick={() => toggleMenu(item.href)}
                      isActive={isActiveGroup(item)}
                      tooltip={item.title}
                      className={cn(
                        "text-white hover:bg-white/10 data-[active=true]:bg-white/20",
                        "group-data-[collapsible=icon]:justify-center"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:sr-only">
                        {item.title}
                      </span>
                      <div className="ml-auto group-data-[collapsible=icon]:hidden">
                        {isMenuExpanded(item.href) ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </div>
                    </SidebarMenuButton>
                  ) : (
                    // Item sem sub-menu (link normal)
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveGroup(item)}
                      tooltip={item.title}
                      className={cn(
                        "text-white hover:bg-white/10 data-[active=true]:bg-white/20",
                        "group-data-[collapsible=icon]:justify-center"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:sr-only">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>

                {/* Sub-items (mostrados apenas se expandido) */}
                {hasVisibleSubItems && isMenuExpanded(item.href) && (
                  <div className="group-data-[collapsible=icon]:hidden">
                    {item.subItems!.map((subItem) => {
                      if (!shouldShowMenuItem(subItem.roles)) return null;

                      return (
                        <SidebarMenuItem key={subItem.href} className="ml-4">
                          <SidebarMenuButton
                            asChild
                            isActive={isActiveLink(subItem.href)}
                            tooltip={subItem.title}
                            size="sm"
                            className="text-white/80 hover:bg-white/10 data-[active=true]:bg-white/20"
                          >
                            <Link href={subItem.href}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer com botão de logout */}
      <SidebarFooter className="bg-[var(--primary-blue)] border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sair"
              className={cn(
                "text-white hover:bg-white/10",
                "group-data-[collapsible=icon]:justify-center"
              )}
            >
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:sr-only">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
} 