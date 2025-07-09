import { ProductDetailsHeader } from "./ProductDetailsHeader";
import { ProductDetailsImage } from "./ProductDetailsImage";
import { ProductDetailsInfo } from "./ProductDetailsInfo";
import { ProductDetailsSpecs } from "./ProductDetailsSpecs";
import { ProductDialog } from "./ProductDialog";

interface ProductDetailsContentProps {
  product: any;
  showEditDialog: boolean;
  onGoBack: () => void;
  onEditClick: () => void;
  onCloseEditDialog: () => void;
  onEditSuccess: () => void;
}

export function ProductDetailsContent({
  product,
  showEditDialog,
  onGoBack,
  onEditClick,
  onCloseEditDialog,
  onEditSuccess,
}: ProductDetailsContentProps) {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <ProductDetailsHeader
        onGoBack={onGoBack}
        onEditClick={onEditClick}
      />

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        <ProductDetailsImage product={product} />
        
        <div className="space-y-6">
          <ProductDetailsInfo product={product} />
          <ProductDetailsSpecs product={product} />
        </div>
      </div>

      {/* Edit Dialog */}
      <ProductDialog
        open={showEditDialog}
        onOpenChange={onCloseEditDialog}
        onSuccess={onEditSuccess}
        product={product}
        mode="edit"
      />
    </div>
  );
} 