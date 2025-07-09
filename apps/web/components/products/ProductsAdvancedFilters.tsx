import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Search } from "lucide-react";

interface ProductsAdvancedFiltersProps {
  onUpdateFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

export function ProductsAdvancedFilters({
  onUpdateFilters,
  onClearFilters,
}: ProductsAdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState({
    minPrice: "",
    maxPrice: "",
    brand: "",
    color: "",
    shape: "todos",
    reference: "",
  });

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    const filtersToApply: Record<string, any> = {};
    
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value.trim() && value !== "todos") {
        filtersToApply[key] = value.trim();
      }
    });

    onUpdateFilters(filtersToApply);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      minPrice: "",
      maxPrice: "",
      brand: "",
      color: "",
      shape: "todos",
      reference: "",
    });
    onClearFilters();
  };

  return (
    <div className="border-t p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Filtros Avançados</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Preço Mínimo */}
          <div className="space-y-2">
            <Label htmlFor="minPrice" className="text-xs">Preço Mínimo</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="R$ 0,00"
              value={localFilters.minPrice}
              onChange={(e) => handleFilterChange("minPrice", e.target.value)}
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
          </div>

          {/* Preço Máximo */}
          <div className="space-y-2">
            <Label htmlFor="maxPrice" className="text-xs">Preço Máximo</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="R$ 999,99"
              value={localFilters.maxPrice}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
          </div>

          {/* Marca */}
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-xs">Marca</Label>
            <Input
              id="brand"
              placeholder="Digite a marca"
              value={localFilters.brand}
              onChange={(e) => handleFilterChange("brand", e.target.value)}
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label htmlFor="color" className="text-xs">Cor</Label>
            <Input
              id="color"
              placeholder="Digite a cor"
              value={localFilters.color}
              onChange={(e) => handleFilterChange("color", e.target.value)}
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <Label htmlFor="shape" className="text-xs">Formato</Label>
            <Select value={localFilters.shape || "todos"} onValueChange={(value) => handleFilterChange("shape", value === "todos" ? "" : value)}>
              <SelectTrigger className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="redondo">Redondo</SelectItem>
                <SelectItem value="quadrado">Quadrado</SelectItem>
                <SelectItem value="retangular">Retangular</SelectItem>
                <SelectItem value="aviador">Aviador</SelectItem>
                <SelectItem value="cat-eye">Cat Eye</SelectItem>
                <SelectItem value="wayfarer">Wayfarer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Referência */}
          <div className="space-y-2">
            <Label htmlFor="reference" className="text-xs">Referência</Label>
            <Input
              id="reference"
              placeholder="Digite a referência"
              value={localFilters.reference}
              onChange={(e) => handleFilterChange("reference", e.target.value)}
              className="h-9 pl-7 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleApplyFilters} size="sm">
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
} 