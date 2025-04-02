"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserForm, UserFormData } from "@/schemas/user-schema";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";

interface UserFormProps {
  userType: "customer" | "employee";
  title: string;
  description: string;
}

export default function UserForm({ userType, title, description }: UserFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createUserMutation } = useUsers();
  
  const form = createUserForm();

  // Efeito para preencher automaticamente a senha quando o CPF for digitado (apenas para clientes)
  useEffect(() => {
    if (userType === "customer") {
      const subscription = form.watch((value, { name }) => {
        if (name === "cpf") {
          const cpf = value.cpf;
          // Verifica se o CPF tem pelo menos 6 dígitos
          if (cpf && cpf.length >= 6) {
            // Extrai os 6 primeiros dígitos e define como senha e confirmação
            const defaultPassword = cpf.slice(0, 6);
            form.setValue("password", defaultPassword);
            form.setValue("confirmPassword", defaultPassword);
          }
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, userType]);

  const onSubmit = (data: UserFormData) => {
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
      if (key !== "image" && key !== "confirmPassword") {
        formData.append(key, String(value));
      }
    }

    formData.append("role", userType);

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      formData.append("userImage", file);
    }

    createUserMutation.mutate(formData);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {userType === "customer" && (
            <p className="text-sm text-muted-foreground mt-2">
              A senha será preenchida automaticamente com os 6 primeiros dígitos do CPF.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              autoComplete="off"
            >
              <input type="text" style={{ display: 'none' }} />
              <input type="password" style={{ display: 'none' }} />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" autoComplete="off" {...field} />
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
                      <Input type="email" placeholder="Email" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Apenas números (11 dígitos)" 
                        autoComplete="off" 
                        {...field} 
                      />
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
                        <Input 
                          type="password" 
                          placeholder="Senha" 
                          autoComplete="new-password" 
                          {...field} 
                          readOnly={userType === "customer"}
                          className={userType === "customer" ? "bg-gray-100" : ""}
                        />
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
                          autoComplete="new-password"
                          {...field}
                          readOnly={userType === "customer"}
                          className={userType === "customer" ? "bg-gray-100" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Apenas números (opcional)" 
                        autoComplete="off"
                        {...field} 
                      />
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
                      <Input type="date" autoComplete="off" {...field} />
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
                        placeholder="(00)00000-0000" 
                        autoComplete="off"
                        {...field} 
                      />
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
                      <Input 
                        placeholder="Endereço completo" 
                        autoComplete="off" 
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

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending
                    ? "Cadastrando..."
                    : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}