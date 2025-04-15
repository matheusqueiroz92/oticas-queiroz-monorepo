"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { CreditCard, Mail, Phone, Home, Building, User, FileImage, Key, CheckCircle2, ChevronRight, Loader2, Briefcase } from "lucide-react";
import { InstitutionFormData } from "@/schemas/institution-schema";

interface InstitutionFormProps {
  form: any;
  onSubmit: (data: InstitutionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function InstitutionForm({ form, onSubmit, onCancel, isSubmitting, isEdit = false }: InstitutionFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Se estiver em modo de edição e já tiver uma imagem, mostrar preview
    if (isEdit && form.getValues().image) {
      const image = form.getValues().image;
      if (typeof image === 'string') {
        setPreviewUrl(image);
      }
    }
  }, [form, isEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", file);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
                      disabled={isEdit}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                  {isEdit && (
                    <FormDescription>O CNPJ não pode ser alterado</FormDescription>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-primary" />
                    Razão Social
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tradeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-primary" />
                    Nome Fantasia
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome fantasia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="industryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Ramo de Atividade
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ramo de atividade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações de Contato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <FormLabel className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-primary" />
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(00)00000-0000" 
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
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-primary" />
                    Endereço
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Endereço completo" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {!isEdit && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Credenciais de Acesso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Key className="h-4 w-4 text-primary" />
                      Senha*
                    </FormLabel>
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
                    <FormLabel className="flex items-center gap-1">
                      <Key className="h-4 w-4 text-primary" />
                      Confirmar Senha*
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme a senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Imagem</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <FileImage className="h-4 w-4 text-primary" />
                    Logo da Instituição
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-center bg-gray-50 rounded-md border h-[150px] overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center">
                  <FileImage className="h-8 w-8 mb-2 opacity-20" />
                  <span>Nenhuma imagem selecionada</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? 'Atualizando...' : 'Cadastrando...'}
              </>
            ) : (
              <>
                {isEdit ? 'Salvar Alterações' : 'Cadastrar Instituição'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}