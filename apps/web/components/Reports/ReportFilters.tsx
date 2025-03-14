"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { reportTypeOptions } from "@/app/types/report";
import { useReports } from "@/hooks/useReports";
import type { ReportType, ReportStatus } from "@/app/types/report";

export function ReportFilters() {
  const { filters, updateFilters } = useReports();

  const [search, setSearch] = useState(filters.search || "");
  const [reportType, setReportType] = useState<ReportType | "all">(
    (filters.type as ReportType) || "all"
  );
  const [status, setStatus] = useState<ReportStatus | "all">(
    (filters.status as ReportStatus) || "all"
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  // Função para aplicar os filtros
  const applyFilters = () => {
    const newFilters: {
      search?: string;
      type?: ReportType;
      status?: ReportStatus;
      startDate?: string;
      endDate?: string;
    } = {};

    if (search) newFilters.search = search;
    if (reportType !== "all") newFilters.type = reportType;
    if (status !== "all") newFilters.status = status;
    if (startDate) newFilters.startDate = format(startDate, "yyyy-MM-dd");
    if (endDate) newFilters.endDate = format(endDate, "yyyy-MM-dd");

    updateFilters(newFilters);
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setSearch("");
    setReportType("all");
    setStatus("all");
    setStartDate(undefined);
    setEndDate(undefined);
    updateFilters({});
  };

  // Verificar se existem filtros ativos
  const hasActiveFilters =
    search || reportType !== "all" || status !== "all" || startDate || endDate;

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar relatório por nome..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Select
          value={reportType}
          onValueChange={(value) => setReportType(value as ReportType | "all")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Relatório" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {reportTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ReportStatus | "all")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="processing">Em processamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "dd/MM/yyyy")
                ) : (
                  <span>Data Inicial</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2 max-w-3xl">
          {hasActiveFilters && (
            <>
              {search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Busca: {search}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSearch("")}
                  />
                </Badge>
              )}

              {reportType !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tipo:{" "}
                  {
                    reportTypeOptions.find((opt) => opt.value === reportType)
                      ?.label
                  }
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setReportType("all")}
                  />
                </Badge>
              )}

              {status !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status:{" "}
                  {status === "pending"
                    ? "Pendente"
                    : status === "processing"
                      ? "Em processamento"
                      : status === "completed"
                        ? "Concluído"
                        : "Erro"}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setStatus("all")}
                  />
                </Badge>
              )}

              {startDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  A partir de:{" "}
                  {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setStartDate(undefined)}
                  />
                </Badge>
              )}

              {endDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Até: {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setEndDate(undefined)}
                  />
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Limpar Filtros
          </Button>
          <Button onClick={applyFilters}>Aplicar Filtros</Button>
        </div>
      </div>
    </div>
  );
}
