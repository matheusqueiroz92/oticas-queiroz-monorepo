"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { api } from "../../app/services/auth";
import { useRef } from "react";
import type { AxiosError } from "axios";

// Tipo de usuário: customer ou employee
export type UserType = "customer" | "employee";

// Props do componente
interface UserRegistrationFormProps {
  userType: UserType;
  redirectTo: string;
  title: string;
  description: string;
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Schema base para validação
const userFormSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
    phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
    address: z.string().min(10, "Endereço muito curto"),
    cpf: z.string().regex(/^\d{11}$/, "CPF inválido"),
    rg: z.string().regex(/^\d{7,10}$/, "RG inválido"),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida"),
    // Campo image definido como File ou undefined
    image: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

type UserFormData = z.infer<typeof userFormSchema>;

export default function UserRegistrationForm({
  userType,
  redirectTo,
  title,
  description,
}: UserRegistrationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      cpf: "",
      rg: "",
      birthDate: "",
      image: undefined,
    },
  });

  const createUser = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        const response = await api.post("/api/auth/register", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response;
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        console.error(
          "Detalhes do erro da API:",
          axiosError.response?.data || axiosError.message
        );
        if (axiosError.response?.data?.errors) {
          console.error(
            "Erros de validação:",
            JSON.stringify(axiosError.response.data.errors, null, 2)
          );
        }
        throw axiosError;
      }
    },
    onSuccess: () => {
      toast({
        title:
          userType === "customer"
            ? "Cliente cadastrado"
            : "Funcionário cadastrado",
        description:
          userType === "customer"
            ? "O cliente foi cadastrado com sucesso."
            : "O funcionário foi cadastrado com sucesso.",
      });
      router.push(redirectTo);
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error(
        `Erro ao cadastrar ${userType === "customer" ? "cliente" : "funcionário"}:`,
        error
      );

      const errorMessage =
        error.response?.data?.message ||
        `Erro ao cadastrar ${userType === "customer" ? "cliente" : "funcionário"}. Tente novamente.`;

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    },
  });

  function onSubmit(data: UserFormData) {
    const formData = new FormData();

    // Adicionar todos os campos de texto
    for (const [key, value] of Object.entries(data)) {
      if (key !== "image" && key !== "confirmPassword") {
        formData.append(key, String(value));
      }
    }

    // Adicionar role de acordo com o tipo de usuário
    formData.append("role", userType);

    // Adicionar imagem se existir
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      console.log("Enviando arquivo:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // O nome do campo DEVE corresponder ao configurado na rota no backend
      formData.append("userImage", file);
    }

    // Log para debug
    console.log("Enviando dados do formulário:");
    for (const pair of formData.entries()) {
      console.log(
        `${pair[0]}: ${typeof pair[1] === "object" ? `Arquivo: ${(pair[1] as File).name}` : pair[1]}`
      );
    }

    // Enviar o FormData
    createUser.mutate(formData);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirme a senha"
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
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
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
                            onChange(file); // Atualiza o estado do formulário
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
