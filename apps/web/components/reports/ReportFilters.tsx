"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportTypeOptions } from "@/app/_types/report";
import type { ReportType, ReportStatus } from "@/app/_types/report";

interface ReportFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
}

export function ReportFilters({ onUpdateFilters }: ReportFiltersProps) {
  const [localFilters, setLocalFilters] = useState({
    reportType: "todos" as ReportType | "todos",
    status: "todos" as ReportStatus | "todos",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    // Aplicar filtros
    const filtersToApply: Record<string, any> = {};
    
    if (newFilters.reportType && newFilters.reportType !== "todos") {
      filtersToApply.type = newFilters.reportType;
    }
    if (newFilters.status && newFilters.status !== "todos") {
      filtersToApply.status = newFilters.status;
    }
    if (newFilters.startDate) {
      filtersToApply.startDate = format(newFilters.startDate, "yyyy-MM-dd");
    }
    if (newFilters.endDate) {
      filtersToApply.endDate = format(newFilters.endDate, "yyyy-MM-dd");
    }
    
    onUpdateFilters(filtersToApply);
  };

  const clearFilters = () => {
    setLocalFilters({
      reportType: "todos",
      status: "todos",
      startDate: undefined,
      endDate: undefined,
    });
    onUpdateFilters({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Filtros Avançados</CardTitle>
          <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
            <X className="w-4 h-4" /> Limpar Filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Tipo de Relatório</Label>
            <Select
              value={localFilters.reportType}
              onValueChange={(value) => handleFilterChange("reportType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {reportTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Em processamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.startDate ? (
                    format(localFilters.startDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localFilters.startDate}
                  onSelect={(date) => handleFilterChange("startDate", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.endDate ? (
                    format(localFilters.endDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localFilters.endDate}
                  onSelect={(date) => handleFilterChange("endDate", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
