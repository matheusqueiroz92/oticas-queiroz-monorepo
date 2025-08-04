"use client";

import { useState } from "react";
import { ExportService, ExportOptions } from "@/app/_services/exportService";
import { toast } from "sonner";

export function useEmployeeExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportEmployees = async (options: ExportOptions) => {
    try {
      setIsExporting(true);
      
      const blob = await ExportService.exportEmployees(options);
      
      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `funcionarios_${timestamp}.${options.format}`;
      
      // Fazer download
      ExportService.downloadBlob(blob, filename);
      
      toast.success("Exportação concluída com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar funcionários:", error);
      toast.error("Erro ao exportar funcionários. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportEmployeesWithFilters = async (
    format: "pdf" | "excel" | "csv" | "json" = "pdf",
    filters?: {
      search?: string;
      status?: string;
      salesRange?: string;
      totalSalesRange?: string;
    }
  ) => {
    const options: ExportOptions = {
      format,
      title: "Lista de Funcionários",
      ...filters,
    };

    await exportEmployees(options);
  };

  return {
    exportEmployees,
    exportEmployeesWithFilters,
    isExporting,
  };
} 