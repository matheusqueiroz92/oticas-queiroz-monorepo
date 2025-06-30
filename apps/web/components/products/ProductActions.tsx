"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Plus 
} from "lucide-react";
import { ProductDialog } from "./ProductDialog";
import { Product } from "@/app/_types/product";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductActionsProps {
  product?: Product;
  onViewDetails?: (id: string) => void;
  onRefresh?: () => void;
}

export function ProductActions({ product, onViewDetails, onRefresh }: ProductActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { handleDeleteProduct, isDeleting } = useProducts();
  const { toast } = useToast();

  const handleCreateSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleEditSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleEditDialogClose = (open: boolean) => {
    setShowEditDialog(open);
  };

  const handleDelete = async () => {
    if (!product) return;
    
    try {
      await handleDeleteProduct(product._id);
      setShowDeleteDialog(false);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  // Botão para criar novo produto
  if (!product) {
    return (
      <>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>

        <ProductDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCreateSuccess}
          mode="create"
        />
      </>
    );
  }

  // Menu de ações para produto específico
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
          <DropdownMenuItem 
            onClick={() => onViewDetails?.(product._id)}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowEditDialog(true)}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="cursor-pointer text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Edição */}
      <ProductDialog
        open={showEditDialog}
        onOpenChange={handleEditDialogClose}
        onSuccess={handleEditSuccess}
        product={product}
        mode="edit"
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o produto "{product.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 