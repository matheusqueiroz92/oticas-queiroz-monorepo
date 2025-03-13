"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type IReport, reportTypeMap } from "@/app/types/report";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/app/utils/formatters";
import { reportService } from "@/app/services/reportService";

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
  const { toast } = useToast();

  const handleViewReport = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  const handleDownload = async (
    report: IReport,
    format: "json" | "excel" | "pdf" | "csv"
  ) => {
    try {
      // Verificar se o relatório está pronto
      if (report.status !== "completed") {
        toast({
          title: "Relatório não está pronto",
          description:
            "Aguarde até que o relatório seja concluído para fazer o download.",
          variant: "destructive",
        });
        return;
      }

      const blob = await reportService.downloadReport(report._id, format);

      // Criar link para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, "-").toLowerCase()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: `Seu relatório está sendo baixado no formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao fazer download do relatório:", error);
      toast({
        title: "Erro ao fazer download",
        description: "Ocorreu um erro ao baixar o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const { page, pageSize, totalPages, total, onPageChange, onPageSizeChange } =
    pagination;

  // Gerar números de páginas para a paginação
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, page - halfVisible);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("ellipsis");
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("ellipsis");
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell>{formatDate(new Date(report.createdAt))}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleViewReport(report._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewReport(report._id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(report, "excel")}
                        disabled={report.status !== "completed"}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(report, "pdf")}
                        disabled={report.status !== "completed"}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(report, "csv")}
                        disabled={report.status !== "completed"}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {reports.length} de {total} relatórios
          </p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">por página</p>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className={page === 1 ? "disabled" : ""}
              />
            </PaginationItem>

            {getPageNumbers().map((pageNumber) =>
              pageNumber === "ellipsis" ? (
                <PaginationItem key={`${page}-${Math.random()}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={page === pageNumber}
                    onClick={() => onPageChange(Number(pageNumber))}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className={page === totalPages ? "disabled" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
