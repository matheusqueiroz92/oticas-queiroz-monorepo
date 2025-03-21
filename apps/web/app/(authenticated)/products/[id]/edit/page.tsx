"use client";

import { useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/app/types/product";

// Reutilize os schemas de validação da página new

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentProduct, fetchProductById, handleUpdateProduct, loading } = useProducts();
  const [selectedProductType, setSelectedProductType] = useState<Product['productType'] | null>(null);

  // Formulário com dados iniciais vazios
  const form = useForm<any>({
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      sellPrice: 0,
      costPrice: 0,
    },
  });

  // Buscar produto quando o componente for montado
  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  // Preencher o formulário quando os dados do produto forem carregados
  useEffect(() => {
    if (currentProduct) {
      setSelectedProductType(currentProduct.productType);
      
      // Campos comuns
      form.reset({
        name: currentProduct.name,
        productType: currentProduct.productType,
        description: currentProduct.description,
        brand: currentProduct.brand || "",
        sellPrice: currentProduct.sellPrice,
        costPrice: currentProduct.costPrice || 0,
      });
      
      // Campos específicos
      if (currentProduct.productType === "lenses") {
        form.setValue("lensType", (currentProduct as any).lensType);
      } else if (currentProduct.productType === "prescription_frame" || currentProduct.productType === "sunglasses_frame") {
        form.setValue("typeFrame", (currentProduct as any).typeFrame);
        form.setValue("color", (currentProduct as any).color);
        form.setValue("shape", (currentProduct as any).shape);
        form.setValue("reference", (currentProduct as any).reference);
        
        if (currentProduct.productType === "sunglasses_frame") {
          form.setValue("model", (currentProduct as any).model);
        }
      }
    }
  }, [currentProduct, form]);

  // Não podemos alterar o tipo de produto na edição
  const renderProductTypeFields = () => {
    if (!selectedProductType) return null;
    
    switch (selectedProductType) {
      case "lenses":
        return (
          <FormField
            control={form.control}
            name="lensType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Lente</FormLabel>
                <FormControl>
                  <Input placeholder="Tipo de lente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "prescription_frame":
      case "sunglasses_frame":
        return (
          <>
            {selectedProductType === "sunglasses_frame" && (
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Modelo" {...field} />
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
                    <Input placeholder="Tipo de armação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Input placeholder="Cor" {...field} />
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
                      <Input placeholder="Formato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência</FormLabel>
                  <FormControl>
                    <Input placeholder="Referência" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      
      case "clean_lenses":
      default:
        return null;
    }
  };

  async function onSubmit(data: any) {
    if (!id || !currentProduct) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Adicionar todos os campos comuns
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("sellPrice", String(data.sellPrice));
      
      if (data.brand) formData.append("brand", data.brand);
      if (data.costPrice !== undefined) formData.append("costPrice", String(data.costPrice));

      // Adicionar campos específicos com base no tipo de produto
      if (currentProduct.productType === "lenses") {
        formData.append("lensType", data.lensType);
      } else if (currentProduct.productType === "prescription_frame" || currentProduct.productType === "sunglasses_frame") {
        formData.append("typeFrame", data.typeFrame);
        formData.append("color", data.color);
        formData.append("shape", data.shape);
        formData.append("reference", data.reference);
        
        if (currentProduct.productType === "sunglasses_frame") {
          formData.append("model", data.model);
        }
      }

      // Adicionar imagem se existir
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("productImage", file);
      }

      const updatedProduct = await handleUpdateProduct(id as string, formData);
      if (updatedProduct) {
        router.push(`/products/${id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Produto não encontrado
        <Button className="mt-4" onClick={() => router.push("/products")}>
          Voltar para Produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar Produto</CardTitle>
          <CardDescription>Altere os dados do produto</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Produto</FormLabel>
                    <FormControl>
                      <Input 
                        value={currentProduct ? getProductTypeName(currentProduct.productType) : ""} 
                        disabled 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição detalhada do produto"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange } }) => (
                  <FormItem>
                    <FormLabel>Imagem (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {currentProduct.image && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Imagem atual:</p>
                        <div className="h-20 w-20 bg-muted rounded-md overflow-hidden">
                          <img
                            src={`http://localhost:3333${currentProduct.image}`}
                            alt={currentProduct.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
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
                      <Input placeholder="Marca" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos específicos do tipo de produto */}
              {renderProductTypeFields()}

              <div className="grid grid-cols-2 gap-4">
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
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          value={field.value}
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
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number.parseFloat(e.target.value) : undefined
                            )
                          }
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Função auxiliar para obter o nome amigável do tipo de produto
function getProductTypeName(productType: Product['productType']): string {
  switch (productType) {
    case 'lenses':
      return 'Lentes';
    case 'clean_lenses':
      return 'Limpa-lentes';
    case 'prescription_frame':
      return 'Armação de Grau';
    case 'sunglasses_frame':
      return 'Armação Solar';
    default:
      return 'Produto';
  }
}