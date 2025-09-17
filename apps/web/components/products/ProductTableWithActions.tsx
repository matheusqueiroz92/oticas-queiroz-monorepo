"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Product } from "@/app/_types/product";
import { getProductTypeName } from "@/app/_services/productService";
import { ProductDialog } from "./ProductDialog";
import { useProducts } from "@/hooks/products/useProducts";
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
import { showSuccess } from "@/app/_utils/error-handler";

interface ProductTableWithActionsProps {
  products: Product[];
  formatCurrency: (value: number) => string;
  navigateToProductDetails: (id: string) => void;
  onRefresh: () => void;
}

export function ProductTableWithActions({
  products,
  formatCurrency,
  navigateToProductDetails,
  onRefresh,
}: ProductTableWithActionsProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { handleDeleteProduct, isDeleting } = useProducts(1);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    console.log("[ProductTableWithActions] handleEditSuccess chamado");
    showSuccess("Produto cadastrado", "O produto foi cadastrado com sucesso.");
    onRefresh();
  };

  const handleEditDialogClose = (open: boolean) => {
    setShowEditDialog(open);
    if (!open) {
      // Limpar o produto sendo editado quando o dialog for fechado
      setEditingProduct(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    
    try {
      await handleDeleteProduct(deletingProduct._id);
      setShowDeleteDialog(false);
      setDeletingProduct(null);
      onRefresh();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  const getStockDisplay = (product: Product) => {
    if (product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') {
      const stock = (product as any).stock || 0;
      return stock.toString();
    }
    return '-';
  };

  const getStockBadge = (product: Product) => {
    if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
      return null;
    }
    
    const stock = (product as any).stock || 0;
    if (stock === 0) {
      return <Badge className="bg-red-100 text-red-800 text-xs">Sem estoque</Badge>;
    } else if (stock <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Baixo</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 text-xs">Normal</Badge>;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Produto</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Marca</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Preço</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Estoque</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr 
                key={product._id} 
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">IMG</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {getProductTypeName(product.productType)}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {product.brand || '-'}
                </td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(product.sellPrice)}
                    </span>
                    {product.costPrice && (
                      <span className="text-xs text-muted-foreground">
                        Custo: {formatCurrency(product.costPrice)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{getStockDisplay(product)}</span>
                    {getStockBadge(product)}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateToProductDetails(product._id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(product)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog de Edição */}
      <ProductDialog
        open={showEditDialog}
        onOpenChange={handleEditDialogClose}
        onSuccess={handleEditSuccess}
        product={editingProduct || undefined}
        mode="edit"
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o produto "{deletingProduct?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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