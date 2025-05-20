import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight,
  Package,
  ShoppingBag,
  Eye,
  Edit 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product } from "@/app/types/product";
import { getProductTypeName } from "@/app/services/productService";

interface ProductTableRowProps {
  product: Product;
  formatCurrency: (value: number) => string;
  navigateToProductDetails: (id: string) => void;
  navigateToEditProduct: (id: string) => void;
}

export function ProductTableRow({
  product,
  formatCurrency,
  navigateToProductDetails,
  navigateToEditProduct,
}: ProductTableRowProps) {
  // Função que retorna o ícone correto para cada tipo de produto
  const getProductTypeIcon = (type: Product['productType']) => {
    switch (type) {
      case "lenses":
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case "clean_lenses":
        return <Package className="h-4 w-4 text-green-500" />;
      case "prescription_frame":
        return <ShoppingBag className="h-4 w-4 text-purple-500" />;
      case "sunglasses_frame":
        return <ShoppingBag className="h-4 w-4 text-orange-500" />;
      default:
        return <ShoppingBag className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md mr-4 overflow-hidden">
            {product.image ? (
              <img
                src={process.env.NEXT_PUBLIC_API_URL+product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-500">{product.brand || "-"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          {getProductTypeIcon(product.productType)}
          <span className="text-xs">{getProductTypeName(product.productType)}</span>
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-primary">{formatCurrency(product.sellPrice)}</div>
        {product.costPrice !== undefined && (
          <div className="text-xs text-gray-500">Custo: {formatCurrency(product.costPrice)}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {(product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') ? (
          <div>
            {(product as any).stock === 0 ? (
              <Badge variant="destructive" className="font-normal">Sem estoque</Badge>
            ) : (product as any).stock <= 5 ? (
              <Badge variant="outline" className="font-normal bg-amber-500 hover:bg-amber-600">Baixo: {(product as any).stock}</Badge>
            ) : (
              <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">{(product as any).stock} unidades</Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-500">N/A</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <span className="sr-only">Abrir menu</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigateToProductDetails(product._id)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigateToEditProduct(product._id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}