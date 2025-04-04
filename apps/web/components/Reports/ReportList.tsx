"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DownloadCloud,
  Eye,
  FileText,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { IReport, ReportFormat } from "@/app/types/report";
import { reportTypeMap } from "@/app/types/report";
import { useReports } from "@/hooks/useReports";
import { toast } from "@/hooks/useToast";
import { exportService } from "@/app/services/exportService";
import { PaginationItems } from "../PaginationItems";

interface ReportListProps {
  reports: IReport[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  onRefresh: () => void;
}

export function ReportList({
  reports,
  pagination,
  onRefresh,
}: ReportListProps) {
  const router = useRouter();
  const { totalPages, currentPage, totalReports, pageSize } = useReports();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500); // Garantir que o ícone de refresh apareça por pelo menos 500ms
  };

  const handleViewReport = (id: string) => {
    router.push(`/reports/${id}`);
  };

  const handleDownload = async (id: string, format: ReportFormat) => {
    try {
      // Verificar se relatório está pronto
      const currentReport = reports.find(report => report._id === id);
      if (!currentReport || currentReport.status !== "completed") {
        toast({
          variant: "destructive",
          title: "Relatório não está pronto",
          description: "Aguarde até que o relatório seja concluído para fazer o download."
        });
        return;
      }
      
      // Mostrar toast de início de download
      toast({
        title: "Iniciando download",
        description: "Preparando seu relatório para download...",
      });
      
      // Usar o serviço de exportação
      const blob = await exportService.exportReport(id, { format });
      
      // Verificar se o blob contém uma mensagem de erro
      if (await exportService.isErrorBlob(blob)) {
        throw new Error("O servidor retornou um erro ao gerar o relatório");
      }
      
      // Nome do arquivo baseado no relatório
      const filename = exportService.generateFilename(
        currentReport.name.replace(/\s+/g, "-").toLowerCase(),
        format
      );
      
      // Fazer download
      exportService.downloadBlob(blob, filename);
      
      toast({
        title: "Download concluído",
        description: `Seu relatório foi baixado com sucesso em formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast({
        variant: "destructive",
        title: "Erro no download",
        description: "Não foi possível baixar o relatório. Tente novamente."
      });
    }
  };

  if (reports.length === 0) {
    return (
      <Alert className="my-4">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Nenhum relatório encontrado com os filtros selecionados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report._id}>
                <TableCell className="font-medium">{report.name}</TableCell>
                <TableCell>{reportTypeMap[report.type]}</TableCell>
                <TableCell>
                  <ReportStatusBadge status={report.status} />
                </TableCell>
                <TableCell className="uppercase">{report.format}</TableCell>
                <TableCell>
                  {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewReport(report._id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>

                      {report.status === "completed" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleDownload(report._id, report.format)
                          }
                        >
                          <DownloadCloud className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationItems
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={pagination.onPageChange}
        totalItems={totalReports}
        pageSize={pageSize}
      />
    </div>
  );
}
