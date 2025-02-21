"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Home,
  Package,
  Users,
  FileText,
  DollarSign,
  BarChart,
  LogOut,
  UserPlus,
  Building2,
  Beaker,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
    title: "Funcionários",
    icon: Users,
    href: "/employees",
    roles: ["admin"],
    subItems: [
      {
        title: "Novo Funcionário",
        icon: UserPlus,
        href: "/employees/new",
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/customers",
    roles: ["admin", "employee"],
    subItems: [
      {
        title: "Novo Cliente",
        icon: UserPlus,
        href: "/customers/new",
        roles: ["admin", "employee"],
      },
    ],
  },
  {
    title: "Produtos",
    icon: Package,
    href: "/products",
    roles: ["admin", "employee", "customer"],
    subItems: [
      {
        title: "Novo Produto",
        icon: ShoppingCart,
        href: "/products/new",
        roles: ["admin", "employee"],
      },
    ],
  },
  {
    title: "Laboratórios",
    icon: Beaker,
    href: "/laboratories",
    roles: ["admin"],
    subItems: [
      {
        title: "Novo Laboratório",
        icon: Building2,
        href: "/laboratories/new",
        roles: ["admin"],
      },
    ],
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

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useAuth();
  const { isAdmin, isEmployee } = usePermissions();
  const pathname = usePathname();

  const isActiveLink = (href: string): boolean => pathname === href;
  const isActiveGroup = (item: MenuItem): boolean =>
    pathname === item.href ||
    item.subItems?.some((subItem) => pathname === subItem.href) ||
    false;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-[var(--primary-blue)] text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Óticas Queiroz</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            if (!isAdmin && item.roles.includes("admin")) return null;
            if (!isEmployee && !isAdmin && item.roles.includes("employee"))
              return null;

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
                  if (!isAdmin && subItem.roles.includes("admin")) return null;
                  if (
                    !isEmployee &&
                    !isAdmin &&
                    subItem.roles.includes("employee")
                  )
                    return null;

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
