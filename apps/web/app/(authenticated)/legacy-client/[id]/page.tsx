"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LegacyClientDetailsCard } from "@/components/LegacyClients/LegacyClientDetailsCard";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function LegacyClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { 
    fetchLegacyClientById, 
    handleToggleClientStatus,
    isTogglingStatus
  } = useLegacyClients();

  const { data: client, isLoading, error } = fetchLegacyClientById(id as string);

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
    <LegacyClientDetailsCard
      client={client}
      onToggleStatus={handleToggleClientStatus}
      isTogglingStatus={isTogglingStatus}
    />
  );
}