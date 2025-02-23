"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "../../../../hooks/use-toast";
import { api } from "../../../services/auth";
import { useRef } from "react";
// import { useRouteGuard } from "@/hooks/useRouteGuard";
// import { Loader2 } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  category: z.enum(["solar", "grau"], {
    required_error: "Selecione uma categoria",
  }),
  description: z.string().min(10, "Descrição muito curta"),
  image: z.string(),
  brand: z.string().min(2, "Marca inválida"),
  modelGlasses: z.string().min(2, "Modelo inválido"),
  price: z.number().min(0, "Preço inválido"),
  stock: z.number().min(0, "Quantidade inválida"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function NewProductPage() {
  // const { isAuthorized, isLoading } = useRouteGuard(["admin", "employee"]);
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null); // Referência para o input de arquivo

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "solar",
      description: "",
      brand: "",
      modelGlasses: "",
      price: 0,
      stock: 0,
    },
  });

  const createProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const formData = new FormData(); // Crie um FormData

      // Adicione os campos do formulário ao FormData
      // biome-ignore lint/complexity/noForEach: <explanation>
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Adicione o arquivo de imagem ao FormData, se existir
      if (fileInputRef.current?.files?.[0]) {
        formData.append("image", fileInputRef.current.files[0]);
      }

      return api.post("/api/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Defina o tipo de conteúdo como multipart/form-data
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Produto cadastrado",
        description: "O produto foi cadastrado com sucesso.",
      });
      router.push("/products");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cadastrar produto. Tente novamente.",
      });
    },
  });

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }

  // if (!isAuthorized) {
  //   return null;
  // }

  function onSubmit(data: ProductFormData) {
    createProduct.mutate(data);
  }

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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="solar">Óculos de Sol</SelectItem>
                        <SelectItem value="grau">Óculos de Grau</SelectItem>
                      </SelectContent>
                    </Select>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        placeholder="Selecione a imagem do produto"
                        ref={fileInputRef} // Use a referência aqui
                        onChange={(e) => {
                          // Atualize o valor do campo no react-hook-form
                          field.onChange(e.target.files?.[0]?.name || "");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="modelGlasses"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseFloat(e.target.value))
                          }
                        />
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
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseInt(e.target.value))
                          }
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
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
