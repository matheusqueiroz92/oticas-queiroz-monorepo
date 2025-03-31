"use client";

import { useRouter } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { 
  Loader2, 
  ShoppingBag, 
  Tag, 
  DollarSign, 
  ChevronRight, 
  CheckCircle2,
  Image,
  Info,
  Package
} from "lucide-react";
import { useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/app/types/product";
import { createProductForm, ProductFormData } from "@/schemas/product-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const steps = [
  { id: "basic", label: "Informações Básicas" },
  { id: "details", label: "Detalhes Específicos" },
  { id: "price", label: "Preço e Estoque" },
];

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleCreateProduct } = useProducts();
  const [selectedProductType, setSelectedProductType] = useState<Product['productType']>("clean_lenses");
  const [currentStep, setCurrentStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = createProductForm();

  const onProductTypeChange = (value: Product['productType']) => {
    setSelectedProductType(value);
    form.setValue("productType", value);
    
    if (value === "lenses") {
      form.setValue("lensType", "");
    } else if (value === "prescription_frame" || value === "sunglasses_frame") {
      form.setValue("typeFrame", "");
      form.setValue("color", "");
      form.setValue("shape", "");
      form.setValue("reference", "");
      form.setValue("stock", 0);
      
      if (value === "sunglasses_frame") {
        form.setValue("modelSunglasses", "");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", file);
    } else {
      setPreviewUrl(null);
    }
  };

  async function onSubmit(data: ProductFormData) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("productType", data.productType);
      formData.append("sellPrice", String(data.sellPrice));
      
      if (data.description) formData.append("description", data.description);
      if (data.brand) formData.append("brand", data.brand);
      if (data.costPrice !== undefined) formData.append("costPrice", String(data.costPrice));

      if (data.productType === "lenses") {
        formData.append("lensType", (data as any).lensType);
      } else if (data.productType === "prescription_frame" || data.productType === "sunglasses_frame") {
        formData.append("typeFrame", (data as any).typeFrame);
        formData.append("color", (data as any).color);
        formData.append("shape", (data as any).shape);
        formData.append("reference", (data as any).reference);
        formData.append("stock", String((data as any).stock || 0));
        
        if (data.productType === "sunglasses_frame") {
          formData.append("modelSunglasses", (data as any).modelSunglasses);
        }
      }

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("productImage", file);
      }

      const newProduct = await handleCreateProduct(formData);
      if (newProduct) {
        router.push("/products");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProductTypeIcon = () => {
    switch (selectedProductType) {
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

  const getProductTypeName = (type: Product['productType']) => {
    switch (type) {
      case "lenses": return "Lentes";
      case "clean_lenses": return "Limpa-lentes";
      case "prescription_frame": return "Armação de Grau";
      case "sunglasses_frame": return "Armação Solar";
      default: return type;
    }
  };

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
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Tag className="h-4 w-4 text-primary" />
                        Tipo de Produto
                      </FormLabel>
                      <Select
                        onValueChange={(value) => onProductTypeChange(value as Product['productType'])}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecione o tipo de produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lenses">Lentes</SelectItem>
                          <SelectItem value="clean_lenses">Limpa-lentes</SelectItem>
                          <SelectItem value="prescription_frame">Armação de Grau</SelectItem>
                          <SelectItem value="sunglasses_frame">Armação Solar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
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
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <ShoppingBag className="h-4 w-4 text-primary" />
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
                    <Image className="h-4 w-4 text-primary" />
                    Imagem do Produto
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Arquivos suportados: JPEG, PNG, WebP
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
                            <Image className="h-8 w-8 mb-2 opacity-20" />
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
            <Card className="border shadow-sm bg-gray-50">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  {getProductTypeIcon()}
                  <CardTitle className="text-base">{getProductTypeName(selectedProductType)}</CardTitle>
                </div>
                <CardDescription>
                  Preencha os detalhes específicos para este tipo de produto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {selectedProductType === "lenses" && (
                  <FormField
                    control={form.control}
                    name="lensType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Lente</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Multifocal, Anti-reflexo, etc." {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {(selectedProductType === "prescription_frame" || selectedProductType === "sunglasses_frame") && (
                  <>
                    {selectedProductType === "sunglasses_frame" && (
                      <FormField
                        control={form.control}
                        name="modelSunglasses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do modelo" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="typeFrame"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Armação</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Metal, Acetato, etc." {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor</FormLabel>
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
                            <FormLabel>Formato</FormLabel>
                            <FormControl>
                              <Input placeholder="Formato" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referência</FormLabel>
                            <FormControl>
                              <Input placeholder="Código de referência" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
                
                {selectedProductType === "clean_lenses" && (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>Produtos do tipo "Limpa-lentes" não possuem campos específicos adicionais.</p>
                    <p className="text-sm mt-1">Você pode avançar para a próxima etapa.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      
      case 2: // Preço e Estoque
        return (
          <div className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Informações de Preço
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </CardContent>
            </Card>

            {(selectedProductType === "prescription_frame" || selectedProductType === "sunglasses_frame") && (
              <Card className="border shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Informações de Estoque
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade em Estoque</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Quantidade"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value) || 0
                              )
                            }
                            value={field.value === undefined ? "" : field.value}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const checkCanContinue = () => {
    // Verificar se o formulário está inicializado
    if (!form || !form.getValues) return false;
    
    let canContinue = true;
    
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
        canContinue = (form.getValues("sellPrice") || 0) > 0;
        break;
    }
    
    return canContinue;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50 p-4 flex flex-row items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getProductTypeIcon()}
            </div>
            <div>
              <CardTitle className="text-xl">Novo Produto</CardTitle>
              <CardDescription>Cadastre um novo produto no sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form id="productForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStepProgress()}
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
              >
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
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
                onClick={nextStep}
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
                  const formElement = document.getElementById('productForm') as HTMLFormElement;
                  if (formElement) {
                    formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  } else {
                    console.error("Form element not found");
                    onSubmit(form.getValues() as ProductFormData);
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Cadastrar Produto"
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}