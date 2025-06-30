"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  Star, 
  Eye,
  DollarSign,
  Layers,
  Palette,
  Hash,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProducts } from "@/hooks/useProducts";
import { ProductDialog } from "@/components/products/ProductDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const {
    currentProduct,
    loading,
    error,
    fetchProductById,
    formatCurrency,
  } = useProducts();

  // Remover debug de permissões - não necessário mais

  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  const handleGoBack = () => {
    router.push("/products");
  };

  const handleEditSuccess = () => {
    if (id) {
      fetchProductById(id as string);
    }
    setShowEditDialog(false);
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentProduct) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Produto não encontrado</AlertTitle>
          <AlertDescription>
            {error?.message || "O produto que você está procurando não existe ou foi removido."} 
          </AlertDescription>
          <Button className="mt-4" variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Produtos
          </Button>
        </Alert>
      </div>
    );
  }

  const imageUrl = currentProduct.image 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${currentProduct.image}`
    : null;

  const getProductTypeBadge = (type: string) => {
    const configs = {
      lenses: { label: "Lentes", className: "bg-blue-100 text-blue-800" },
      clean_lenses: { label: "Lentes de Limpeza", className: "bg-green-100 text-green-800" },
      prescription_frame: { label: "Armação de Grau", className: "bg-purple-100 text-purple-800" },
      sunglasses_frame: { label: "Armação de Sol", className: "bg-orange-100 text-orange-800" }
    };
    return configs[type as keyof typeof configs] || { label: type, className: "bg-gray-100 text-gray-800" };
  };

  const getStockStatus = () => {
    if (currentProduct.productType !== 'prescription_frame' && currentProduct.productType !== 'sunglasses_frame') {
      return null;
    }
    
    const stock = (currentProduct as any).stock || 0;
    if (stock === 0) {
      return { label: "Sem estoque", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200" };
    } else if (stock <= 5) {
      return { label: `${stock} unidades - Estoque baixo`, icon: AlertTriangle, className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    }
    return { label: `${stock} unidades em estoque`, icon: CheckCircle, className: "bg-green-50 text-green-700 border-green-200" };
  };

  const productTypeBadge = getProductTypeBadge(currentProduct.productType);
  const stockStatus = getStockStatus();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <Button onClick={() => setShowEditDialog(true)} className="gap-2">
          <Edit className="h-4 w-4" />
          Editar Produto
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden group">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={currentProduct.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="w-16 h-16 mb-4" />
                  <p className="text-sm">Imagem não disponível</p>
                </div>
              )}
              
              {/* Product type badge overlay */}
              <div className="absolute top-4 left-4">
                <Badge className={`${productTypeBadge.className} font-medium`}>
                  {productTypeBadge.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{currentProduct.name}</h2>
                  {currentProduct.brand && (
                    <p className="text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Marca: {currentProduct.brand}
                    </p>
                  )}
                </div>

                {currentProduct.description && (
                  <div>
                    <h3 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">Descrição</h3>
                    <p className="text-foreground leading-relaxed">{currentProduct.description}</p>
                  </div>
                )}

                {/* Price section */}
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(currentProduct.sellPrice)}
                    </p>
                    {currentProduct.costPrice && (
                      <p className="text-sm text-muted-foreground">
                        Preço de custo: <span className="line-through">{formatCurrency(currentProduct.costPrice)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Stock status */}
                {stockStatus && (
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${stockStatus.className}`}>
                    <stockStatus.icon className="h-5 w-5" />
                    <span className="font-medium">{stockStatus.label}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Specifications */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Especificações
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type-specific fields */}
                {currentProduct.productType === 'lenses' && 'lensType' in currentProduct && (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Lente</p>
                      <p className="font-medium">{currentProduct.lensType}</p>
                    </div>
                  </div>
                )}

                {(currentProduct.productType === 'prescription_frame' || currentProduct.productType === 'sunglasses_frame') && 'color' in currentProduct && (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cor</p>
                      <p className="font-medium">{currentProduct.color}</p>
                    </div>
                  </div>
                )}

                {(currentProduct.productType === 'prescription_frame' || currentProduct.productType === 'sunglasses_frame') && 'shape' in currentProduct && (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Formato</p>
                      <p className="font-medium">{currentProduct.shape}</p>
                    </div>
                  </div>
                )}

                {(currentProduct.productType === 'prescription_frame' || currentProduct.productType === 'sunglasses_frame') && 'reference' in currentProduct && (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Referência</p>
                      <p className="font-medium">{currentProduct.reference}</p>
                    </div>
                  </div>
                )}

                {currentProduct.productType === 'sunglasses_frame' && 'modelSunglasses' in currentProduct && (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Modelo</p>
                      <p className="font-medium">{currentProduct.modelSunglasses}</p>
                    </div>
                  </div>
                )}

                                 {/* Created date */}
                 <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                   <Calendar className="h-4 w-4 text-muted-foreground" />
                   <div>
                     <p className="text-sm text-muted-foreground">Cadastrado em</p>
                     <p className="font-medium">
                       {currentProduct.createdAt ? new Date(currentProduct.createdAt).toLocaleDateString('pt-BR') : '-'}
                     </p>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <ProductDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
        product={currentProduct}
        mode="edit"
      />
    </div>
  );
}