"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  createReport,
  getReportById,
  getUserReports,
  downloadReport,
} from "@/app/services/reportService";
import type {
  IReport,
  CreateReportDTO,
  ReportType,
  ReportStatus,
  ReportFormat,
} from "../app/types/report";

interface ReportFilters {
  search?: string;
  type?: ReportType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
}

export function useReports() {
  const [reports, setReports] = useState<IReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [filters, setFilters] = useState<ReportFilters>({});

  const router = useRouter();
  const { toast } = useToast();

  // Função para buscar relatórios com filtros
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getUserReports(currentPage, pageSize, filters);

      if (response.reports) {
        setReports(response.reports);
      }

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalReports(response.pagination.total || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
      setError("Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Carrega os relatórios quando os filtros ou a paginação mudam
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Função para buscar um relatório específico por ID
  const fetchReportById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const report = await getReportById(id);
      return report;
    } catch (error) {
      console.error(`Erro ao buscar relatório com ID ${id}:`, error);
      setError("Não foi possível carregar o relatório.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para criar um novo relatório
  const handleCreateReport = async (data: CreateReportDTO) => {
    try {
      setLoading(true);
      const report = await createReport(data);

      toast({
        title: "Relatório solicitado",
        description:
          "O relatório está sendo gerado e ficará disponível em breve.",
      });

      fetchReports();
      return report;
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o relatório. Tente novamente.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para baixar um relatório
  const handleDownloadReport = async (id: string, format: ReportFormat) => {
    try {
      setLoading(true);

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

      const blob = await downloadReport(id, format);

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

      return blob;
    } catch (error) {
      console.error(`Erro ao baixar relatório com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível baixar o relatório. Tente novamente.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar os filtros
  const updateFilters = (newFilters: ReportFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao aplicar novos filtros
  };

  // Função para navegar para a página de detalhes
  const navigateToReportDetails = (id: string) => {
    router.push(`/reports/${id}`);
  };

  // Função para navegar para a página de criação
  const navigateToCreateReport = () => {
    router.push("/reports/create");
  };

  return {
    reports,
    loading,
    error,
    currentPage,
    pageSize,
    totalPages,
    totalReports,
    filters,
    setCurrentPage,
    setPageSize,
    updateFilters,
    fetchReports,
    fetchReportById,
    handleCreateReport,
    handleDownloadReport,
    navigateToReportDetails,
    navigateToCreateReport,
  };
}
