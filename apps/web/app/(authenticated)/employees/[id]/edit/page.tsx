"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileEditForm } from "@/components/Users/ProfileEditForm";
import { updateUserForm, UserUpdateData } from "@/schemas/user-schema";
import { PageTitle } from "@/components/PageTitle";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useUsers } from "@/hooks/useUsers";
import { api } from "@/app/services/authService";
import { ErrorAlert } from "@/components/ErrorAlert";
import { API_ROUTES } from "@/app/constants/api-routes";

export default function EditEmployeePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { useUserQuery, getUserImageUrl } = useUsers();
  
  const { 
    data: employee, 
    isLoading, 
    error,
    refetch
  } = useUserQuery(id as string);
  
  const form = updateUserForm();
  
  useEffect(() => {
    if (employee && (employee.role === "employee" || employee.role === "admin")) {
      // Set preview image if exists
      if (employee.image) {
        setPreviewImage(getUserImageUrl(employee.image));
      }
      
      form.reset({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        rg: employee.rg,
      });
    }
  }, [employee, form, getUserImageUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do funcionário...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <ErrorAlert
        message={(error as Error)?.message || "Erro ao carregar dados do funcionário"}
      />
    );
  }

  if (employee.role !== "employee" && employee.role !== "admin") {
    return (
      <ErrorAlert
        message="O usuário carregado não é um funcionário."
      />
    );
  }

  const handleSubmit = async (data: UserUpdateData) => {
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
      
      // Enviar para o backend
      const response = await api.put(API_ROUTES.USERS.BY_ID(id as string), formData);
      
      if (response.status === 200) {
        toast({
          title: "Funcionário atualizado",
          description: "Os dados do funcionário foram atualizados com sucesso.",
        });
        
        // Atualizar os dados
        await refetch();
        
        // Voltar para a página de detalhes
        router.push(`/employees/${id}`);
      }
    } catch (error: any) {
      console.error("Erro ao atualizar funcionário:", error);
      
      const errorMessage = error.response?.data?.message || "Ocorreu um erro ao atualizar o funcionário.";
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <PageTitle 
            title={`Editar: ${employee.name}`} 
            description="Atualize os dados do funcionário"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            user={employee}
            onCancel={() => router.back()}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            previewImage={previewImage}
            setPreviewImage={setPreviewImage}
          />
        </CardContent>
      </Card>
    </div>
  );
}