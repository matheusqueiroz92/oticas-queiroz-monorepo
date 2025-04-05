"use client";

import { LegacyClientForm } from "@/components/LegacyClients/LegacyClientForm";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { useToast } from "@/hooks/useToast";
import type { CreateLegacyClientFormData } from "@/schemas/legacy-client-schema";

export default function NewLegacyClientPage() {
  const { toast } = useToast();
  const { handleCreateLegacyClient, isCreating } = useLegacyClients();

  const onSubmit = async (formData: CreateLegacyClientFormData) => {
    try {
      await handleCreateLegacyClient(formData);
      
      toast({
        title: "Cliente cadastrado",
        description: "O cliente legado foi cadastrado com sucesso no sistema.",
      });
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o cliente. Verifique os dados e tente novamente.",
      });
    }
  };

  return (
    <LegacyClientForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isCreating}
    />
  );
}