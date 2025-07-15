"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/useToast";
import { useUsers } from "@/hooks/useUsers";
import { User, UserPlus, Mail, Phone, Loader2 } from "lucide-react";
import type { User as UserType } from "@/app/_types/user";

// Schema para funcionário - simplificado sem role e com birthDate
const employeeSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  rg: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  birthDate: z.date({
    required_error: "Data de nascimento é obrigatória",
  }),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
  image: z.any().optional(),
}).refine((data) => {
  // Validação apenas para modo de criação (quando password está preenchido)
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  employee?: UserType; // Funcionário para edição (opcional)
  mode?: 'create' | 'edit';
}

export function EmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  employee,
  mode = 'create',
}: EmployeeDialogProps) {
  const { createUserMutation, updateUserMutation, getUserImageUrl } = useUsers();
  const { toast } = useToast();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // Memoizar o funcionário para evitar renderizações desnecessárias
  const memoizedEmployee = useMemo(() => employee, [employee?._id]);
  
  const isEditMode = mode === 'edit';
  
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      rg: "",
      address: "",
      birthDate: undefined,
      password: "",
      confirmPassword: "",
      image: undefined,
    },
    mode: "onChange",
  });

  // Preencher o formulário quando estiver no modo de edição
  useEffect(() => {
    if (!open) return; // Não fazer nada se o dialog estiver fechado

    const handleFormReset = () => {
      if (isEditMode && memoizedEmployee) {
        form.reset({
          name: memoizedEmployee.name || "",
          email: memoizedEmployee.email || "",
          phone: memoizedEmployee.phone || "",
          cpf: memoizedEmployee.cpf || "",
          rg: memoizedEmployee.rg || "",
          address: memoizedEmployee.address || "",
          birthDate: memoizedEmployee.birthDate ? new Date(memoizedEmployee.birthDate) : undefined,
          password: "",
          confirmPassword: "",
        });
        
        if (memoizedEmployee?.image) {
          try {
            const imageFullUrl = getUserImageUrl(memoizedEmployee.image);
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
          password: "",
          confirmPassword: "",
        });
        setSelectedImage(null);
        setImageUrl(undefined);
      }
    };
    
    handleFormReset();
  }, [memoizedEmployee, isEditMode, open, form]);

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      const formData = new FormData();
      
      // Adicionar dados obrigatórios
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("role", "employee"); // Sempre será funcionário
      
      // Adicionar data de nascimento
      if (data.birthDate) {
        formData.append("birthDate", data.birthDate.toISOString());
      }
      
      if (!isEditMode && data.password) {
        formData.append("password", data.password);
      }
      
      // Adicionar imagem se selecionada
      if (selectedImage) {
        formData.append("userImage", selectedImage);
      }
      
      // Adicionar dados opcionais apenas se preenchidos
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

      if (isEditMode && memoizedEmployee) {
        // Atualizar funcionário existente
        await updateUserMutation.mutateAsync({
          id: memoizedEmployee._id,
          formData
        });
        
        toast({
          title: "Funcionário atualizado",
          description: "Os dados do funcionário foram atualizados com sucesso.",
        });
      } else {
        // Criar novo funcionário
        await createUserMutation.mutateAsync(formData);
        
        toast({
          title: "Funcionário cadastrado",
          description: "O funcionário foi cadastrado com sucesso.",
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
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} funcionário:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.response?.data?.message || `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} funcionário`,
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
      <DialogOverlay className="bg-black/60" />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            {isEditMode ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edite os dados do funcionário no sistema'
              : 'Cadastre um novo funcionário no sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Campo de Imagem */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Foto do Funcionário
              </h3>
              
              <ImageUpload
                value={selectedImage}
                onChange={setSelectedImage}
                disabled={isPending}
                existingImageUrl={imageUrl}
              />
            </div>

            {/* Campos do formulário sem seções */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do funcionário" {...field} />
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

            {/* Senha (apenas para criação) */}
            {!isEditMode && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Digite a senha" 
                            {...field} 
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
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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
                  isEditMode ? 'Salvar Alterações' : 'Cadastrar Funcionário'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}