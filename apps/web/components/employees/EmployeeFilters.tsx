import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface EmployeeFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
}

export function EmployeeFilters({ onUpdateFilters }: EmployeeFiltersProps) {
  const [localFilters, setLocalFilters] = useState({
    totalSalesRange: "todos",
    sortBy: "name",
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    // Aplicar filtros
    const filtersToApply: Record<string, any> = {};
    
    if (newFilters.totalSalesRange && newFilters.totalSalesRange !== "todos") filtersToApply.totalSalesRange = newFilters.totalSalesRange;
    if (newFilters.sortBy) filtersToApply.sort = newFilters.sortBy;
    
    onUpdateFilters(filtersToApply);
  };

  const clearFilters = () => {
    setLocalFilters({
      totalSalesRange: "todos",
      sortBy: "name",
    });
    onUpdateFilters({ sort: "name" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Filtros Avançados
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpar Filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalSalesRange">Valor Total em Vendas</Label>
            <Select
              value={localFilters.totalSalesRange}
              onValueChange={(value) => handleFilterChange("totalSalesRange", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os valores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os valores</SelectItem>
                <SelectItem value="0">Sem vendas</SelectItem>
                <SelectItem value="1000+">R$ 1.000+</SelectItem>
                <SelectItem value="5000+">R$ 5.000+</SelectItem>
                <SelectItem value="10000+">R$ 10.000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="revenue">Faturamento</SelectItem>
                <SelectItem value="createdAt">Data de cadastro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 