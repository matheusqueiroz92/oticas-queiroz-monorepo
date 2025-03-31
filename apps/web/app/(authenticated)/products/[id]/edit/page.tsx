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
  CardFooter,
} from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, Package, DollarSign, Info, Tag } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/app/types/product";
import { getProductTypeName } from "@/app/utils/product-utils";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { currentProduct, fetchProductById, handleUpdateProduct, loading } = useProducts();
  const [selectedProductType, setSelectedProductType] = useState<Product['productType'] | null>(null);

  const form = useForm<any>({
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      sellPrice: 0,
      costPrice: 0,
    },
  });

  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  useEffect(() => {
    if (currentProduct) {
      setSelectedProductType(currentProduct.productType);
      
      // Set preview URL for image
      if (currentProduct.image) {
        setPreviewUrl(`${process.env.NEXT_PUBLIC_API_URL}${currentProduct.image}`);
      }
      
      form.reset({
        name: currentProduct.name,
        productType: currentProduct.productType,
        description: currentProduct.description,
        brand: currentProduct.brand || "",
        sellPrice: currentProduct.sellPrice,
        costPrice: currentProduct.costPrice || 0,
      });
      
      if (currentProduct.productType === "lenses") {
        form.setValue("lensType", (currentProduct as any).lensType);
      } else if (currentProduct.productType === "prescription_frame" || currentProduct.productType === "sunglasses_frame") {
        form.setValue("typeFrame", (currentProduct as any).typeFrame);
        form.setValue("color", (currentProduct as any).color);
        form.setValue("shape", (currentProduct as any).shape);
        form.setValue("reference", (currentProduct as any).reference);
        form.setValue("stock", (currentProduct as any).stock);
        
        if (currentProduct.productType === "sunglasses_frame") {
          form.setValue("modelSunglasses", (currentProduct as any).modelSunglasses);
        }
      }
    }
  }, [currentProduct, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", file);
    }
  };

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
                <FormLabel className="flex items-center gap-1">
                  <Info className="h-4 w-4 text-primary" />
                  Tipo de Lente
                </FormLabel>
                <FormControl>
                  <Input placeholder="Tipo de lente" {...field} className="h-10" />
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
                name="modelSunglasses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Tag className="h-4 w-4 text-primary" />
                      Modelo
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Modelo" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="typeFrame"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Info className="h-4 w-4 text-primary" />
                      Tipo de Armação
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Tipo de armação" {...field} className="h-10" />
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
                    <FormLabel className="flex items-center gap-1">
                      <Tag className="h-4 w-4 text-primary" />
                      Referência
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Referência" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <span className="h-4 w-4 rounded-full bg-primary/20"></span>
                      Cor
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Cor" {...field} className="h-10" />
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
                    <FormLabel className="flex items-center gap-1">
                      <span className="h-4 w-4 border border-primary rounded-full"></span>
                      Formato
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Formato" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-primary" />
                    Estoque
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="Quantidade em estoque" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="h-10" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      
      case "clean_lenses":
      default:
        return (
          <div className="p-4 bg-gray-50 rounded border">
            <p className="text-sm text-muted-foreground text-center">
              Este tipo de produto não possui campos específicos adicionais.
            </p>
          </div>
        );
    }
  };

  async function onSubmit(data: any) {
    if (!id || !currentProduct) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("sellPrice", String(data.sellPrice));
      
      if (data.brand) formData.append("brand", data.brand);
      if (data.costPrice !== undefined) formData.append("costPrice", String(data.costPrice));

      if (currentProduct.productType === "lenses") {
        formData.append("lensType", data.lensType);
      } else if (currentProduct.productType === "prescription_frame" || currentProduct.productType === "sunglasses_frame") {
        formData.append("typeFrame", data.typeFrame);
        formData.append("color", data.color);
        formData.append("shape", data.shape);
        formData.append("reference", data.reference);
        formData.append("stock", String(data.stock || 0));
        
        if (currentProduct.productType === "sunglasses_frame") {
          formData.append("modelSunglasses", data.modelSunglasses);
        }
      }

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

  const steps = [
    { id: "basic", label: "Informações Básicas" },
    { id: "details", label: "Detalhes Específicos" },
    { id: "price", label: "Preço e Estoque" },
  ];

  // Renderiza o progresso dos steps
  const renderStepProgress = () => {
    return (
      <div className="w-full mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center"
              style={{ width: `${100/steps.length}%` }}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full 
                ${index < currentStep ? 'bg-green-500 text-white' : 
                  index === currentStep ? 'bg-primary text-white' : 
                  'bg-gray-200 text-gray-500'}
                ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
              onClick={() => {
                if (index <= currentStep) {
                  setCurrentStep(index);
                }
              }}
              >
                <span>{index + 1}</span>
              </div>
              <span className={`
                text-xs mt-1 text-center
                ${index === currentStep ? 'text-primary font-medium' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative w-full h-1 bg-gray-200 rounded-full mt-2">
          <div 
            className="absolute top-0 left-0 h-1 bg-primary rounded-full"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Informações Básicas
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <span className="p-1 bg-primary/10 rounded text-primary">{getProductTypeName(selectedProductType as any)}</span>
              <span className="text-sm text-muted-foreground">
                Você está editando um produto do tipo {getProductTypeName(selectedProductType as any)}
              </span>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-primary" />
                    Nome do Produto
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do produto" {...field} className="h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-primary" />
                    Marca
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Marca do produto" {...field} className="h-10" />
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
                  <FormLabel className="flex items-center gap-1">
                    <Info className="h-4 w-4 text-primary" />
                    Descrição
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do produto"
                      className="min-h-[100px]"
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
                  <FormLabel className="flex items-center gap-1">
                    Imagem do Produto
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          ref={fileInputRef}onChange={handleFileChange}
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione uma nova imagem para substituir a atual (opcional)
                        </p>
                      </div>
                      <div className="flex items-center justify-center bg-gray-50 rounded-md border h-[150px] overflow-hidden">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm flex flex-col items-center">
                            <Package className="h-8 w-8 mb-2 opacity-20" />
                            <span>Nenhuma imagem selecionada</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      
      case 1: // Detalhes Específicos
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-4 border">
              <h3 className="font-medium mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-2 text-primary" />
                Especificações para {getProductTypeName(selectedProductType as any)}
              </h3>
              <div className="space-y-4 mt-4">
                {renderProductTypeFields()}
              </div>
            </div>
          </div>
        );
      
      case 2: // Preço e Estoque
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-4 border">
              <h3 className="font-medium mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                Informações de Preço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="sellPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            value={field.value}
                            className="pl-10 h-10"
                          />
                        </div>
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
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number.parseFloat(e.target.value) : undefined
                              )
                            }
                            value={field.value === undefined ? "" : field.value}
                            className="pl-10 h-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const checkCanContinue = () => {
    let canContinue = true;
    
    if (!form) return false;
    
    switch (currentStep) {
      case 0: // Informações Básicas
        canContinue = 
          !!form.getValues("name") && 
          !!form.getValues("productType");
        break;
      case 1: // Detalhes Específicos
        // Para lentes, verificar se o tipo de lente foi preenchido
        if (selectedProductType === "lenses") {
          canContinue = !!form.getValues("lensType");
        }
        // Para armações, verificar os campos obrigatórios
        else if (selectedProductType === "prescription_frame" || selectedProductType === "sunglasses_frame") {
          canContinue = 
            !!form.getValues("typeFrame") && 
            !!form.getValues("color") && 
            !!form.getValues("shape") && 
            !!form.getValues("reference");
          
          // Para armações solares, verificar também o modelo
          if (selectedProductType === "sunglasses_frame") {
            canContinue = canContinue && !!form.getValues("modelSunglasses");
          }
        }
        // Para limpa-lentes, não há campos específicos obrigatórios
        break;
      case 2: // Preço e Estoque
        canContinue = form.getValues("sellPrice") > 0;
        break;
    }
    
    return canContinue;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          <p className="font-medium">Produto não encontrado</p>
          <p className="text-sm mt-1">Não foi possível encontrar o produto especificado.</p>
          <Button className="mt-4" onClick={() => router.push("/products")}>
            Voltar para Produtos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Produto</h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 flex flex-row items-center border-b bg-gray-50">
          <div className="flex-1">
            <CardTitle className="text-xl">
              {currentProduct.name}
            </CardTitle>
            <CardDescription>
              Edite as informações do produto
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form id="editProductForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStepProgress()}
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between p-4 border-t">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!checkCanContinue()}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="button" 
                disabled={isSubmitting || !checkCanContinue()}
                onClick={() => {
                  const formElement = document.getElementById('editProductForm') as HTMLFormElement;
                  if (formElement) {
                    formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  } else {
                    console.error("Form element not found");
                    onSubmit(form.getValues());
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
