"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/authService";
import { useToast } from "@/hooks/useToast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { PageTitle } from "@/components/PageTitle";

export default function ChecksPage() {
  const [status, setStatus] = useState<"pending" | "compensated" | "rejected" | "all">("pending");
  const router = useRouter();
  const { toast } = useToast();

  const { data: checks, isLoading, refetch } = useQuery({
    queryKey: ["checks", status],
    queryFn: async () => {
      if (status === "all") {
        const responses = await Promise.all([
          api.get("/api/payments/checks/pending"),
          api.get("/api/payments/checks/compensated"),
          api.get("/api/payments/checks/rejected")
        ]);
        return [...responses[0].data, ...responses[1].data, ...responses[2].data];
      } else {
        const response = await api.get(`/api/payments/checks/${status}`);
        return response.data;
      }
    }
  });

  const updateCheckStatus = async (id: string, newStatus: "compensated" | "rejected", rejectionReason?: string) => {
    try {
      await api.put(`/api/payments/${id}/check-status`, {
        status: newStatus,
        rejectionReason
      });

      toast({
        title: "Status atualizado",
        description: `O cheque foi marcado como ${newStatus === "compensated" ? "compensado" : "rejeitado"}.`
      });

      refetch();
    } catch (error) {
      console.error("Erro ao atualizar status do cheque:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do cheque."
      });
    }
  };

  const handleMarkAsCompensated = async (id: string) => {
    const confirm = window.confirm("Confirma que este cheque foi compensado?");
    if (confirm) {
      await updateCheckStatus(id, "compensated");
    }
  };

  const handleMarkAsRejected = async (id: string) => {
    const reason = window.prompt("Informe o motivo da rejeição do cheque:");
    if (reason) {
      await updateCheckStatus(id, "rejected", reason);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "compensated":
        return <Badge className="bg-green-100 text-green-800">Compensado</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Gestão de Cheques"
        description="Acompanhe e atualize o status dos cheques recebidos"
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={status} onValueChange={(value) => setStatus(value as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="compensated">Compensados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => refetch()}>Atualizar</Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : checks && checks.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente/Titular</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Data do Cheque</TableHead>
              <TableHead>Data de Apresentação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((check: any) => (
              <TableRow key={check._id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{check.check.accountHolder}</div>
                    <div className="text-sm text-muted-foreground">
                      {check.customerId?.name || check.legacyClientId?.name || "Cliente não associado"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{check.check.bank}</TableCell>
                <TableCell>{check.check.checkNumber}</TableCell>
                <TableCell>{formatDate(check.check.checkDate)}</TableCell>
                <TableCell>
                  {check.check.presentationDate 
                    ? formatDate(check.check.presentationDate) 
                    : "Imediata"}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(check.amount)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(check.check.compensationStatus)}
                  {check.check.compensationStatus === "rejected" && check.check.rejectionReason && (
                    <div className="text-xs text-red-500 mt-1">{check.check.rejectionReason}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/payments/${check._id}`)}
                    >
                      Detalhes
                    </Button>
                    
                    {check.check.compensationStatus === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleMarkAsCompensated(check._id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Compensado
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleMarkAsRejected(check._id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitado
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum cheque encontrado</h3>
          <p className="text-muted-foreground mt-2">
            Não existem cheques cadastrados para o filtro selecionado.
          </p>
        </div>
      )}
    </div>
  );
}