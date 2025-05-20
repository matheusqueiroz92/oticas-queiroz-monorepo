import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import { getProductTypeName } from "@/app/services/productService";

interface ProductFiltersProps {
  searchTerm: string;
  productType: string;
  stockFilter: "all" | "low" | "out";
  viewMode: "grid" | "table";
  setSearchTerm: (value: string) => void;
  setProductType: (value: string) => void;
  setStockFilter: (value: "all" | "low" | "out") => void;
  setViewMode: (value: "grid" | "table") => void;
  onSearch: (e: React.FormEvent) => void;
  onProductTypeChange: (value: string) => void;
  clearFilters: () => void;
}

export function ProductFilters({
  searchTerm,
  productType,
  stockFilter,
  viewMode,
  setSearchTerm,
  setProductType,
  setStockFilter,
  setViewMode,
  onSearch,
  onProductTypeChange,
  clearFilters,
}: ProductFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={onSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </form>
        <div className="flex gap-2">
          <Select value={productType} onValueChange={onProductTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="lenses">Lentes</SelectItem>
              <SelectItem value="clean_lenses">Limpa-lentes</SelectItem>
              <SelectItem value="prescription_frame">Armação de Grau</SelectItem>
              <SelectItem value="sunglasses_frame">Armação Solar</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtro de Estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Produtos</SelectItem>
              <SelectItem value="low">Estoque Baixo</SelectItem>
              <SelectItem value="out">Sem Estoque</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode("grid")}
            >
              <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </Button>
            <Button 
              variant={viewMode === "table" ? "default" : "ghost"} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode("table")}
            >
              <div className="flex flex-col justify-between h-4 w-4">
                <div className="h-0.5 w-full bg-current rounded-sm"></div>
                <div className="h-0.5 w-full bg-current rounded-sm"></div>
                <div className="h-0.5 w-full bg-current rounded-sm"></div>
              </div>
            </Button>
          </div>
        </div>
      </div>
      
      {(productType !== "all" || stockFilter !== "all" || searchTerm) && (
        <div className="flex gap-2 items-center flex-wrap">
          <Badge variant="outline" className="px-2 py-1 h-7">
            <Filter className="h-3 w-3 mr-1" />
            Filtros Ativos
          </Badge>
          {productType !== "all" && (
            <Badge className="bg-primary/10 text-primary border-primary/20 h-7">
              Tipo: {getProductTypeName(productType as any)}
              <button 
                className="ml-1 text-primary/70 hover:text-primary"
                onClick={() => onProductTypeChange("all")}
              >
                ×
              </button>
            </Badge>
          )}
          {stockFilter !== "all" && (
            <Badge className="bg-primary/10 text-primary border-primary/20 h-7">
              Estoque: {stockFilter === "low" ? "Baixo" : "Zerado"}
              <button 
                className="ml-1 text-primary/70 hover:text-primary"
                onClick={() => setStockFilter("all")}
              >
                ×
              </button>
            </Badge>
          )}
          {searchTerm && (
            <Badge className="bg-primary/10 text-primary border-primary/20 h-7">
              Busca: {searchTerm}
              <button 
                className="ml-1 text-primary/70 hover:text-primary"
                onClick={() => {
                  setSearchTerm("");
                  onSearch(new Event('submit') as unknown as React.FormEvent);
                }}
              >
                ×
              </button>
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 px-2"
            onClick={clearFilters}
          >
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}