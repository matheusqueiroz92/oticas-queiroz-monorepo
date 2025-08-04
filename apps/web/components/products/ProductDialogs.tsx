import { ProductDialog } from "@/components/products/ProductDialog";
import type { Product } from "@/app/_types/product";

interface ProductDialogsProps {
  newProductDialogOpen: boolean;
  editProductDialogOpen: boolean;
  productToEdit?: Product;
  onNewProductDialogChange: (open: boolean) => void;
  onEditProductDialogChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductDialogs({
  newProductDialogOpen,
  editProductDialogOpen,
  productToEdit,
  onNewProductDialogChange,
  onEditProductDialogChange,
  onSuccess,
}: ProductDialogsProps) {
  return (
    <>
      {/* Dialog de Novo Produto */}
      <ProductDialog
        open={newProductDialogOpen}
        onOpenChange={onNewProductDialogChange}
        onSuccess={onSuccess}
      />

      {/* Dialog de Edição de Produto */}
      <ProductDialog
        open={editProductDialogOpen}
        onOpenChange={onEditProductDialogChange}
        onSuccess={onSuccess}
        product={productToEdit}
        mode="edit"
      />
    </>
  );
} 