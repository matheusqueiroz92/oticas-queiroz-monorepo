"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, User, Mail, Phone } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { DatePicker } from "@/components/ui/date-picker";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/useToast";
import { User as UserType } from "@/app/_types/user";

const customerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.date({
    required_error: "Data de nascimento é obrigatória",
  }),
  image: z.any().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  customer?: UserType; // Cliente para edição (opcional)
  mode?: 'create' | 'edit';
}

export function CustomerDialog({
  open,
  onOpenChange,
  onSuccess,
  customer,
  mode,
}: CustomerDialogProps) {
  const { createUserMutation, updateUserMutation, getUserImageUrl } = useUsers();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // Memoizar o cliente para evitar renderizações desnecessárias
  const memoizedCustomer = useMemo(() => customer, [customer?._id]);

  // Detectar modo automaticamente se não foi especificado
  const isEditMode = mode === 'edit' || (mode === undefined && !!memoizedCustomer && !!memoizedCustomer._id);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      rg: "",
      address: "",
      birthDate: undefined,
      image: undefined,
    },
  });

  // Preencher o formulário quando estiver no modo de edição
  useEffect(() => {
    if (!open) {
      return; // Não fazer nada se o dialog estiver fechado
    }

    // Usar uma flag para evitar loops infinitos
    const handleFormReset = () => {
      if (isEditMode && memoizedCustomer) {
        form.reset({
          name: memoizedCustomer.name || "",
          email: memoizedCustomer.email || "",
          phone: memoizedCustomer.phone || "",
          cpf: memoizedCustomer.cpf || "",
          rg: memoizedCustomer.rg || "",
          address: memoizedCustomer.address || "",
          birthDate: memoizedCustomer.birthDate ? new Date(memoizedCustomer.birthDate) : undefined,
        });
        
        if (memoizedCustomer?.image) {
          try {
            // Usar o método getUserImageUrl para obter a URL completa da imagem
            const imageFullUrl = getUserImageUrl(memoizedCustomer.image);
            setImageUrl(imageFullUrl);
          } catch (error) {
            console.error("Erro ao processar URL da imagem:", error);
            setImageUrl(undefined);
          }
        }
      } else {
        // Resetar o formulário quando abrir no modo de criação
        form.reset({
          name: "",
          email: "",
          phone: "",
          cpf: "",
          rg: "",
          address: "",
          birthDate: undefined,
          image: undefined,
        });
        setSelectedImage(null);
        setImageUrl(undefined);
      }
    };
    
    handleFormReset();
  }, [memoizedCustomer, isEditMode, open, form]);

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      const formData = new FormData();
      
      // Adicionar dados obrigatórios
      formData.append("name", data.name);
      
      if (!isEditMode) {
        formData.append("role", "customer");
        
        // Gerar senha baseada na data de nascimento (apenas números) - apenas para criação
        const birthDatePassword = format(data.birthDate, "ddMMyyyy");
        formData.append("password", birthDatePassword);
      }
      
      // Adicionar data de nascimento
      if (data.birthDate) {
        formData.append("birthDate", data.birthDate.toISOString());
      }
      
      // Adicionar imagem se selecionada
      if (selectedImage) {
        formData.append("userImage", selectedImage);
      }
      
      // Adicionar dados opcionais apenas se preenchidos
      if (data.email && data.email.trim()) {
        formData.append("email", data.email);
      }
      if (data.phone && data.phone.trim()) {
        formData.append("phone", data.phone);
      }
      if (data.cpf && data.cpf.trim()) {
        formData.append("cpf", data.cpf);
      }
      if (data.rg && data.rg.trim()) {
        formData.append("rg", data.rg);
      }
      if (data.address && data.address.trim()) {
        formData.append("address", data.address);
      }

      if (isEditMode && memoizedCustomer) {
        // Atualizar cliente existente
        await updateUserMutation.mutateAsync({
          id: memoizedCustomer._id,
          formData
        });
        
        toast({
          title: "Cliente atualizado",
          description: "Os dados do cliente foram atualizados com sucesso.",
        });
      } else {
        // Criar novo cliente
        await createUserMutation.mutateAsync(formData);
        
        const birthDatePassword = format(data.birthDate, "ddMMyyyy");
        toast({
          title: "Cliente cadastrado",
          description: `O cliente foi cadastrado com sucesso. Senha gerada: ${birthDatePassword}`,
        });
      }
      
      // Resetar formulário e fechar dialog
      form.reset();
      setSelectedImage(null);
      setImageUrl(undefined);
      onOpenChange(false);
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} cliente:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.response?.data?.message || `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} cliente`,
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    setSelectedImage(null);
    setImageUrl(undefined);
    onOpenChange(false);
  };

  const isPending = isEditMode ? updateUserMutation.isPending : createUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edite os dados do cliente no sistema'
              : 'Cadastre um novo cliente no sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Campo de Imagem - Primeiro */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Foto do Cliente
              </h3>
              
              <ImageUpload
                value={selectedImage}
                onChange={setSelectedImage}
                disabled={isPending}
                existingImageUrl={imageUrl}
              />
            </div>

            {/* Informações Básicas */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de Data de Nascimento */}
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione a data de nascimento"
                          disabled={isPending}
                        />
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
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            placeholder="email@exemplo.com" 
                            type="email" 
                            className="pl-9"
                            {...field} 
                          />
                        </div>
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
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            placeholder="(11) 99999-9999" 
                            className="pl-9"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro, cidade - UF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="min-w-[120px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Salvando...' : 'Cadastrando...'}
                  </>
                ) : (
                  isEditMode ? 'Salvar Alterações' : 'Cadastrar Cliente'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 