"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLegacyClients } from "@/hooks/legacy-clients/useLegacyClients";
import { useLegacyClientDetails } from "@/hooks/legacy-clients/useLegacyClientDetails";
import { useLegacyClientPaymentHistory } from "@/hooks/legacy-clients/useLegacyClientPaymentHistory";
import { useLegacyClientPageState } from "@/hooks/legacy-clients/useLegacyClientPageState";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { LegacyClientInfo } from "@/components/legacy-clients/LegacyClientInfo";
import { PaymentHistoryTable } from "@/components/legacy-clients/PaymentHistoryTable";
import { LegacyClientDialogs } from "@/components/legacy-clients/LegacyClientDialogs";
import { ArrowLeft, Edit, ToggleLeft, AlertTriangle } from "lucide-react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LegacyClientDetails() {
  const router = useRouter();
  const { id } = useParams();
  const clientId = Array.isArray(id) ? id[0] : id;
  const [activeTab, setActiveTab] = useState("details");

  const { state, actions } = useLegacyClientPageState();
  const { handleToggleStatus, isTogglingStatus } = useLegacyClients();
  
  const { 
    data: client, 
    isLoading, 
    isError, 
    error 
  } = useLegacyClientDetails(clientId || "");
  
  const { 
    data: paymentHistory, 
    isLoading: isLoadingHistory 
  } = useLegacyClientPaymentHistory(clientId || "");

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

  const onToggleStatus = async () => {
    try {
      await handleToggleStatus(clientId ?? "");
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const canDeactivate = (client?.debt || 0) === 0 || client?.status === "inactive";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <PageTitle 
            title={isLoading ? "Carregando..." : client?.name || "Cliente"}
          />
          {!isLoading && client && (
            <Badge
              variant={client.status === "active" ? "default" : "secondary"}
              className={`ml-2 ${
                client.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {client.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => client && actions.handleEditClient(client)}
            disabled={!client}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={!canDeactivate || isTogglingStatus}
                className={!canDeactivate ? "cursor-not-allowed opacity-50" : ""}
              >
                <ToggleLeft className="h-4 w-4 mr-2" />
                {client?.status === "active" ? "Desativar" : "Ativar"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {client?.status === "active" ? "Desativar" : "Ativar"} cliente?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {client?.status === "active"
                    ? "Esta ação irá desativar o cliente. Clientes inativos não aparecem nas buscas padrão."
                    : "Esta ação irá ativar o cliente novamente."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onToggleStatus}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {!canDeactivate && client?.status === "active" && (
        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Não é possível desativar este cliente pois ele possui uma dívida pendente.</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="payments">Histórico de Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>Dados cadastrais e financeiros</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-[250px]" />
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-6 w-[300px]" />
                  <Skeleton className="h-6 w-[250px]" />
                </div>
              ) : (
                <LegacyClientInfo client={client ?? null} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Registro de todos os pagamentos realizados por este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentHistoryTable 
                paymentHistory={paymentHistory || []} 
                isLoading={isLoadingHistory} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <LegacyClientDialogs
        newClientDialogOpen={false}
        clientToEdit={state.clientToEdit}
        onNewClientDialogChange={() => {}}
        onEditClientDialogChange={actions.handleCloseEditClient}
        onSuccess={() => {
          // Recarregar dados do cliente
          window.location.reload();
        }}
      />
    </div>
  );
}