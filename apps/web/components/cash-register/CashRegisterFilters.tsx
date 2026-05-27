import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

interface CashRegisterFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  date?: Date;
  setDate: (date?: Date) => void;
  onApplyDateFilter: () => void;
  onClearFilters: () => void;
}

export function CashRegisterFilters({
  search,
  setSearch,
  date,
  setDate,
  onApplyDateFilter,
  onClearFilters,
}: CashRegisterFiltersProps) {
  
  return (
    <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por data ou responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] max-w-xs"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {date
                ? format(date, "dd/MM/yyyy", { locale: ptBR })
                : "Filtrar por data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
            <div className="p-3 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDate(undefined)}
              >
                Limpar
              </Button>
              <Button size="sm" onClick={onApplyDateFilter}>
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="sm" onClick={onClearFilters} className="shrink-0">
          Limpar Filtros
        </Button>
    </div>
  );
}