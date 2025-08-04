"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { CreditCard, Mail, Phone, Home, Building, User, FileImage, Key, CheckCircle2, ChevronRight, Loader2, Briefcase } from "lucide-react";
import { InstitutionFormData, InstitutionUpdateData, createInstitutionForm, updateInstitutionForm } from "@/schemas/institution-schema";
import { Institution } from "@/app/_types/institution";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";

interface InstitutionFormProps {
  mode: "create" | "edit";
  institution?: Institution;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InstitutionForm({
  mode,
  institution,
  onSuccess,
  onCancel
}: InstitutionFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Usar o schema correto baseado no modo
  const createForm = createInstitutionForm();
  const updateForm = updateInstitutionForm(institution);

  useEffect(() => {
    if (mode === "edit" && institution) {
      updateForm.reset({
        name: institution.name,
        email: institution.email,
        phone: institution.phone,
        address: institution.address,
        cnpj: institution.cnpj,
        businessName: institution.businessName,
        tradeName: institution.tradeName,
        industryType: institution.industryType,
        contactPerson: institution.contactPerson,
        image: institution.image,
      });

      if (institution.image) {
        setPreviewUrl(institution.image);
      }
    }
  }, [mode, institution, updateForm]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "A imagem deve ter menos de 5MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (mode === "create") {
        createForm.setValue("image", file);
      } else {
        updateForm.setValue("image", file);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCreateSubmit = async (data: InstitutionFormData) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      // Adicionar todos os campos do formulário ao FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image" && key !== "confirmPassword" && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Adicionar a imagem, se existir
      if (data.image instanceof File) {
        formData.append("userImage", data.image);
      }

      const response = await api.post(API_ROUTES.USERS.BASE, formData);

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Instituição criada",
          description: "A instituição foi criada com sucesso.",
        });

        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao criar instituição:", error);

      const errorMessage = error.response?.data?.message || "Ocorreu um erro ao criar a instituição.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (data: InstitutionUpdateData) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      // Adicionar todos os campos do formulário ao FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image" && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Adicionar a imagem, se existir
      if (data.image instanceof File) {
        formData.append("userImage", data.image);
      }

      const response = await api.put(API_ROUTES.USERS.BY_ID(institution!._id), formData);

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Instituição atualizada",
          description: "Os dados da instituição foram atualizados com sucesso.",
        });

        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao atualizar instituição:", error);

      const errorMessage = error.response?.data?.message || "Ocorreu um erro ao atualizar a instituição.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "create") {
    return (
      <Form {...createForm}>
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-primary" />
                      Nome da Instituição*
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da instituição" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-primary" />
                      CNPJ*
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apenas números (14 dígitos)"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-primary" />
                      Razão Social
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-primary" />
                      Nome Fantasia
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nome fantasia da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="industryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Tipo de Indústria
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Saúde, Educação, Tecnologia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <User className="h-4 w-4 text-primary" />
                      Pessoa de Contato
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da pessoa de contato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="email@instituicao.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-primary" />
                      Telefone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-1">
                      <Home className="h-4 w-4 text-primary" />
                      Endereço
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Endereço completo da instituição"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Segurança</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Key className="h-4 w-4 text-primary" />
                      Senha*
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Confirmar Senha*
                    </FormLabel>
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
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Imagem de Perfil</h3>
            <FormField
              control={createForm.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <FileImage className="h-4 w-4 text-primary" />
                    Foto da Instituição
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Selecionar Imagem
                      </Button>
                      {previewUrl && (
                        <div className="mt-2">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Criar Instituição
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...updateForm}>
      <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={updateForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-primary" />
                    Nome da Instituição*
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da instituição" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    CNPJ*
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Apenas números (14 dígitos)"
                      {...field}
                      disabled={true}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-primary" />
                    Razão Social
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Razão social da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="tradeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-primary" />
                    Nome Fantasia
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome fantasia da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="industryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Tipo de Indústria
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Saúde, Educação, Tecnologia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <User className="h-4 w-4 text-primary" />
                    Pessoa de Contato
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da pessoa de contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-primary" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="email@instituicao.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-primary" />
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={updateForm.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-primary" />
                    Endereço
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Endereço completo da instituição"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Imagem de Perfil</h3>
          <FormField
            control={updateForm.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <FileImage className="h-4 w-4 text-primary" />
                  Foto da Instituição
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <FileImage className="h-4 w-4 mr-2" />
                      Selecionar Imagem
                    </Button>
                    {previewUrl && (
                      <div className="mt-2">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}