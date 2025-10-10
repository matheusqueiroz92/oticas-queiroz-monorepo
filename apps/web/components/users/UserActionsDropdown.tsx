"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, Edit, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResetPasswordDialog } from "@/components/profile/ResetPasswordDialog";
import type { User } from "@/app/_types/user";

interface UserActionsDropdownProps {
  user: User;
  onView?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  showResetPassword?: boolean;
  currentUserRole?: string;
}

export function UserActionsDropdown({
  user,
  onView,
  onEdit,
  onDelete,
  showResetPassword = true,
  currentUserRole,
}: UserActionsDropdownProps) {
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

  // Determinar se pode resetar senha baseado nas regras
  const canResetPassword = () => {
    if (!showResetPassword || !currentUserRole) return false;

    // Admin pode resetar senha de employee e customer
    if (currentUserRole === "admin") {
      return user.role === "employee" || user.role === "customer";
    }

    // Employee pode resetar senha de customer
    if (currentUserRole === "employee") {
      return user.role === "customer";
    }

    return false;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {onView && (
            <DropdownMenuItem onClick={() => onView(user)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
          )}
          
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {canResetPassword() && (
            <DropdownMenuItem onClick={() => setResetPasswordDialogOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Resetar Senha
            </DropdownMenuItem>
          )}
          
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de resetar senha */}
      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
        userId={user._id}
        userName={user.name}
      />
    </>
  );
}

