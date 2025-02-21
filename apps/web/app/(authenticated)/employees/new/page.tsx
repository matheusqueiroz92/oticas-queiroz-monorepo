"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
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

const employeeFormSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
    phone: z.string().min(10, "Telefone inválido"),
    address: z.string().min(10, "Endereço muito curto"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const { confirmPassword, ...employeeData } = data;
      return api.post("/api/auth/register", {
        ...employeeData,
        role: "employee",
      });
    },
    onSuccess: () => {
      toast({
        title: "Funcionário cadastrado",
        description: "O funcionário foi cadastrado com sucesso.",
      });
      router.push("/employees");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cadastrar funcionário. Tente novamente.",
      });
    },
  });

  function onSubmit(data: EmployeeFormData) {
    createEmployee.mutate(data);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo Funcionário</CardTitle>
          <CardDescription>
            Cadastre um novo funcionário no sistema
          </CardDescription>
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

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createEmployee.isPending}>
                  {createEmployee.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
