"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import Cookies from "js-cookie";
import { PageTitle } from "@/components/PageTitle";

const profileFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido")
    .optional(),
  address: z.string().min(10, "Endereço muito curto").optional(),
  image: z.instanceof(File).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profile: user,
    isLoadingProfile: loading,
    isUpdatingProfile,
    handleUpdateProfile,
    refetchProfile,
    getUserImageUrl,
  } = useProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      image: undefined,
    },
  });

  // Atualizar os valores do formulário quando os dados do usuário carregarem
  if (user && !form.getValues("name") && !editMode) {
    form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
    });
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const formData = new FormData();

      for (const [key, value] of Object.entries(data)) {
        if (key !== "image" && value !== undefined) {
          formData.append(key, String(value));
        }
      }

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("userImage", file);
      }

      const updatedUser = await handleUpdateProfile(formData);

      if (updatedUser && updatedUser.name !== Cookies.get("name")) {
        Cookies.set("name", updatedUser.name, { expires: 1 });
      }

      setEditMode(false);
      refetchProfile();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center">
        <p>
          Não foi possível carregar o perfil.{" "}
          <Button onClick={() => router.push("/dashboard")}>Voltar</Button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Perfil"
        description="Informações do seu perfil"
      />

      <Tabs defaultValue="info">
        <TabsList className="mb-6">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Visualize ou edite suas informações
                  </CardDescription>
                </div>
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={getUserImageUrl(user.image)}
                    alt={user.name}
                  />
                  <AvatarFallback className="text-xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>

            <CardContent>
              {editMode ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
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
                            <Input
                              type="email"
                              placeholder="Email"
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
                          <FormLabel>Foto do Perfil</FormLabel>
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

                    <div className="flex justify-end space-x-4 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isUpdatingProfile}>
                        {isUpdatingProfile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Nome
                      </h3>
                      <p className="mt-1">{user.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Email
                      </h3>
                      <p className="mt-1">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Telefone
                      </h3>
                      <p className="mt-1">{user.phone || "Não informado"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Função
                      </h3>
                      <p className="mt-1 capitalize">{user.role}</p>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Endereço
                      </h3>
                      <p className="mt-1">{user.address || "Não informado"}</p>
                    </div>
                    {user.cpf && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          CPF
                        </h3>
                        <p className="mt-1">{user.cpf}</p>
                      </div>
                    )}
                    {user.role === "customer" && user.debts !== undefined && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Débitos
                        </h3>
                        <p className="mt-1">R$ {user.debts.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={() => setEditMode(true)}>
                      Editar Perfil
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie suas configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Altere sua senha para manter sua conta segura
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => router.push("/change-password")}
              >
                Alterar Senha
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
