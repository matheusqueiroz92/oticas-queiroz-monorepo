import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationItems } from "@/components/PaginationItems";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { formatDate } from "@/app/_utils/formatters";
import { reportTypeMap } from "@/app/_types/report";
import { Eye, FileDown, AlertCircle } from "lucide-react";
import type { Report, ReportFormat } from "@/app/_types/report";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ReportTableSectionProps {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  search: string;
  activeFiltersCount: number;
  onDetailsClick: (reportId: string) => void;
  onDownloadClick: (report: Report, format: ReportFormat) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function ReportTableSection({
  reports,
  isLoading,
  error,
  search,
  activeFiltersCount,
  onDetailsClick,
  onDownloadClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: ReportTableSectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (report: Report, format: ReportFormat) => {
    setDownloadingId(report._id + format);
    try {
      await onDownloadClick(report, format);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Erro ao carregar relatórios
        </h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          {search || activeFiltersCount > 0 ? (
            <>
              <p className="text-lg font-medium mb-2">
                Nenhum relatório encontrado
              </p>
              <p>
                Tente ajustar os filtros ou termos de busca para encontrar o que
                procura.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Nenhum relatório criado ainda
              </p>
              <p>Crie seu primeiro relatório para começar.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report._id}>
                <TableCell className="font-medium">{report.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {reportTypeMap[report.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ReportStatusBadge status={report.status} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {report.format.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(new Date(report.createdAt))}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDetailsClick(report._id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {report.status === "completed" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={downloadingId?.startsWith(report._id)}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(report, "pdf")}>Baixar PDF</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(report, "csv")}>Baixar CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <PaginationItems
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          pageSize={limit}
        />
      )}
    </div>
  );
} 