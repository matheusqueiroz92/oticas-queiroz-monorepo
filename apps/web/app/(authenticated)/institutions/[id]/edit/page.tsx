"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstitutionForm } from "@/components/Institutions/InstitutionForm";
import { updateInstitutionForm, InstitutionUpdateData } from "@/schemas/institution-schema";
import { PageTitle } from "@/components/PageTitle";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useUsers } from "@/hooks/useUsers";
import { api } from "@/app/services/authService";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Institution } from "@/app/types/institution";
import { API_ROUTES } from "@/app/constants/api-routes";

export default function EditInstitutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { useUserQuery } = useUsers();
  
  const { 
    data: institution, 
    isLoading, 
    error,
    refetch
  } = useUserQuery(id as string);
  
  const form = updateInstitutionForm();
  
  useEffect(() => {
    if (institution && institution.role === "institution") {
      form.reset({
        name: institution.name,
        email: institution.email,
        phone: institution.phone,
        address: institution.address,
        cnpj: (institution as Institution).cnpj,
        businessName: (institution as Institution).businessName,
        tradeName: (institution as Institution).tradeName,
        industryType: (institution as Institution).industryType,
        contactPerson: (institution as Institution).contactPerson,
        image: institution.image,
      });
    }
  }, [institution, form]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados da instituição...</p>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <ErrorAlert
        message={(error as Error)?.message || "Erro ao carregar dados da instituição"}
      />
    );
  }

  if (institution.role !== "institution") {
    return (
      <ErrorAlert
        message="O usuário carregado não é uma instituição."
      />
    );
  }

  const handleSubmit = async (data: InstitutionUpdateData) => {
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
          title: "Instituição atualizada",
          description: "Os dados da instituição foram atualizados com sucesso.",
        });
        
        // Atualizar os dados
        await refetch();
        
        // Voltar para a página de detalhes
        router.push(`/institutions/${id}`);
      }
    } catch (error: any) {
      console.error("Erro ao atualizar instituição:", error);
      
      const errorMessage = error.response?.data?.message || "Ocorreu um erro ao atualizar a instituição.";
      
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
            title={`Editar: ${institution.name}`} 
            description="Atualize os dados da instituição"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Instituição</CardTitle>
        </CardHeader>
        <CardContent>
          <InstitutionForm
            form={form}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={isSubmitting}
            isEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}