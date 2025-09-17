"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Beaker, Building, Mail, Phone, MapPin } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
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
import { useToast } from "@/hooks/useToast";
import { createLaboratory, updateLaboratory } from "@/app/_services/laboratoryService";
import { Laboratory } from "@/app/_types/laboratory";
import { handleError, showSuccess } from "@/app/_utils/error-handler";

const laboratorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  contactName: z.string().min(2, "Nome do contato deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  address: z.object({
    street: z.string().min(2, "Rua deve ter pelo menos 2 caracteres"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres"),
    city: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
    state: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
    zipCode: z.string().min(8, "CEP deve ter pelo menos 8 dígitos"),
  }),
  isActive: z.boolean().default(true),
});

type LaboratoryFormData = z.infer<typeof laboratorySchema>;

interface LaboratoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  laboratory?: Laboratory; // Laboratório para edição (opcional)
  mode?: 'create' | 'edit';
}

export function LaboratoryDialog({
  open,
  onOpenChange,
  onSuccess,
  laboratory,
  mode,
}: LaboratoryDialogProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  
  // Memoizar o laboratório para evitar renderizações desnecessárias
  const memoizedLaboratory = useMemo(() => laboratory, [laboratory?._id]);

  // Detectar modo automaticamente se não foi especificado
  const isEditMode = mode === 'edit' || (mode === undefined && !!memoizedLaboratory && !!memoizedLaboratory._id);

  const form = useForm<LaboratoryFormData>({
    resolver: zodResolver(laboratorySchema),
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

  // Preencher o formulário quando estiver no modo de edição
  useEffect(() => {
    if (!open) {
      return; // Não fazer nada se o dialog estiver fechado
    }

    // Usar uma flag para evitar loops infinitos
    const handleFormReset = () => {
      if (isEditMode && memoizedLaboratory) {
        form.reset({
          name: memoizedLaboratory.name || "",
          contactName: memoizedLaboratory.contactName || "",
          email: memoizedLaboratory.email || "",
          phone: memoizedLaboratory.phone || "",
          address: {
            street: memoizedLaboratory.address?.street || "",
            number: memoizedLaboratory.address?.number || "",
            complement: memoizedLaboratory.address?.complement || "",
            neighborhood: memoizedLaboratory.address?.neighborhood || "",
            city: memoizedLaboratory.address?.city || "",
            state: memoizedLaboratory.address?.state || "",
            zipCode: memoizedLaboratory.address?.zipCode || "",
          },
          isActive: memoizedLaboratory.isActive ?? true,
        });
      } else {
        // Resetar o formulário quando abrir no modo de criação
        form.reset({
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
        });
      }
    };
    
    handleFormReset();
  }, [memoizedLaboratory, isEditMode, open, form]);

  const handleSubmit = async (data: LaboratoryFormData) => {
    try {
      setIsPending(true);

      if (isEditMode && memoizedLaboratory) {
        // Atualizar laboratório existente
        await updateLaboratory(memoizedLaboratory._id, data);
        
        showSuccess(
          "Laboratório atualizado",
          "Os dados do laboratório foram atualizados com sucesso."
        );
      } else {
        // Criar novo laboratório
        await createLaboratory(data);
        
        showSuccess(
          "Laboratório cadastrado",
          "O laboratório foi cadastrado com sucesso."
        );
      }
      
      // Resetar formulário e fechar dialog
      form.reset();
      onOpenChange(false);
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} laboratório:`, error);
      handleError(
        error,
        `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} laboratório`,
        true // Mostrar detalhes do erro
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/60" />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Beaker className="w-6 h-6 text-blue-600" />
            {isEditMode ? 'Editar Laboratório' : 'Novo Laboratório'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edite os dados do laboratório no sistema'
              : 'Cadastre um novo laboratório no sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="w-5 h-5 text-[var(--primary-blue)]" />
                Informações do Laboratório
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input placeholder="Nome da pessoa de contato" {...field} />
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

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--primary-blue)]" />
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
                        <Input placeholder="Apartamento, sala, etc." {...field} />
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
                        <Input placeholder="Nome do bairro" {...field} />
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
                        <Input placeholder="Nome da cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" {...field} />
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
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                  isEditMode ? 'Salvar Alterações' : 'Cadastrar Laboratório'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 