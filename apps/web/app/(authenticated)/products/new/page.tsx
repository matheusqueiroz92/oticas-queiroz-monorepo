"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/app/types/product";

const baseProductSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  productType: z.enum(["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"], {
    required_error: "Selecione um tipo de produto",
  }),
  description: z.string().optional(),
  image: z.instanceof(File).optional(),
  brand: z.string().optional(),
  sellPrice: z.number().min(0, "Preço de venda inválido"),
  costPrice: z.number().min(0, "Preço de custo inválido").optional(),
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

// Union schema para validação
const productFormSchema = z.discriminatedUnion("productType", [
  lensSchema,
  cleanLensSchema,
  prescriptionFrameSchema,
  sunglassesFrameSchema
]);

type ProductFormData = z.infer<typeof productFormSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleCreateProduct } = useProducts();
  const [selectedProductType, setSelectedProductType] = useState<Product['productType']>("clean_lenses");

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
      
      if (value === "sunglasses_frame") {
        form.setValue("modelSunglasses", "");
      }
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

  const renderProductTypeFields = () => {
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
                name="modelSunglasses"
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo Produto</CardTitle>
          <CardDescription>Cadastre um novo produto no sistema</CardDescription>
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
                    <Select
                      onValueChange={(value) => onProductTypeChange(value as Product['productType'])}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Imagem</FormLabel>
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
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar"
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