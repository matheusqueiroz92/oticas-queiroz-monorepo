import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

interface CustomerDetailsHeaderProps {
  onGoBack: () => void;
  onEditCustomer: () => void;
}

export function CustomerDetailsHeader({ onGoBack, onEditCustomer }: CustomerDetailsHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onGoBack} className="hover:bg-muted">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
      
      <Button onClick={onEditCustomer} className="gap-2" variant="outline">
        <Edit className="h-4 w-4" />
        Editar Cliente
      </Button>
    </div>
  );
} 