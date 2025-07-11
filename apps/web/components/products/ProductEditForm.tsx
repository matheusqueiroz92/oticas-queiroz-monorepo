import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
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
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  DollarSign, 
  Info,
  Tag,
} from "lucide-react";
import { Product } from "@/app/_types/product";
import { getProductTypeName } from "@/app/_utils/product-utils";

interface ProductEditFormProps {
  product: Product | null;
  loading: boolean;
  isSubmitting: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const steps = [
  { id: "basic", label: "Informações Básicas" },
  { id: "details", label: "Detalhes Específicos" },
  { id: "price", label: "Preço e Estoque" },
];

export function ProductEditForm({
  product,
  loading,
  isSubmitting,
  onSubmit,
  onCancel
}: ProductEditFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProductType, setSelectedProductType] = useState<Product['productType'] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
    if (product) {
      form.reset({
        name: product.name || "",
        productType: product.productType,
        description: product.description || "",
        brand: product.brand || "",
        sellPrice: typeof product.sellPrice === 'string' ? 
          parseFloat(product.sellPrice) : 
          (product.sellPrice || 0),
        costPrice: typeof product.costPrice === 'string' ? 
          parseFloat(product.costPrice) : 
          (product.costPrice || 0)
      });
      
      setSelectedProductType(product.productType);
      
      if (product.image) {
        setPreviewUrl(`${process.env.NEXT_PUBLIC_API_URL}${product.image}`);
      }

      if (product.productType === "lenses") {
        form.setValue("lensType", (product as any).lensType || "");
      } else if (product.productType === "prescription_frame" || product.productType === "sunglasses_frame") {
        form.setValue("typeFrame", (product as any).typeFrame || "");
        form.setValue("color", (product as any).color || "");
        form.setValue("shape", (product as any).shape || "");
        form.setValue("reference", (product as any).reference || "");
        
        const stockValue = Number((product as any).stock);
        form.setValue("stock", isNaN(stockValue) ? 0 : stockValue);
        
        if (product.productType === "sunglasses_frame") {
          form.setValue("modelSunglasses", (product as any).modelSunglasses || "");
        }
      }
    }
  }, [product, form]);

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

  const handleButtonClick = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    } else {
      console.error("Form element not found");
      onSubmit(form.getValues());
    }
  };

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
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

            {/* Campo de upload de imagem fora do FormField para evitar erro de tipagem e garantir o nome correto */}
            <div className="mb-4">
              <label className="flex items-center gap-1 font-medium text-sm mb-1">
                Imagem do Produto
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="h-10"
                    name="productImage"
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
            </div>
          </div>
        );
      
      case 1:
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
      
      case 2:
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
                          value={field.value || 0}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : 0;
                            field.onChange(value);
                          }}
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
                          value={field.value || 0}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : 0;
                            field.onChange(value);
                          }}
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
      case 0:
        canContinue = 
          !!form.getValues("name") && 
          !!form.getValues("productType");
        break;
      case 1:
        if (selectedProductType === "lenses") {
          canContinue = !!form.getValues("lensType");
        }
        else if (selectedProductType === "prescription_frame" || selectedProductType === "sunglasses_frame") {
          canContinue = 
            !!form.getValues("typeFrame") && 
            !!form.getValues("color") && 
            !!form.getValues("shape") && 
            !!form.getValues("reference");
          
          if (selectedProductType === "sunglasses_frame") {
            canContinue = canContinue && !!form.getValues("modelSunglasses");
          }
        }
        break;
      case 2:
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

  if (!product) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
        <p className="font-medium">Produto não encontrado</p>
        <p className="text-sm mt-1">Não foi possível encontrar o produto especificado.</p>
        <Button className="mt-4" onClick={onCancel}>
          Voltar para Produtos
        </Button>
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 flex flex-row items-center border-b bg-gray-50">
        <div className="flex-1">
          <CardTitle className="text-xl">
            {product.name}
          </CardTitle>
          <CardDescription>
            Edite as informações do produto
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form id="editProductForm" ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              onClick={prevStep}
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
            onClick={onCancel}
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
              onClick={handleButtonClick}
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
  );
}