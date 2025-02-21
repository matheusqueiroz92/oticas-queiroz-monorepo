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
import { useToast } from "../../../../hooks/use-toast";
import { api } from "../../../services/auth";
// import { useRouteGuard } from "@/hooks/useRouteGuard";
// import { Loader2 } from "lucide-react";

const customerFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().min(10, "Endereço muito curto"),
  prescription: z
    .object({
      leftEye: z.number().min(-20).max(20),
      rightEye: z.number().min(-20).max(20),
      addition: z.number().min(0).max(4).optional(),
    })
    .optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function NewCustomerPage() {
  // const { isAuthorized, isLoading } = useRouteGuard(["admin", "employee"]);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      return api.post("/api/auth/register", {
        ...data,
        role: "customer",
      });
    },
    onSuccess: () => {
      toast({
        title: "Cliente cadastrado",
        description: "O cliente foi cadastrado com sucesso.",
      });
      router.push("/customers");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cadastrar cliente. Tente novamente.",
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

  function onSubmit(data: CustomerFormData) {
    createCustomer.mutate(data);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo Cliente</CardTitle>
          <CardDescription>Cadastre um novo cliente no sistema</CardDescription>
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

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="prescription.leftEye"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olho Esquerdo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
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
                  name="prescription.rightEye"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olho Direito</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
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
                  name="prescription.addition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adição</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
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
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
