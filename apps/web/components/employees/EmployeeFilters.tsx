import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

interface EmployeeFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
}

export function EmployeeFilters({ onUpdateFilters }: EmployeeFiltersProps) {
  const [localFilters, setLocalFilters] = useState({
    role: "",
    status: "",
    salesRange: "",
    sortBy: "name",
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    // Aplicar filtros
    const filtersToApply: Record<string, any> = {};
    
    if (newFilters.role) filtersToApply.role = newFilters.role;
    if (newFilters.status) filtersToApply.status = newFilters.status;
    if (newFilters.salesRange) filtersToApply.salesRange = newFilters.salesRange;
    if (newFilters.sortBy) filtersToApply.sort = newFilters.sortBy;
    
    onUpdateFilters(filtersToApply);
  };

  const clearFilters = () => {
    setLocalFilters({
      role: "",
      status: "",
      salesRange: "",
      sortBy: "name",
    });
    onUpdateFilters({ sort: "name" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select
              value={localFilters.role}
              onValueChange={(value) => handleFilterChange("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as funções</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="employee">Funcionário</SelectItem>
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
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesRange">Faixa de Vendas</Label>
            <Select
              value={localFilters.salesRange}
              onValueChange={(value) => handleFilterChange("salesRange", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as faixas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as faixas</SelectItem>
                <SelectItem value="0">Sem vendas</SelectItem>
                <SelectItem value="1-5">1-5 vendas</SelectItem>
                <SelectItem value="6-10">6-10 vendas</SelectItem>
                <SelectItem value="10+">10+ vendas</SelectItem>
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

        <div className="flex justify-end">
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
      </CardContent>
    </Card>
  );
} 