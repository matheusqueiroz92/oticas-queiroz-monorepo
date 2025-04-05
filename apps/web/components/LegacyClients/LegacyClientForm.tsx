import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  createLegacyClientSchema, 
  updateLegacyClientSchema,
  type CreateLegacyClientFormData,
  type UpdateLegacyClientFormData 
} from "@/schemas/legacy-client-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  User,
  DollarSign,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  Ban,
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacyClient } from "@/app/types/legacy-client";

interface LegacyClientFormProps {
  mode: "create" | "edit";
  initialData?: LegacyClient | null;
  onSubmit: (data: CreateLegacyClientFormData | UpdateLegacyClientFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function LegacyClientForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}: LegacyClientFormProps) {
  const router = useRouter();
  
  // Usando um único tipo de formulário independente do modo para evitar problemas de tipagem
  const form = useForm({
    resolver: mode === "create" 
      ? zodResolver(createLegacyClientSchema) 
      : zodResolver(updateLegacyClientSchema),
    defaultValues: {
      name: "",
      cpf: "",
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
      totalDebt: 0,
      status: "active" as const,
      observations: "",
    },
  });

  // Preencher o formulário com dados iniciais quando em modo de edição
  useEffect(() => {
    if (mode === "edit" && initialData) {
      // Reset do formulário com os dados iniciais
      form.reset({
        name: initialData.name,
        cpf: initialData.cpf,
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address ? {
          street: initialData.address.street,
          number: initialData.address.number,
          complement: initialData.address.complement || "",
          neighborhood: initialData.address.neighborhood,
          city: initialData.address.city,
          state: initialData.address.state,
          zipCode: initialData.address.zipCode,
        } : undefined,
        totalDebt: initialData.totalDebt,
        status: initialData.status,
        observations: initialData.observations || "",
      });
    }
  }, [initialData, form, mode]);

  const handleCancel = () => {
    router.back();
  };

  const handleFormSubmit = async (data: any) => {
    await onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "Novo Cliente Legado" : "Editar Cliente Legado"}
        </h1>
      </div>

      <Form {...form}>
        <form id="legacyClientForm" onSubmit={form.handleSubmit(handleFormSubmit)}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato e Endereço
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Dados Financeiros
              </TabsTrigger>
            </TabsList>

            {/* Aba de dados pessoais */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Informações básicas do cliente legado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <User className="h-4 w-4 text-primary" />
                          Nome Completo *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
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
                        <FormLabel className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-primary" />
                          CPF *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Apenas números (11 dígitos)" 
                            {...field} 
                            maxLength={11}
                            // Desabilitar no modo de edição para evitar problemas com registros existentes
                            disabled={mode === "edit"}
                          />
                        </FormControl>
                        {mode === "edit" && (
                          <FormDescription>
                            O CPF não pode ser alterado após o cadastro.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Status
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                Ativo
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center">
                                <Ban className="h-4 w-4 mr-2 text-red-500" />
                                Inativo
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de contato e endereço */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Informações de Contato
                  </CardTitle>
                  <CardDescription>
                    Dados de contato e endereço do cliente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-primary" />
                            Telefone
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
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
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-primary" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Endereço
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rua</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da rua" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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

                      <FormField
                        control={form.control}
                        name="address.complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Complemento (opcional)" {...field} />
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input placeholder="UF" {...field} maxLength={2} />
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
                                <Input placeholder="00000000" {...field} maxLength={8} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de dados financeiros */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Informações Financeiras
                  </CardTitle>
                  <CardDescription>
                    Dados financeiros e observações sobre o cliente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="totalDebt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Valor da Dívida (R$)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              className="pl-10"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Valor total da dívida atual do cliente.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-primary" />
                          Observações
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações sobre o cliente..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informações adicionais, histórico ou notas sobre o cliente.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botões de ação */}
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "create" ? "Cadastrando..." : "Atualizando..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {mode === "create" ? "Cadastrar Cliente" : "Salvar Alterações"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}