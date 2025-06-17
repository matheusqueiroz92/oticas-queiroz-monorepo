"use client";

import { Bell, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "../ui/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  clearAuthCookies, 
  redirectAfterLogout 
} from "@/app/_services/authService";
import Link from "next/link";
import { useHeaderUser } from "@/hooks/useHeaderUser";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const {
    userName,
    userRole,
    userEmail,
    userImage,
    isLoadingProfile,
    getInitials,
    getRoleLabel,
    getRoleColor,
  } = useHeaderUser();

  const handleSignOut = () => {
    clearAuthCookies();
    redirectAfterLogout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-8">
        {/* Título da página */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex flex-col">
            <h1 className="text-2xl text-[var(--secondary-red)] font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Ações do cabeçalho */}
        <div className="flex items-center gap-2">
          {/* Configurações */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Configurações</span>
          </Button>

          {/* Notificações */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notificações</span>
            </Button>
            {/* Badge de notificação - pode ser controlado por estado */}
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </div>

          {/* Dados do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 rounded-full">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={userImage} 
                      alt={userName} 
                    />
                    <AvatarFallback className={`text-xs ${isLoadingProfile ? 'animate-pulse bg-muted' : ''}`}>
                      {isLoadingProfile ? "..." : getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start gap-1">
                    <span className="text-sm font-medium leading-none">
                      {userName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 dark:text-slate-500 dark:bg-slate-900 rounded-full font-medium ${getRoleColor(userRole)}`}>
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                  <Badge className={`w-fit ${getRoleColor(userRole)} mt-1`}>
                    {getRoleLabel(userRole)}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <Link href="/profile">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <Link href="/settings">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <span className="mr-2 h-4 w-4"><LogOut /></span>
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toggle de tema */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 