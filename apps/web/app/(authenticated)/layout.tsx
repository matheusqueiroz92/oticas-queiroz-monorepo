"use client";

import { usePermissions } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
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
  Timer,
  X,
  Landmark,
  NotepadText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  clearAuthCookies,
  redirectAfterLogout,
} from "@/app/_services/authService";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Image from "next/image";
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

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isEmployee } = usePermissions();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [_userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";

    setUserName(name);
    setUserRole(role);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isAdminByRole = userRole === "admin";
  const isEmployeeByRole = userRole === "employee";
  // const isCustomerByRole = userRole === "customer";

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:hidden bg-[var(--primary-blue)] p-4 flex justify-between items-center text-white">
        <div className="flex items-center">
          <div className="relative w-32 h-10">
            <Image
              src={LogoOticasQueiroz}
              alt="Óticas Queiroz Logo"
              fill
              className="object-contain"
              priority={false}
              loading="lazy"
            />
          </div>
        </div>
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

      <aside 
        className={cn(
          "bg-[var(--primary-blue)] text-white transition-all z-20",
          "fixed inset-y-0 left-0 w-16 mt-14 md:mt-0",
          !isMobileMenuOpen && "max-md:-translate-x-full",
          "md:sticky md:top-0 md:w-64 md:flex md:flex-col md:translate-x-0"
        )}
      >
        <div className="hidden md:block p-6">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-24">
              <Image
                src={LogoOticasQueiroz}
                alt="Óticas Queiroz Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          {/* {userName && (
            <p className="text-sm text-white/70 mt-2">Olá, {userName}</p>
          )} */}
          </div>
        </div>

        <nav className="space-y-2 flex-1 p-2 md:p-6 overflow-y-auto">
          {menuItems.map((item) => {
            if (!shouldShowMenuItem(item.roles)) return null;

            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg hover:bg-primary-foreground/10 text-white group w-full",
                    isActiveGroup(item) && "bg-primary-foreground/20",
                    "max-md:justify-center max-md:p-2",
                    "md:space-x-2 md:px-4 md:py-2"
                  )}
                  title={item.title}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="max-md:hidden">{item.title}</span>
                </Link>

                {item.subItems?.map((subItem) => {
                  if (!shouldShowMenuItem(subItem.roles)) return null;

                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center rounded-lg hover:bg-primary-foreground/10 text-white/80 text-sm group w-full",
                        isActiveLink(subItem.href) && "bg-primary-foreground/20",
                        "max-md:justify-center max-md:p-2",
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

        <div className="pt-2 border-t border-white/10 px-2 md:px-6 pb-2">
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

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className={cn(
        "flex-1 bg-background flex flex-col",
        "md:ml-0"
      )}>
        <div className="flex-1 p-4 md:p-8">{children}</div>
        
        <footer className="mt-auto pt-4 pb-4 px-2 border-t md:px-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Óticas Queiroz. Todos os direitos
            reservados. Desenvolvido por{" "}
            <span className="font-medium">Matheus Queiroz</span>
          </p>
        </footer>
      </main>
    </div>
  );
}