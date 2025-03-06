"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "../../../services/auth";
import type { AxiosError } from "axios";

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Schema para validação
const laboratoryFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  contactName: z
    .string()
    .min(3, "Nome do contato deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
  address: z.object({
    street: z.string().min(3, "Rua deve ter pelo menos 3 caracteres"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres"),
    city: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
    state: z.string().length(2, "Estado deve ter 2 caracteres (sigla)"),
    zipCode: z
      .string()
      .regex(/^\d{8}$/, "CEP inválido (somente números, 8 dígitos)"),
  }),
  isActive: z.boolean().default(true),
});

type LaboratoryFormData = z.infer<typeof laboratoryFormSchema>;

export default function NewLaboratoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Inicializar o formulário
  const form = useForm<LaboratoryFormData>({
    resolver: zodResolver(laboratoryFormSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
      isActive: true,
    },
  });

  // Mutation para criar um novo laboratório
  const createLaboratory = useMutation({
    mutationFn: async (data: LaboratoryFormData) => {
      try {
        const response = await api.post("/api/laboratories", data);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        console.error(
          "Detalhes do erro da API:",
          axiosError.response?.data || axiosError.message
        );
        throw axiosError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Laboratório cadastrado",
        description: "O laboratório foi cadastrado com sucesso.",
      });
      router.push("/laboratories");
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error("Erro ao cadastrar laboratório:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erro ao cadastrar laboratório. Tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    },
  });

  // Função de submissão do formulário
  function onSubmit(data: LaboratoryFormData) {
    createLaboratory.mutate(data);
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo Laboratório</CardTitle>
          <CardDescription>
            Cadastre um novo laboratório no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Informações Básicas</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Laboratório</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do laboratório" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome da pessoa de contato"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email de contato"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Telefone (somente números)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-base font-medium">Endereço</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rua</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address.number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="Número" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address.complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Complemento (opcional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CEP (somente números)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/laboratories")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createLaboratory.isPending}>
                  {createLaboratory.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
