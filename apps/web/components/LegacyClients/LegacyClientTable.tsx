import { useMemo } from "react";
import type { LegacyClient, LegacyClientColumn } from "@/app/types/legacy-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/app/utils/formatters";
import {
  DollarSign,
  UserCog,
  User,
  Phone,
  Mail,
  Ban,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
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

interface LegacyClientTableProps {
  data: LegacyClient[];
  onDetailsClick: (id: string) => void;
  onToggleStatus?: (id: string) => Promise<void>;
  isTogglingStatus?: boolean;
  columns?: LegacyClientColumn[];
  sortField?: keyof LegacyClient;
  sortDirection?: "asc" | "desc";
}

export const LegacyClientTable: React.FC<LegacyClientTableProps> = ({
  data,
  onDetailsClick,
  onToggleStatus,
  isTogglingStatus = false,
  sortField = "name",
  sortDirection = "asc",
}) => {
  const sortedData = useMemo(() => {
    const dataToSort = [...data];
    
    return dataToSort.sort((a, b) => {
      const valueA = String(a[sortField] || "").toLowerCase();
      const valueB = String(b[sortField] || "").toLowerCase();
      
      if (sortDirection === "asc") {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  }, [data, sortField, sortDirection]);

  const handleToggleStatus = async (id: string) => {
    if (onToggleStatus) {
      await onToggleStatus(id);
    }
  };

  const formatCpf = (cpf: string) => {
    if (!cpf) return "";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  if (sortedData.length === 0) {
    return <div className="text-center py-4">Nenhum cliente legado encontrado.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>CPF</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Dívida
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((client) => (
          <TableRow key={client._id}>
            <TableCell className="font-medium">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                {client.name}
              </div>
            </TableCell>
            <TableCell>{formatCpf(client.cpf)}</TableCell>
            <TableCell>
              <div className="space-y-1">
                {client.phone && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                    {client.phone}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                    {client.email}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className={`font-medium ${client.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(client.totalDebt)}
              </div>
              {client.lastPayment && (
                <div className="text-xs text-gray-500 mt-1">
                  Último pagamento: {new Date(client.lastPayment.date).toLocaleDateString()}
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge 
                variant="outline" 
                className={
                  client.status === "active" 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {client.status === "active" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Ban className="h-3.5 w-3.5 mr-1" />
                )}
                {client.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => onDetailsClick(client._id)}
                >
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Detalhes
                </Button>
                
                {onToggleStatus && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={client.status === "active" ? "destructive" : "outline"}
                        size="sm"
                        className="h-8"
                        disabled={isTogglingStatus}
                      >
                        {client.status === "active" ? (
                          <Ban className="h-4 w-4 mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        {client.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {client.status === "active" 
                            ? "Desativar cliente" 
                            : "Ativar cliente"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {client.status === "active"
                            ? `Tem certeza que deseja desativar o cliente "${client.name}"? 
                               Isso impedirá o registro de novas operações para este cliente.`
                            : `Tem certeza que deseja ativar o cliente "${client.name}"?`}
                          {client.status === "active" && client.totalDebt > 0 && (
                            <p className="mt-2 font-medium text-red-500">
                              Atenção: Este cliente possui uma dívida de {formatCurrency(client.totalDebt)}.
                              Não é possível desativar clientes com dívidas pendentes.
                            </p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleToggleStatus(client._id)}
                          disabled={client.status === "active" && client.totalDebt > 0}
                          className={client.status === "active" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          {client.status === "active" ? "Desativar" : "Ativar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};