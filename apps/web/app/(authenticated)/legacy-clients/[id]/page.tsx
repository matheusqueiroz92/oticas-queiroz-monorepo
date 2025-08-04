"use client";

import { useParams, useRouter } from "next/navigation";
import { useLegacyClients } from "@/hooks/legacy-clients/useLegacyClients";
import { useLegacyClientDetailsState } from "@/hooks/legacy-clients/useLegacyClientDetailsState";
import { useLegacyClientDetailsData } from "@/hooks/legacy-clients/useLegacyClientDetailsData";
import { useLegacyClientDetailsStats } from "@/hooks/legacy-clients/useLegacyClientDetailsStats";
import { LegacyClientDetailsHeader } from "@/components/legacy-clients/LegacyClientDetailsHeader";
import { LegacyClientInfo } from "@/components/legacy-clients/LegacyClientInfo";
import { LegacyClientDetailsStatsSection } from "@/components/legacy-clients/LegacyClientDetailsStatsSection";
import { LegacyClientPaymentHistory } from "@/components/legacy-clients/LegacyClientPaymentHistory";
import { LegacyClientDetailsLoading } from "@/components/legacy-clients/LegacyClientDetailsLoading";
import { LegacyClientDetailsError } from "@/components/legacy-clients/LegacyClientDetailsError";
import { LegacyClientDialogs } from "@/components/legacy-clients/LegacyClientDialogs";

export default function LegacyClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Array.isArray(id) ? id[0] : id;
  
  const { state, actions } = useLegacyClientDetailsState();
  const { handleToggleStatus: toggleStatus, isTogglingStatus } = useLegacyClients();
  
  const { 
    client, 
    paymentHistory, 
    isLoading, 
    isError, 
    error, 
    paymentHistoryError,
    refetchClient 
  } = useLegacyClientDetailsData(clientId || "");
  
  const stats = useLegacyClientDetailsStats(client || null, paymentHistory);

  const handleGoBack = () => {
    router.push("/legacy-clients");
  };

  const handleEditClient = () => {
    if (client) {
      actions.handleOpenEditDialog();
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleStatus(clientId ?? "");
      refetchClient();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const handleViewPayment = (paymentId: string) => {
    router.push(`/payments/${paymentId}`);
  };

  // Loading state
  if (isLoading) {
    return <LegacyClientDetailsLoading />;
  }

  // Error state
  if (isError || !client) {
    return <LegacyClientDetailsError error={error} onGoBack={handleGoBack} />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <LegacyClientDetailsHeader
        client={client}
        isLoading={isLoading}
        isTogglingStatus={isTogglingStatus}
        onGoBack={handleGoBack}
        onEditClient={handleEditClient}
        onToggleStatus={handleToggleStatus}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda - Informações e Estatísticas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Principal do Cliente */}
          <LegacyClientInfo client={client} />

          {/* Estatísticas */}
          <LegacyClientDetailsStatsSection
            totalDebt={stats.totalDebt}
            currentDebt={stats.currentDebt}
            lastPaymentAmount={stats.lastPaymentAmount}
            lastPaymentDate={stats.lastPaymentDate}
            totalPayments={stats.totalPayments}
            averagePayment={stats.averagePayment}
            daysSinceLastPayment={stats.daysSinceLastPayment}
            status={stats.status}
            createdAt={stats.createdAt}
          />
        </div>

        {/* Coluna Direita - Histórico de Pagamentos */}
        <div className="lg:col-span-1">
          <LegacyClientPaymentHistory
            paymentHistory={paymentHistory || []}
            isLoading={isLoading}
            error={paymentHistoryError}
            onViewPayment={handleViewPayment}
          />
        </div>
      </div>

      {/* Dialog de Edição do Cliente */}
      {state.editDialogOpen && (
        <LegacyClientDialogs
          newClientDialogOpen={false}
          clientToEdit={client}
          onNewClientDialogChange={() => {}}
          onEditClientDialogChange={actions.handleCloseEditDialog}
          onSuccess={() => {
            if (refetchClient) {
              refetchClient();
            }
          }}
        />
      )}
    </div>
  );
}