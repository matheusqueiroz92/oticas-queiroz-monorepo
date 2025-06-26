import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PaymentFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
}

export function PaymentFilters({ onUpdateFilters }: PaymentFiltersProps) {
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    minAmount: "",
    maxAmount: "",
    customerId: "",
    cashRegisterId: "",
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    const activeFilters: Record<string, any> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null && value !== "all") {
        if (key === "startDate" || key === "endDate") {
          activeFilters[key] = value;
        } else if (key === "minAmount" || key === "maxAmount") {
          const numValue = parseFloat(value as string);
          if (!isNaN(numValue)) {
            activeFilters[key] = numValue;
          }
        } else {
          activeFilters[key] = value;
        }
      }
    });
    
    onUpdateFilters(activeFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      startDate: undefined,
      endDate: undefined,
      minAmount: "",
      maxAmount: "",
      customerId: "",
      cashRegisterId: "",
    };
    setFilters(clearedFilters);
    onUpdateFilters({});
  };

  return (
    <Card className="border-t-0 rounded-t-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center justify-between">
          Filtros Avançados
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
            <Button variant="default" size="sm" onClick={applyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Valor Mínimo */}
          <div className="space-y-2">
            <Label htmlFor="min-amount">Valor Mínimo (R$)</Label>
            <Input
              id="min-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            />
          </div>

          {/* Valor Máximo */}
          <div className="space-y-2">
            <Label htmlFor="max-amount">Valor Máximo (R$)</Label>
            <Input
              id="max-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
          </div>

          {/* Data Inicial */}
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => handleFilterChange("startDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Final */}
          <div className="space-y-2">
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => handleFilterChange("endDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 