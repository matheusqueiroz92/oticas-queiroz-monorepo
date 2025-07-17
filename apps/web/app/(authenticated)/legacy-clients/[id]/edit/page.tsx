"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLegacyClients } from "@/hooks/legacy-clients/useLegacyClients";
import { updateLegacyClientForm, UpdateLegacyClientFormData } from "@/schemas/legacy-client-schema";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LegacyClientForm } from "@/components/legacy-clients/LegacyClientForm";
import { ArrowLeft, Save } from "lucide-react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";

export default function EditLegacyClient() {
  const router = useRouter();
  const { id } = useParams();
  const clientId = Array.isArray(id) ? id[0] : id;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fetchLegacyClientById, handleUpdateLegacyClient } = useLegacyClients();
  const { data: client, isLoading, isError, error } = fetchLegacyClientById(clientId);

  const form = updateLegacyClientForm(client);

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        cpf: client.cpf,
        email: client.email || "",
        phone: client.phone || "",
        address: client.address,
        totalDebt: client.totalDebt,
        status: client.status,
        observations: client.observations || "",
      });
    }
  }, [client, form]);

  const onSubmit = async (data: UpdateLegacyClientFormData) => {
    setIsSubmitting(true);
    try {
      if (!clientId) {
        throw new Error("Client ID is undefined");
      }
      await handleUpdateLegacyClient(clientId, data);
      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
      router.push(`/dashboard/legacy-clients/${clientId}`);
    } catch (err) {
      console.error("Erro ao atualizar cliente:", err);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar os dados do cliente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <ErrorAlert message={error?.message || "Erro ao carregar os dados do cliente"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <PageTitle 
            title={isLoading ? "Carregando..." : `Editar Cliente: ${client?.name}`} 
          />
        </div>
        <Button 
          type="submit"
          form="edit-legacy-client-form"
          disabled={isLoading || isSubmitting}
          className="bg-[var(--secondary-red)]"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form id="edit-legacy-client-form" onSubmit={form.handleSubmit(onSubmit)}>
                <LegacyClientForm form={form} isEdit={true} />
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}