"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LegacyClientForm } from "@/components/LegacyClients/LegacyClientForm";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useToast } from "@/hooks/useToast";

export default function EditLegacyClientPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const { 
    fetchLegacyClientById, 
    handleUpdateLegacyClient,
    isUpdating
  } = useLegacyClients();

  const { data: client, isLoading, error } = fetchLegacyClientById(id as string);

  const onSubmit = async (formData: any) => {
    try {
      await handleUpdateLegacyClient(id as string, formData);
      
      toast({
        title: "Cliente atualizado",
        description: "As informações do cliente foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as informações do cliente.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <ErrorAlert
        message={(error as Error)?.message || "Erro ao carregar dados do cliente legado"}
      />
    );
  }

  return (
    <LegacyClientForm
      mode="edit"
      initialData={client}
      onSubmit={onSubmit}
      isSubmitting={isUpdating}
    />
  );
}