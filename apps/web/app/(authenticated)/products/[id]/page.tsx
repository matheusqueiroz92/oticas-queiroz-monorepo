"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  ChevronLeft, 
  Edit, 
  Trash2, 
  RefreshCw,
  Package, 
  ArrowUpDown,
  ShoppingBag,
  Tag,
  Info,
  DollarSign,
  CheckCircle2
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { usePermissions } from "@/hooks/usePermissions";
import { getProductTypeName } from "@/app/services/productService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { canManageProducts } = usePermissions();
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [newStockValue, setNewStockValue] = useState<number | undefined>(undefined);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);

  const {
    currentProduct,
    loading,
    error,
    fetchProductById,
    navigateToEditProduct,
    handleUpdateStock,
    formatCurrency,
  } = useProducts();

  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  useEffect(() => {
    if (currentProduct && 
        (currentProduct.productType === 'prescription_frame' || 
         currentProduct.productType === 'sunglasses_frame')) {
      setNewStockValue(currentProduct.stock);
    }
  }, [currentProduct]);

  const handleStockUpdate = async () => {
    if (!currentProduct || newStockValue === undefined) return;
    
    setIsUpdatingStock(true);
    try {
      await handleUpdateStock(currentProduct._id, newStockValue);
      toast({
        title: "Estoque atualizado",
        description: `Estoque atualizado para ${newStockValue} unidades.`,
      });
      setStockDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o estoque."
      });
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const getProductTypeIcon = () => {
    switch (currentProduct?.productType) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error?.message || "Produto não encontrado"} 
          </AlertDescription>
          <Button className="mt-4" onClick={() => router.push("/products")}>
            Voltar para Produtos
          </Button>
        </Alert>
      </div>
    );
  }

  const renderProductSpecificDetails = () => {
    switch (currentProduct.productType) {
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
                    <p className="font-medium">{currentProduct.lensType}</p>
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
                    <p className="font-medium">{currentProduct.typeFrame}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{currentProduct.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formato</p>
                    <p className="font-medium">{currentProduct.shape}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referência</p>
                    <p className="font-medium">{currentProduct.reference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Package className="h-4 w-4 text-purple-500" />
                    Controle de Estoque
                  </CardTitle>
                  {canManageProducts && (
                    <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                          Ajustar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Atualizar Estoque</DialogTitle>
                          <DialogDescription>
                            Atualize a quantidade em estoque deste produto
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="stock" className="text-sm font-medium">
                              Quantidade em estoque
                            </label>
                            <Input
                              id="stock"
                              type="number"
                              min="0"
                              value={newStockValue || 0}
                              onChange={(e) => setNewStockValue(Number(e.target.value))}
                              placeholder="Quantidade"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setStockDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleStockUpdate}
                            disabled={isUpdatingStock}
                          >
                            {isUpdatingStock ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              'Salvar'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                    <div className="flex items-center mt-1">
                      <p className="text-2xl font-bold">{currentProduct.stock}</p>
                      <p className="ml-2 text-sm text-muted-foreground">unidades</p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-2 rounded-md ${
                    (currentProduct.stock || 0) > 5 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : (currentProduct.stock || 0) > 0 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {(currentProduct.stock || 0) > 5 ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (currentProduct.stock || 0) > 0 ? (
                        <Package className="h-4 w-4 mr-2" />
                      ) : (
                        <Package className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm">
                        {(currentProduct.stock || 0) > 5 
                          ? 'Estoque em nível adequado' 
                          : (currentProduct.stock || 0) > 0
                            ? 'Estoque baixo - Considere repor'
                            : 'Sem estoque - Reposição urgente'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    <p className="font-medium">{currentProduct.modelSunglasses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Armação</p>
                    <p className="font-medium">{currentProduct.typeFrame}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{currentProduct.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formato</p>
                    <p className="font-medium">{currentProduct.shape}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referência</p>
                    <p className="font-medium">{currentProduct.reference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Package className="h-4 w-4 text-orange-500" />
                    Controle de Estoque
                  </CardTitle>
                  {canManageProducts && (
                    <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                          Ajustar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Atualizar Estoque</DialogTitle>
                          <DialogDescription>
                            Atualize a quantidade em estoque deste produto
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="stock" className="text-sm font-medium">
                              Quantidade em estoque
                            </label>
                            <Input
                              id="stock"
                              type="number"
                              min="0"
                              value={newStockValue || 0}
                              onChange={(e) => setNewStockValue(Number(e.target.value))}
                              placeholder="Quantidade"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setStockDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleStockUpdate}
                            disabled={isUpdatingStock}
                          >
                            {isUpdatingStock ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              'Salvar'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                    <div className="flex items-center mt-1">
                      <p className="text-2xl font-bold">{currentProduct.stock}</p>
                      <p className="ml-2 text-sm text-muted-foreground">unidades</p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-2 rounded-md ${
                    (currentProduct.stock || 0) > 5 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : (currentProduct.stock || 0) > 0 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {(currentProduct.stock || 0) > 5 ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (currentProduct.stock || 0) > 0 ? (
                        <Package className="h-4 w-4 mr-2" />
                      ) : (
                        <Package className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm">
                        {(currentProduct.stock || 0) > 5 
                          ? 'Estoque em nível adequado' 
                          : (currentProduct.stock || 0) > 0
                            ? 'Estoque baixo - Considere repor'
                            : 'Sem estoque - Reposição urgente'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Produto</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="shadow-sm overflow-hidden h-full">
            <div className="h-[300px] bg-gray-50 flex items-center justify-center">
              {currentProduct.image ? (
                <img
                  src={process.env.NEXT_PUBLIC_API_URL+currentProduct.image}
                  alt={currentProduct.name}
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
                  {getProductTypeName(currentProduct.productType)}
                </Badge>
                {currentProduct.brand && (
                  <Badge variant="secondary">
                    {currentProduct.brand}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold">{currentProduct.name}</h2>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Preço de Venda</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(currentProduct.sellPrice)}
                  </p>
                </div>
                
                {currentProduct.costPrice !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Preço de Custo</p>
                    <p className="text-base">
                      {formatCurrency(currentProduct.costPrice)}
                    </p>
                  </div>
                )}
              </div>
              
              {currentProduct.description && (
                <div className="mt-4">
                  <h3 className="font-medium mb-1">Descrição</h3>
                  <p className="text-sm text-muted-foreground">{currentProduct.description}</p>
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                {canManageProducts && (
                  <>
                    <Button 
                      onClick={() => navigateToEditProduct(currentProduct._id)}
                      className="flex-1"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
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
                          <Button variant="destructive">Excluir</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
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
                        {formatCurrency(currentProduct.sellPrice)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Preço de Custo</p>
                      <p className="text-base">
                        {currentProduct.costPrice !== undefined
                          ? formatCurrency(currentProduct.costPrice)
                          : "Não informado"}
                      </p>
                    </div>
                    
                    {currentProduct.costPrice !== undefined && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                          <p className="text-base">
                            {((currentProduct.sellPrice - currentProduct.costPrice) / currentProduct.sellPrice * 100).toFixed(2)}%
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Lucro</p>
                          <p className="text-base text-green-600">
                            {formatCurrency(currentProduct.sellPrice - currentProduct.costPrice)}
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
    </div>
  );
}