"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, FilterX, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { reportTypeOptions } from "@/app/types/report";

export function ReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inicializar estado com parâmetros da URL
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate")
      ? new Date(searchParams.get("startDate") as string)
      : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate")
      ? new Date(searchParams.get("endDate") as string)
      : undefined
  );

  // Aplicar filtros e atualizar a URL
  const handleFilter = () => {
    const params = new URLSearchParams();

    // Adicionar filtros não vazios
    if (search) params.append("search", search);
    if (type && type !== "all") params.append("type", type);
    if (status && status !== "all") params.append("status", status);
    if (startDate)
      params.append("startDate", startDate.toISOString().split("T")[0]);
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0]);

    // Atualizar URL com filtros
    router.push(`/reports?${params.toString()}`);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearch("");
    setType("all");
    setStatus("all");
    setStartDate(undefined);
    setEndDate(undefined);
    router.push("/reports");
  };

  // Verificar se há algum filtro ativo
  const hasActiveFilters = search || type || status || startDate || endDate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Campo de busca */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar relatório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          />
          <Button type="submit" size="icon" onClick={handleFilter}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtro por tipo de relatório */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de relatório" />
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

        {/* Filtro por status */}
        <Select value={status} onValueChange={setStatus}>
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

        {/* Filtro por período */}
        <div className="flex gap-2">
          {/* Data inicial */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal flex-1",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Data inicial</span>
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

          {/* Data final */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal flex-1",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Data final</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Ações dos filtros */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={!hasActiveFilters ? "opacity-50 cursor-not-allowed" : ""}
        >
          <FilterX className="mr-2 h-4 w-4" />
          Limpar filtros
        </Button>

        <Button onClick={handleFilter}>
          <Search className="mr-2 h-4 w-4" />
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}
