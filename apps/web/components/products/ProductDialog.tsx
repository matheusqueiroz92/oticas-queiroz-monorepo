"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package, Tag, Image as ImageIcon } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/useToast";
import { Product } from "@/app/_types/product";
import { getProductTypeName } from "@/app/_services/productService";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  productType: z.enum(["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"]),
  description: z.string().optional(),
  brand: z.string().optional(),
  sellPrice: z.coerce.number().min(0.01, "Preço de venda é obrigatório"),
  costPrice: z.coerce.number().optional(),
  image: z.any().optional(),
  lensType: z.string().optional(),
  typeFrame: z.string().optional(),
  color: z.string().optional(),
  shape: z.string().optional(),
  reference: z.string().optional(),
  stock: z.coerce.number().optional(),
  modelSunglasses: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  product?: Product;
  mode?: 'create' | 'edit';
}

export function ProductDialog({
  open,
  onOpenChange,
  onSuccess,
  product,
  mode,
}: ProductDialogProps) {
  const { createProductMutation, updateProductMutation } = useProducts();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // Memoizar o produto para evitar renderizações desnecessárias
  const memoizedProduct = useMemo(() => product, [product?._id]);

  // Detectar modo automaticamente se não foi especificado
  const isEditMode = mode === 'edit' || (mode === undefined && !!memoizedProduct && !!memoizedProduct._id);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      productType: "lenses",
      description: "",
      brand: "",
      sellPrice: 0,
      costPrice: 0,
      image: undefined,
      lensType: "",
      typeFrame: "",
      color: "",
      shape: "",
      reference: "",
      stock: 0,
      modelSunglasses: "",
    },
  });

  const watchedProductType = form.watch("productType");

  // Preencher o formulário quando estiver no modo de edição
  useEffect(() => {
    if (!open) {
      return; // Não fazer nada se o dialog estiver fechado
    }

    // Fechar todos os dropdowns abertos para evitar conflitos de aria-hidden
    const closeAllDropdowns = () => {
      // Fechar dropdowns do Radix UI
      document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.style.display !== 'none') {
          // Simular ESC para fechar dropdowns
          const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(escEvent);
        }
      });
      
      // Remover foco de elementos ativos
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    };

    // Usar uma flag para evitar loops infinitos
    const handleFormReset = () => {
      // Fechar dropdowns primeiro
      closeAllDropdowns();
      
      // Aguardar um frame para garantir que dropdowns fecharam
      requestAnimationFrame(() => {
        if (isEditMode && memoizedProduct) {
          form.reset({
            name: memoizedProduct.name || "",
            productType: memoizedProduct.productType,
            description: memoizedProduct.description || "",
            brand: memoizedProduct.brand || "",
            sellPrice: memoizedProduct.sellPrice || 0,
            costPrice: memoizedProduct.costPrice || 0,
            lensType: (memoizedProduct as any).lensType || "",
            typeFrame: (memoizedProduct as any).typeFrame || "",
            color: (memoizedProduct as any).color || "",
            shape: (memoizedProduct as any).shape || "",
            reference: (memoizedProduct as any).reference || "",
            stock: (memoizedProduct as any).stock || 0,
            modelSunglasses: (memoizedProduct as any).modelSunglasses || "",
          });
          
          if (memoizedProduct?.image) {
            try {
              const imageFullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${memoizedProduct.image}`;
              setImageUrl(imageFullUrl);
            } catch (error) {
              console.error("Erro ao processar URL da imagem:", error);
              setImageUrl(undefined);
            }
          }
        } else {
          // Resetar o formulário quando abrir no modo de criação
          form.reset({
            name: "",
            productType: "lenses",
            description: "",
            brand: "",
            sellPrice: 0,
            costPrice: 0,
            image: undefined,
            lensType: "",
            typeFrame: "",
            color: "",
            shape: "",
            reference: "",
            stock: 0,
            modelSunglasses: "",
          });
          setSelectedImage(null);
          setImageUrl(undefined);
        }
      });
    };
    
    handleFormReset();
  }, [memoizedProduct, isEditMode, open, form]);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const formData = new FormData();
      
      // Adicionar dados obrigatórios
      formData.append("name", data.name);
      formData.append("productType", data.productType);
      formData.append("sellPrice", data.sellPrice.toString());
      
      // Adicionar imagem se selecionada
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      
      // Adicionar dados opcionais apenas se preenchidos
      if (data.description && data.description.trim()) {
        formData.append("description", data.description);
      }
      if (data.brand && data.brand.trim()) {
        formData.append("brand", data.brand);
      }
      if (data.costPrice && data.costPrice > 0) {
        formData.append("costPrice", data.costPrice.toString());
      }
      
      // Campos específicos por tipo
      if (data.productType === "lenses" && data.lensType && data.lensType.trim()) {
        formData.append("lensType", data.lensType);
      }
      
      if (data.productType === "prescription_frame" || data.productType === "sunglasses_frame") {
        if (data.typeFrame && data.typeFrame.trim()) formData.append("typeFrame", data.typeFrame);
        if (data.color && data.color.trim()) formData.append("color", data.color);
        if (data.shape && data.shape.trim()) formData.append("shape", data.shape);
        if (data.reference && data.reference.trim()) formData.append("reference", data.reference);
        if (data.stock !== undefined && data.stock >= 0) formData.append("stock", data.stock.toString());
        
        if (data.productType === "sunglasses_frame" && data.modelSunglasses && data.modelSunglasses.trim()) {
          formData.append("modelSunglasses", data.modelSunglasses);
        }
      }

      if (isEditMode && memoizedProduct) {
        // Atualizar produto existente
        await updateProductMutation.mutateAsync({
          id: memoizedProduct._id,
          formData
        });
        
        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        // Criar novo produto
        await createProductMutation.mutateAsync(formData);
        
        toast({
          title: "Produto cadastrado",
          description: "O produto foi cadastrado com sucesso.",
        });
      }
      
      // Fechar dropdowns antes de resetar
      document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.style.display !== 'none') {
          const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(escEvent);
        }
      });
      
      // Resetar formulário e fechar dialog
      form.reset();
      setSelectedImage(null);
      setImageUrl(undefined);
      onOpenChange(false);
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} produto:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.response?.data?.message || `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} produto`,
      });
    }
  };

  const handleCancel = () => {
    // Fechar dropdowns antes de resetar
    document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach((element) => {
      const htmlElement = element as HTMLElement;
      if (htmlElement.style.display !== 'none') {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(escEvent);
      }
    });
    
    // Remover foco
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    
    // Resetar formulário
    form.reset();
    setSelectedImage(null);
    setImageUrl(undefined);
    onOpenChange(false);
  };

  const isPending = isEditMode ? updateProductMutation.isPending : createProductMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevenir fechamento acidental por cliques em dropdowns
          const target = e.target as Element;
          if (target?.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edite as informações do produto'
              : 'Cadastre um novo produto no sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Campo de Imagem - Primeiro */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Foto do Produto
              </h3>
              
              <ImageUpload
                value={selectedImage}
                onChange={setSelectedImage}
                disabled={isPending}
                existingImageUrl={imageUrl}
              />
            </div>

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-600" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Produto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lenses">{getProductTypeName("lenses")}</SelectItem>
                          <SelectItem value="clean_lenses">{getProductTypeName("clean_lenses")}</SelectItem>
                          <SelectItem value="prescription_frame">{getProductTypeName("prescription_frame")}</SelectItem>
                          <SelectItem value="sunglasses_frame">{getProductTypeName("sunglasses_frame")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Marca (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sellPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0,00" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0,00 (opcional)" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do produto (opcional)"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campos específicos por tipo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Informações Específicas - {getProductTypeName(watchedProductType)}
              </h3>

              {watchedProductType === "lenses" && (
                <FormField
                  control={form.control}
                  name="lensType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Lente</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Monofocal, Multifocal, Progressiva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(watchedProductType === "prescription_frame" || watchedProductType === "sunglasses_frame") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchedProductType === "sunglasses_frame" && (
                    <FormField
                      control={form.control}
                      name="modelSunglasses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo</FormLabel>
                          <FormControl>
                            <Input placeholder="Modelo dos óculos de sol" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="typeFrame"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Armação</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Acetato, Metal, TR90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input placeholder="Cor da armação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shape"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Redondo, Quadrado, Aviador" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referência</FormLabel>
                        <FormControl>
                          <Input placeholder="Referência do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="Quantidade em estoque" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="min-w-[120px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Salvando...' : 'Cadastrando...'}
                  </>
                ) : (
                  isEditMode ? 'Salvar Alterações' : 'Cadastrar Produto'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 