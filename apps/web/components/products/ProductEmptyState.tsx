import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ProductEmptyStateProps {
  clearFilters: () => void;
}

export function ProductEmptyState({ clearFilters }: ProductEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-red-100 p-3 rounded-full mb-3">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg text-red-600 font-semibold">Nenhum produto encontrado</h3>
      <p className="text-muted-foreground mt-1 max-w-md">
        Não foi possível encontrar produtos que correspondam aos filtros aplicados. Tente ajustar seus critérios de busca.
      </p>
      <Button 
        variant="outline" 
        onClick={clearFilters}
        className="mt-4"
      >
        Limpar Filtros
      </Button>
    </div>
  );
}