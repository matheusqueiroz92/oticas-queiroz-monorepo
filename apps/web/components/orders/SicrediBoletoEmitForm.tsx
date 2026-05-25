"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2, MapPin } from "lucide-react";
import {
  sicrediEmitFormSchema,
  type SicrediEmitFormData,
} from "@/schemas/sicredi-schema";
import type { SicrediCustomerData } from "@/app/_types/sicredi";

interface SicrediBoletoEmitFormProps {
  defaultValues?: Partial<SicrediEmitFormData>;
  customerAddressAvailable?: boolean;
  onSubmit: (data: SicrediCustomerData) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function buildFormValues(defaultValues?: Partial<SicrediEmitFormData>): SicrediEmitFormData {
  return {
    cpfCnpj: defaultValues?.cpfCnpj || "",
    nome: defaultValues?.nome || "",
    endereco: {
      logradouro: defaultValues?.endereco?.logradouro || "",
      numero: defaultValues?.endereco?.numero || "",
      complemento: defaultValues?.endereco?.complemento || "",
      bairro: defaultValues?.endereco?.bairro || "",
      cidade: defaultValues?.endereco?.cidade || "",
      uf: defaultValues?.endereco?.uf || "",
      cep: defaultValues?.endereco?.cep || "",
    },
  };
}

export default function SicrediBoletoEmitForm({
  defaultValues,
  customerAddressAvailable = false,
  onSubmit,
  isLoading = false,
  submitLabel = "Emitir boleto SICREDI",
}: SicrediBoletoEmitFormProps) {
  const form = useForm<SicrediEmitFormData>({
    resolver: zodResolver(sicrediEmitFormSchema),
    defaultValues: buildFormValues(defaultValues),
  });

  useEffect(() => {
    form.reset(buildFormValues(defaultValues));
  }, [defaultValues, form]);

  const fillFromCustomer = () => {
    if (!defaultValues) return;
    form.reset(buildFormValues(defaultValues));
  };

  const handleSubmit = (data: SicrediEmitFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        {customerAddressAvailable && defaultValues?.endereco?.logradouro && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={fillFromCustomer}
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Usar endereço do cadastro do cliente
          </Button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do pagador</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Nome completo" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpfCnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Somente números" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="endereco.logradouro"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Logradouro</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endereco.numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField
            control={form.control}
            name="endereco.bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endereco.cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endereco.uf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} maxLength={2} placeholder="SP" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endereco.cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="00000-000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="endereco.complemento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento (opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Emitindo boleto...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </Form>
  );
}
