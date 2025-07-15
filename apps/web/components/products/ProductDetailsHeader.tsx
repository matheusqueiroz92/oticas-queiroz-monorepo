import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

interface ProductDetailsHeaderProps {
  onGoBack: () => void;
  onEditClick: () => void;
}

export function ProductDetailsHeader({ onGoBack, onEditClick }: ProductDetailsHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onGoBack} className="hover:bg-muted">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
      
      <Button onClick={onEditClick} className="gap-2 text-white bg-[var(--primary-blue)]">
        <Edit className="h-4 w-4" />
        Editar Produto
      </Button>
    </div>
  );
} 