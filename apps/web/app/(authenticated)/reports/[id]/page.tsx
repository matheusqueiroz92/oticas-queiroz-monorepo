"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/app/_services/reportService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileDown, Loader2, RefreshCw } from "lucide-react";
import { formatDate } from "@/app/_utils/formatters";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { ReportDataVisualization } from "@/components/reports/ReportDataVisualization";
import { ReportFiltersDisplay } from "@/components/reports/ReportFiltersDisplay";
import { PageTitle } from "@/components/ui/page-title";
import { reportTypeMap } from "@/app/_types/report";
import { useToast } from "@/hooks/useToast";
import { useReports } from "@/hooks/useReports";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import type { ReportFormat } from "@/app/_types/report";

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { handleDownloadReport } = useReports();
  const reportId = params.id as string;

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.REPORTS.DETAIL(reportId),
    queryFn: () => reportService.getReportById(reportId),
    refetchInterval: (query: any) => {
      // Auto refetch if report is still processing
      if (!query || !query.data) return false;
      const reportStatus = query.data.status;
      return reportStatus === "pending" || reportStatus === "processing"
        ? 5000 // poll every 5 seconds while processing
        : false; // don't poll if completed or error
    },
  });

  const handleDownload = async (format: ReportFormat) => {
    try {
      if (!report) return;

      // Check if report is completed
      if (report.status !== "completed") {
        toast({
          title: "Relatório não está pronto",
          description:
            "Aguarde até que o relatório seja concluído para fazer o download.",
          variant: "destructive",
        });
        return;
      }

      await handleDownloadReport(reportId, format);

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando relatório...</span>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Erro ao carregar relatório
          </h2>
          <p className="text-muted-foreground mb-6">
            Não foi possível carregar os dados do relatório. Verifique se o ID é
            válido ou tente novamente.
          </p>
          <Button variant="outline" onClick={() => router.push("/reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Relatórios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageTitle
            title={report.name}
            description={`Relatório de ${reportTypeMap[report.type]}`}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={report.status !== "completed"}>
                <FileDown className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload("excel")}>
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("csv")}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("json")}>
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {report.name}
                <ReportStatusBadge status={report.status} />
              </CardTitle>
              <CardDescription>
                Criado em {formatDate(new Date(report.createdAt))}
              </CardDescription>
            </div>
            <Badge variant="outline">{reportTypeMap[report.type]}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="visualization">
            <TabsList className="mb-4">
              <TabsTrigger value="visualization">Visualização</TabsTrigger>
              <TabsTrigger value="filters">Filtros Aplicados</TabsTrigger>
            </TabsList>
            <TabsContent value="visualization">
              {report.status === "completed" ? (
                <ReportDataVisualization report={report} />
              ) : report.status === "error" ? (
                <div className="p-6 text-center">
                  <p className="text-destructive font-medium">
                    Erro ao gerar relatório
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {report.errorMessage ||
                      "Ocorreu um erro ao processar o relatório. Tente novamente."}
                  </p>
                </div>
              ) : (
                <div className="p-10 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Processando relatório</p>
                  <p className="text-muted-foreground mt-1">
                    Aguarde enquanto o relatório está sendo gerado...
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="filters">
              <ReportFiltersDisplay filters={report.filters} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Formato: {report.format.toUpperCase()}
          </div>
          <div className="text-sm text-muted-foreground">ID: {report._id}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
