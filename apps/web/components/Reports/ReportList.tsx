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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { IReport, ReportFormat } from "@/app/types/report";
import { reportTypeMap } from "@/app/types/report";
import { useReports } from "@/hooks/useReports";

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
  const { handleDownloadReport } = useReports();
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
    await handleDownloadReport(id, format);
  };

  // Função para gerar os itens de paginação
  const generatePaginationItems = () => {
    const items = [];
    const { page, totalPages } = pagination;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Se tiver poucas páginas, mostra todas
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => pagination.onPageChange(i)}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return items;
    }

    // Caso contrário, mostra um subconjunto com elipses
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => pagination.onPageChange(1)}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Adicionar elipse se necessário
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <span className="px-4">...</span>
        </PaginationItem>
      );
    }

    // Páginas próximas à atual
    const startPage = Math.max(2, page - 1);
    const endPage = Math.min(totalPages - 1, page + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i <= 1 || i >= totalPages) continue;
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => pagination.onPageChange(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Adicionar elipse se necessário
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <span className="px-4">...</span>
        </PaginationItem>
      );
    }

    // Última página
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => pagination.onPageChange(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
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

      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    pagination.onPageChange(Math.max(1, pagination.page - 1))
                  }
                  aria-disabled={pagination.page === 1}
                  className={
                    pagination.page === 1
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>

              {generatePaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    pagination.onPageChange(
                      Math.min(pagination.totalPages, pagination.page + 1)
                    )
                  }
                  aria-disabled={pagination.page === pagination.totalPages}
                  className={
                    pagination.page === pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-center text-sm text-muted-foreground mt-2">
            Mostrando {reports.length} de {pagination.total} relatórios
          </div>
        </div>
      )}
    </div>
  );
}
