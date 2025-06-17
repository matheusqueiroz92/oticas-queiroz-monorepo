"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package, DollarSign, Tag } from "lucide-react";
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

// Schema de validação baseado no schema existente
const baseProductSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  productType: z.enum(["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"], {
    required_error: "Selecione um tipo de produto",
  }),
  description: z.string().optional(),
  image: z.any().optional(),
  brand: z.string().optional(),
  sellPrice: z.coerce.number().min(0, "Preço de venda deve ser maior que zero"),
  costPrice: z.coerce.number().min(0, "Preço de custo inválido").optional(),
});

const lensSchema = baseProductSchema.extend({
  productType: z.literal("lenses"),
  lensType: z.string().min(2, "Tipo de lente é obrigatório"),
});

const cleanLensSchema = baseProductSchema.extend({
  productType: z.literal("clean_lenses"),
});

const frameBaseSchema = {
  typeFrame: z.string().min(2, "Tipo de armação é obrigatório"),
  color: z.string().min(2, "Cor é obrigatória"),
  shape: z.string().min(2, "Formato é obrigatório"),
  reference: z.string().min(2, "Referência é obrigatória"),
  stock: z.coerce.number().min(0, "Estoque deve ser maior ou igual a zero").optional(),
};

const prescriptionFrameSchema = baseProductSchema.extend({
  productType: z.literal("prescription_frame"),
  ...frameBaseSchema,
});

const sunglassesFrameSchema = baseProductSchema.extend({
  productType: z.literal("sunglasses_frame"),
  modelSunglasses: z.string().min(2, "Modelo é obrigatório"),
  ...frameBaseSchema,
});

const productFormSchema = z.discriminatedUnion("productType", [
  lensSchema,
  cleanLensSchema,
  prescriptionFrameSchema,
  sunglassesFrameSchema
]);

type ProductFormData = z.infer<typeof productFormSchema>;

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
  mode = 'create',
}: ProductDialogProps) {
  const { handleCreateProduct, handleUpdateProduct, isCreating, isUpdating } = useProducts();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // Memoizar o produto para evitar renderizações desnecessárias
  const memoizedProduct = useMemo(() => product, [product?._id]);

  const isEditMode = mode === 'edit';
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      productType: "lenses",
      description: "",
      brand: "",
      sellPrice: 0,
      costPrice: 0,
      image: undefined,
    } as any,
  });

  // Observar mudanças no tipo de produto para resetar campos específicos
  const watchedProductType = form.watch("productType");

  // Preencher o formulário quando estiver no modo de edição
  useEffect(() => {
    if (!open) return;

    const handleFormReset = () => {
      if (isEditMode && memoizedProduct) {
        // Criar objeto base com campos comuns
        const baseData: any = {
          name: memoizedProduct.name || "",
          productType: memoizedProduct.productType,
          description: memoizedProduct.description || "",
          brand: memoizedProduct.brand || "",
          sellPrice: memoizedProduct.sellPrice || 0,
          costPrice: memoizedProduct.costPrice || 0,
        };

        // Adicionar campos específicos baseados no tipo
        switch (memoizedProduct.productType) {
          case "lenses":
            if ('lensType' in memoizedProduct) {
              baseData.lensType = memoizedProduct.lensType || "";
            }
            break;
          case "prescription_frame":
            if ('typeFrame' in memoizedProduct) {
              baseData.typeFrame = memoizedProduct.typeFrame || "";
              baseData.color = memoizedProduct.color || "";
              baseData.shape = memoizedProduct.shape || "";
              baseData.reference = memoizedProduct.reference || "";
              baseData.stock = memoizedProduct.stock || 0;
            }
            break;
          case "sunglasses_frame":
            if ('modelSunglasses' in memoizedProduct) {
              baseData.modelSunglasses = memoizedProduct.modelSunglasses || "";
              baseData.typeFrame = memoizedProduct.typeFrame || "";
              baseData.color = memoizedProduct.color || "";
              baseData.shape = memoizedProduct.shape || "";
              baseData.reference = memoizedProduct.reference || "";
              baseData.stock = memoizedProduct.stock || 0;
            }
            break;
        }

        form.reset(baseData);
        
        // Definir URL da imagem se existir
        if (memoizedProduct?.image) {
          setImageUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${memoizedProduct.image}`);
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
        } as any);
        setSelectedImage(null);
        setImageUrl(undefined);
      }
    };
    
    handleFormReset();
  }, [memoizedProduct, isEditMode, open, form]);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const formData = new FormData();
      
      // Adicionar dados básicos
      formData.append("name", data.name);
      formData.append("productType", data.productType);
      formData.append("sellPrice", data.sellPrice.toString());
      
      // Adicionar dados opcionais se preenchidos
      if (data.description && data.description.trim()) {
        formData.append("description", data.description);
      }
      if (data.brand && data.brand.trim()) {
        formData.append("brand", data.brand);
      }
      if (data.costPrice && data.costPrice > 0) {
        formData.append("costPrice", data.costPrice.toString());
      }
      
      // Adicionar imagem se selecionada
      if (selectedImage) {
        formData.append("productImage", selectedImage);
      }
      
      // Adicionar campos específicos baseados no tipo
      switch (data.productType) {
        case "lenses":
          if ('lensType' in data && data.lensType) {
            formData.append("lensType", data.lensType);
          }
          break;
        case "prescription_frame":
          if ('typeFrame' in data) {
            formData.append("typeFrame", data.typeFrame || "");
            formData.append("color", data.color || "");
            formData.append("shape", data.shape || "");
            formData.append("reference", data.reference || "");
            if (data.stock !== undefined && data.stock >= 0) {
              formData.append("stock", data.stock.toString());
            }
          }
          break;
        case "sunglasses_frame":
          if ('modelSunglasses' in data) {
            formData.append("modelSunglasses", data.modelSunglasses || "");
            formData.append("typeFrame", data.typeFrame || "");
            formData.append("color", data.color || "");
            formData.append("shape", data.shape || "");
            formData.append("reference", data.reference || "");
            if (data.stock !== undefined && data.stock >= 0) {
              formData.append("stock", data.stock.toString());
            }
          }
          break;
      }

      if (isEditMode && memoizedProduct) {
        // Atualizar produto existente
        await handleUpdateProduct(memoizedProduct._id, formData);
        
        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        // Criar novo produto
        await handleCreateProduct(formData);
        
        toast({
          title: "Produto cadastrado",
          description: "O produto foi cadastrado com sucesso.",
        });
      }
      
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
    form.reset();
    setSelectedImage(null);
    setImageUrl(undefined);
    onOpenChange(false);
  };

  const isPending = isEditMode ? isUpdating : isCreating;

  // Renderizar campos específicos baseados no tipo de produto
  const renderProductTypeFields = () => {
    switch (watchedProductType) {
      case "lenses":
        return (
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
        );
      
      case "prescription_frame":
      case "sunglasses_frame":
        return (
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
                    <Input placeholder="Código/referência do produto" {...field} />
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
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edite as informações do produto no sistema'
              : 'Cadastre um novo produto no sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Campo de Imagem */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Imagem do Produto
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="Marca do produto (opcional)" {...field} />
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
                        placeholder="Descrição detalhada do produto (opcional)"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preços */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Preços
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Preço de Custo (opcional)</FormLabel>
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
              </div>
            </div>

            {/* Campos específicos do tipo de produto */}
            {renderProductTypeFields() && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Informações Específicas - {getProductTypeName(watchedProductType)}
                </h3>
                
                {renderProductTypeFields()}
              </div>
            )}

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