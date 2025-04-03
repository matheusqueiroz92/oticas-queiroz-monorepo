"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import {
  createReport,
  getReportById,
  getUserReports,
  downloadReport,
} from "@/app/services/reportService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type {
  CreateReportDTO,
  ReportType,
  ReportStatus,
  ReportFormat,
} from "../app/types/report";
import { exportService } from "../app/services/exportService";

interface ReportFilters {
  search?: string;
  type?: ReportType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
}

export function useReports() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar relatórios
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.REPORTS.PAGINATED(currentPage, {
      ...filters,
      limit: pageSize,
    }),
    queryFn: () => getUserReports(currentPage, pageSize, filters),
    placeholderData: (prevData) => prevData,
  });

  // Dados normalizados
  const reports = data?.reports || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalReports = data?.pagination?.total || 0;

  // Mutation para criar relatório
  const createReportMutation = useMutation({
    mutationFn: createReport,
    onSuccess: (newReport) => {
      toast({
        title: "Relatório solicitado",
        description:
          "O relatório está sendo gerado e ficará disponível em breve.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.REPORTS.PAGINATED(),
      });

      return newReport;
    },
    onError: (error: unknown) => {
      console.error("Erro ao criar relatório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o relatório. Tente novamente.",
      });
    },
  });

  // Custom query para buscar um relatório específico
  const fetchReportById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.REPORTS.DETAIL(id),
      queryFn: () => getReportById(id),
      enabled: !!id,
    });
  };

  // Função para baixar relatório
  const handleDownloadReport = async (
    id: string,
    format: ReportFormat
  ): Promise<Blob | null> => {
    try {
      // Verificar se o relatório está pronto para download
      const report = await getReportById(id);
  
      if (report.status !== "completed") {
        toast({
          variant: "destructive",
          title: "Relatório não está pronto",
          description:
            "Aguarde até que o relatório seja concluído para fazer o download.",
        });
        return null;
      }
  
      // Usar o serviço de exportação
      const blob = await exportService.exportReport(id, { format });
  
      // Criar nome de arquivo baseado no nome do relatório
      const filename = exportService.generateFilename(
        report.name.replace(/\s+/g, "-").toLowerCase(),
        format
      );
      
      // Download do blob
      exportService.downloadBlob(blob, filename);
  
      toast({
        title: "Download iniciado",
        description: `Seu relatório está sendo baixado no formato ${format.toUpperCase()}.`,
      });
  
      return blob;
    } catch (error) {
      console.error(`Erro ao baixar relatório com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível baixar o relatório. Tente novamente.",
      });
      return null;
    }
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: ReportFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Funções que utilizam as mutations
  const handleCreateReport = (data: CreateReportDTO) => {
    return createReportMutation.mutateAsync(data);
  };

  // Funções de navegação
  const navigateToReportDetails = (id: string) => {
    router.push(`/reports/${id}`);
  };

  const navigateToCreateReport = () => {
    router.push("/reports/create");
  };

  return {
    // Dados e estado
    reports,
    isLoading,
    error: error ? String(error) : null,
    currentPage,
    pageSize,
    totalPages,
    totalReports,
    filters,

    // Mutações e seus estados
    isCreating: createReportMutation.isPending,

    // Ações
    setCurrentPage,
    setPageSize,
    updateFilters,
    fetchReportById,
    handleCreateReport,
    handleDownloadReport,
    navigateToReportDetails,
    navigateToCreateReport,
    refetch,
  };
}
