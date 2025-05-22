"use client";

import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/PageTitle";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { ArrowLeft, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToPDF } from "@/app/_utils/exportToPdf";
import { useToast } from "@/hooks/useToast";

export default function DebtorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { useDebtors } = useLegacyClients();
  const { data: debtors, isLoading } = useDebtors();

  const exportDebtorsList = async () => {
    if (!debtors?.length) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não há dados de devedores para exportar",
      });
      return;
    }

    try {
      // Preparar dados para exportação
      const exportData = debtors.map((debtor) => ({
        Nome: debtor.name,
        CPF: debtor.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
        Telefone: debtor.phone
          ? debtor.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
          : "-",
        "Valor da Dívida": formatCurrency(debtor.totalDebt),
        "Último Pagamento": debtor.lastPayment
          ? `${formatCurrency(debtor.lastPayment.amount)} em ${formatDate(
              debtor.lastPayment.date
            )}`
          : "Nenhum pagamento",
        Status: debtor.status === "active" ? "Ativo" : "Inativo",
      }));

      await exportToPDF(
        exportData,
        `devedores-${new Date().toISOString().split("T")[0]}.pdf`,
        "Relatório de Clientes Devedores"
      );

      toast({
        title: "Exportação concluída",
        description: "O relatório de devedores foi exportado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao exportar devedores:", error);
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não foi possível exportar o relatório de devedores",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <PageTitle
            title="Clientes Devedores"
            description="Lista de clientes com dívidas pendentes"
          />
        </div>
        <Button
          variant="outline"
          onClick={exportDebtorsList}
          disabled={isLoading || !debtors?.length}
        >
          <FileDown className="h-4 w-4 mr-2" />
          Exportar Lista
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Lista de Devedores</CardTitle>
          <CardDescription>
            Todos os clientes ativos com saldo devedor
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : !debtors?.length ? (
            <div className="text-center py-6 text-gray-500">
              Não há clientes com dívidas pendentes.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Dívida</TableHead>
                    <TableHead>Último Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtors.map((debtor) => (
                    <TableRow key={debtor._id}>
                      <TableCell className="font-medium">
                        {debtor.name}
                      </TableCell>
                      <TableCell>
                        {debtor.cpf.replace(
                          /(\d{3})(\d{3})(\d{3})(\d{2})/,
                          "$1.$2.$3-$4"
                        )}
                      </TableCell>
                      <TableCell>
                        {debtor.phone
                          ? debtor.phone.replace(
                              /(\d{2})(\d{5})(\d{4})/,
                              "($1) $2-$3"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(debtor.totalDebt)}
                      </TableCell>
                      <TableCell>
                        {debtor.lastPayment ? (
                          <>
                            {formatCurrency(debtor.lastPayment.amount)}
                            <span className="text-gray-500 text-xs ml-1">
                              em {formatDate(debtor.lastPayment.date)}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            Nenhum pagamento
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/legacy-clients/${debtor._id}`)
                          }
                        >
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}