"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import {
  createReport,
  getReportById,
  getUserReports,
} from "@/app/_services/reportService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import type {
  CreateReportDTO,
  ReportType,
  ReportStatus,
  ReportFormat,
} from "@/app/_types/report";
import { exportService } from "@/app/_services/exportService";

interface ReportFilters {
  search?: string;
  type?: ReportType;
  status?: ReportStatus;
  startDate?: Date;
  endDate?: Date;
}

export function useReports() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar relatórios
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.REPORTS.PAGINATED(currentPage, {
      ...filters,
      search,
      limit: pageSize,
    }),
    queryFn: () => getUserReports(currentPage, pageSize, { 
      ...filters, 
      search,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    }),
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
  
      // Mostrar toast de início do download
      toast({
        title: "Processando download",
        description: "Preparando seu relatório para download...",
      });
  
      // Usar o serviço de exportação
      const blob = await exportService.exportReport(id, { format });
      
      // Verificar se o blob contém uma mensagem de erro
      if (await exportService.isErrorBlob(blob)) {
        throw new Error("O servidor retornou um erro ao gerar o relatório");
      }
  
      // Criar nome de arquivo baseado no nome do relatório
      const filename = exportService.generateFilename(
        report.name.replace(/\s+/g, "-").toLowerCase(),
        format
      );
      
      // Download do blob
      exportService.downloadBlob(blob, filename);
  
      toast({
        title: "Download concluído",
        description: `Seu relatório foi baixado com sucesso.`,
      });
  
      return blob;
    } catch (error) {
      console.error(`Erro ao baixar relatório com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro no download",
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

  // Função para contar filtros ativos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (filters.type) count++;
    if (filters.status) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
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
    search,
    currentPage,
    pageSize,
    totalPages,
    totalReports,
    filters,

    // Mutações e seus estados
    isCreating: createReportMutation.isPending,

    // Ações
    setSearch,
    setCurrentPage,
    setPageSize,
    updateFilters,
    getActiveFiltersCount,
    fetchReportById,
    handleCreateReport,
    handleDownloadReport,
    navigateToReportDetails,
    navigateToCreateReport,
    refetch,
  };
}
