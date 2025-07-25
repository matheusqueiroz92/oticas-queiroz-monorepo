"use client";

import { useState } from "react";
import { X } from "lucide-react";
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

interface LegacyClientFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
}

export function LegacyClientFilters({ onUpdateFilters }: LegacyClientFiltersProps) {
  const [localFilters, setLocalFilters] = useState({
    status: "todos" as "active" | "inactive" | "todos",
    debtRange: "todos" as "low" | "medium" | "high" | "todos",
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    // Aplicar filtros
    const filtersToApply: Record<string, any> = {};
    
    if (newFilters.status && newFilters.status !== "todos") {
      filtersToApply.status = newFilters.status;
    }
    if (newFilters.debtRange && newFilters.debtRange !== "todos") {
      filtersToApply.debtRange = newFilters.debtRange;
    }
    
    onUpdateFilters(filtersToApply);
  };

  const clearFilters = () => {
    setLocalFilters({
      status: "todos",
      debtRange: "todos",
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
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debtRange">Faixa de Dívida</Label>
            <Select
              value={localFilters.debtRange}
              onValueChange={(value) => handleFilterChange("debtRange", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as faixas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as faixas</SelectItem>
                <SelectItem value="low">Baixa (até R$ 100)</SelectItem>
                <SelectItem value="medium">Média (R$ 100 - R$ 500)</SelectItem>
                <SelectItem value="high">Alta (acima de R$ 500)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 