"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLegacyClientSchema, type CreateLegacyClientFormData } from "@/schemas/legacy-client-schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LegacyClientForm } from "./LegacyClientForm";
import { useLegacyClients } from "@/hooks/legacy-clients/useLegacyClients";
import { useToast } from "@/hooks/useToast";



interface CreateLegacyClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLegacyClientModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateLegacyClientModalProps) {
  const { toast } = useToast();
  const { handleCreateLegacyClient, isCreating } = useLegacyClients();

  const form = useForm<CreateLegacyClientFormData>({
    resolver: zodResolver(createLegacyClientSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      totalDebt: 0,
      status: "active",
      observations: "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  const onSubmit = async (data: CreateLegacyClientFormData) => {
    try {
      await handleCreateLegacyClient({
        ...data,
        identifier: data.cpf || "",
        debt: data.totalDebt,
        observations: data.observations,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Cliente criado",
        description: "O cliente foi cadastrado com sucesso.",
      });

      form.reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
      });
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente legado. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <LegacyClientForm />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Cadastrando..." : "Cadastrar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
} 