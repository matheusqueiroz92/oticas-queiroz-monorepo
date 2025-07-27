"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateLegacyClientSchema, type UpdateLegacyClientFormData } from "@/schemas/legacy-client-schema";
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
import type { LegacyClient } from "@/app/_types/legacy-client";
import { useEffect } from "react";

interface EditLegacyClientModalProps {
  isOpen: boolean;
  client: LegacyClient | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditLegacyClientModal({
  isOpen,
  client,
  onClose,
  onSuccess,
}: EditLegacyClientModalProps) {
  const { toast } = useToast();
  const { handleUpdateLegacyClient, isUpdating } = useLegacyClients();

  const form = useForm<UpdateLegacyClientFormData>({
    resolver: zodResolver(updateLegacyClientSchema),
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

  // Atualizar valores do formulário quando o cliente mudar
  useEffect(() => {
    if (client && isOpen) {
      form.reset({
        name: client.name || "",
        cpf: client.cpf || "",
        email: client.email || "",
        phone: client.phone || "",
        totalDebt: client.debt || 0,
        status: client.status || "active",
        observations: client.observations || "",
        address: client.address ? {
          street: client.address.street || "",
          number: client.address.number || "",
          complement: client.address.complement || "",
          neighborhood: client.address.neighborhood || "",
          city: client.address.city || "",
          state: client.address.state || "",
          zipCode: client.address.zipCode || "",
        } : {
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
        },
      });
    }
  }, [client, isOpen, form]);

  const onSubmit = async (data: UpdateLegacyClientFormData) => {
    if (!client?._id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID do cliente não encontrado.",
      });
      return;
    }

    try {
      await handleUpdateLegacyClient(client._id, {
        ...data,
        identifier: data.cpf || "",
        debt: data.totalDebt,
        observations: data.observations,
        updatedAt: new Date(),
      });

      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });

      form.reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar os dados do cliente.",
      });
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize os dados do cliente legado. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <LegacyClientForm isEdit={true} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Atualizando..." : "Atualizar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
} 