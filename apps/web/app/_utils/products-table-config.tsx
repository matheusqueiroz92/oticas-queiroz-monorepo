import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Package } from "lucide-react";
import { getProductTypeBadge, getStockStatusInfo, formatCurrency, getProductImageUrl } from "./product-utils";

export const getProductTableColumns = (
  onDetailsClick: (productId: string) => void,
  onEditClick: (product: any) => void
) => [
  {
    accessorKey: "image",
    header: "",
    cell: ({ row }: any) => {
      const product = row.original;
      const imageUrl = getProductImageUrl(product.image);
      
      return (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      );
    },
    size: 80,
  },
  {
    accessorKey: "name",
    header: "Produto",
    cell: ({ row }: any) => {
      const product = row.original;
      const typeBadge = getProductTypeBadge(product.productType);
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{product.name}</div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${typeBadge.className}`}>
              {typeBadge.label}
            </Badge>
            {product.brand && (
              <span className="text-xs text-muted-foreground">
                {product.brand}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "sellPrice",
    header: "Preço",
    cell: ({ row }: any) => {
      const product = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium text-green-600">
            {formatCurrency(product.sellPrice)}
          </div>
          {product.costPrice && (
            <div className="text-xs text-muted-foreground">
              Custo: {formatCurrency(product.costPrice)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Estoque",
    cell: ({ row }: any) => {
      const product = row.original;
      const stockInfo = getStockStatusInfo(product);
      
      if (!stockInfo) {
        return (
          <span className="text-xs text-muted-foreground">
            N/A
          </span>
        );
      }
      
      return (
        <Badge className={`text-xs ${stockInfo.className}`}>
          {stockInfo.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }: any) => {
      const product = row.original;
      return (
        <div className="max-w-xs">
          <p className="text-sm text-muted-foreground truncate">
            {product.description || "Sem descrição"}
          </p>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }: any) => {
      const product = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDetailsClick(product._id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditClick(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
]; 