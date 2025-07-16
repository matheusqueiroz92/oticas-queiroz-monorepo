"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLegacyClients } from "@/hooks/laboratories/useLegacyClients";
import { createLegacyClientForm, CreateLegacyClientFormData } from "@/schemas/legacy-client-schema";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LegacyClientForm } from "@/components/legacy-clients/LegacyClientForm";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function NewLegacyClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleCreateLegacyClient } = useLegacyClients();
  const form = createLegacyClientForm();

  const onSubmit = async (data: CreateLegacyClientFormData) => {
    setIsSubmitting(true);
    try {
      const newClient = await handleCreateLegacyClient(data);
      toast({
        title: "Cliente cadastrado",
        description: "O cliente foi cadastrado com sucesso.",
      });
      if (newClient?._id) {
        router.push(`/dashboard/legacy-clients/${newClient._id}`);
      } else {
        router.push("/dashboard/legacy-clients");
      }
    } catch (err) {
      console.error("Erro ao cadastrar cliente:", err);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao cadastrar o cliente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <PageTitle title="Novo Cliente Legado" />
        </div>
        <Button 
          type="submit"
          form="create-legacy-client-form"
          disabled={isSubmitting}
          className="bg-[var(--secondary-red)]"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="create-legacy-client-form" onSubmit={form.handleSubmit(onSubmit)}>
              <LegacyClientForm form={form} />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}