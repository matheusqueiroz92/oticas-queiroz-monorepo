import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Package,
  Info,
  DollarSign,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductStockManagement } from "./ProductStockManagement";
import { Product } from "@/app/_types/product";
import { getProductTypeName } from "@/app/_services/productService";

interface ProductDetailsProps {
  product: Product;
  formatCurrency: (value: number) => string;
  isUpdatingStock: boolean;
  onStockUpdate: (newStock: number) => Promise<void>;
  onEdit: () => void;
  onDelete?: () => void;
  showDeleteOption?: boolean;
}

export function ProductDetails({
  product,
  formatCurrency,
  isUpdatingStock,
  onStockUpdate,
  onEdit,
  onDelete,
  showDeleteOption = false,
}: ProductDetailsProps) {
  // Função que retorna o ícone correto para cada tipo de produto
  const getProductTypeIcon = () => {
    switch (product.productType) {
      case "lenses":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "clean_lenses":
        return <Package className="h-5 w-5 text-green-500" />;
      case "prescription_frame":
        return <ShoppingBag className="h-5 w-5 text-purple-500" />;
      case "sunglasses_frame":
        return <ShoppingBag className="h-5 w-5 text-orange-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderProductSpecificDetails = () => {
    switch (product.productType) {
      case 'lenses':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Info className="h-4 w-4 text-blue-500" />
                  Especificações da Lente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Lente</p>
                    <p className="font-medium">{product.lensType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'prescription_frame':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Info className="h-4 w-4 text-purple-500" />
                  Especificações da Armação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Armação</p>
                    <p className="font-medium">{(product as any).typeFrame}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{(product as any).color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formato</p>
                    <p className="font-medium">{(product as any).shape}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referência</p>
                    <p className="font-medium">{(product as any).reference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <ProductStockManagement
              productId={product._id}
              productName={product.name}
              currentStock={(product as any).stock || 0}
              isUpdatingStock={isUpdatingStock}
              onStockUpdate={onStockUpdate}
            />
          </div>
        );
      
      case 'sunglasses_frame':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Info className="h-4 w-4 text-orange-500" />
                  Especificações da Armação Solar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{(product as any).modelSunglasses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Armação</p>
                    <p className="font-medium">{(product as any).typeFrame}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{(product as any).color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formato</p>
                    <p className="font-medium">{(product as any).shape}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referência</p>
                    <p className="font-medium">{(product as any).reference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <ProductStockManagement
              productId={product._id}
              productName={product.name}
              currentStock={(product as any).stock || 0}
              isUpdatingStock={isUpdatingStock}
              onStockUpdate={onStockUpdate}
            />
          </div>
        );
      
      case 'clean_lenses':
      default:
        return (
          <div className="p-4 bg-gray-50 rounded-md border text-sm">
            <p className="text-muted-foreground text-center">
              Este tipo de produto não possui especificações adicionais.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card className="shadow-sm overflow-hidden h-full">
          <div className="h-[300px] bg-gray-50 flex items-center justify-center">
            {product.image ? (
              <img
                src={process.env.NEXT_PUBLIC_API_URL+product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Package className="h-12 w-12 mb-2 opacity-20" />
                <span>Sem imagem disponível</span>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <Badge
                variant="outline" 
                className="px-2 py-0 flex items-center gap-1 font-medium"
              >
                {getProductTypeIcon()}
                {getProductTypeName(product.productType)}
              </Badge>
              {product.brand && (
                <Badge variant="secondary">
                  {product.brand}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Preço de Venda</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(product.sellPrice)}
                </p>
              </div>
              
              {product.costPrice !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Preço de Custo</p>
                  <p className="text-base">
                    {formatCurrency(product.costPrice)}
                  </p>
                </div>
              )}
            </div>
            
            {product.description && (
              <div className="mt-4">
                <h3 className="font-medium mb-1">Descrição</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
            
            <div className="mt-4 flex space-x-2">
              <Button 
                onClick={onEdit}
                className="flex-1"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              {showDeleteOption && onDelete && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar exclusão</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancelar</Button>
                      <Button variant="destructive" onClick={onDelete}>Excluir</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="details" className="flex-1">
              <Info className="h-4 w-4 mr-2" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Informações de Preço
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            {renderProductSpecificDetails()}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card className="shadow-sm border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Informações de Preço
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Preço de Venda</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(product.sellPrice)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Preço de Custo</p>
                    <p className="text-base">
                      {product.costPrice !== undefined
                        ? formatCurrency(product.costPrice)
                        : "Não informado"}
                    </p>
                  </div>
                  
                  {product.costPrice !== undefined && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                        <p className="text-base">
                          {((product.sellPrice - product.costPrice) / product.sellPrice * 100).toFixed(2)}%
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Lucro</p>
                        <p className="text-base text-green-600">
                          {formatCurrency(product.sellPrice - product.costPrice)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}