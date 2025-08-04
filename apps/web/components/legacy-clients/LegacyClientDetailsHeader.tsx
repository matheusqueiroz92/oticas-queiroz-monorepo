import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, ToggleLeft, AlertTriangle } from "lucide-react";
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
import { LegacyClient } from "@/app/_types/legacy-client";

interface LegacyClientDetailsHeaderProps {
  client: LegacyClient | null;
  isLoading: boolean;
  isTogglingStatus: boolean;
  onGoBack: () => void;
  onEditClient: () => void;
  onToggleStatus: () => void;
}

export function LegacyClientDetailsHeader({
  client,
  isLoading,
  isTogglingStatus,
  onGoBack,
  onEditClient,
  onToggleStatus,
}: LegacyClientDetailsHeaderProps) {
  const canDeactivate = (client?.debt || 0) === 0 || client?.status === "inactive";

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
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
          onClick={onEditClient}
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
  );
} 