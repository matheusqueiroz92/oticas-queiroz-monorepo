import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

interface CustomerDetailsHeaderProps {
  onGoBack: () => void;
  onEditCustomer: () => void;
}

export function CustomerDetailsHeader({ onGoBack, onEditCustomer }: CustomerDetailsHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2">
      <Button variant="ghost" size="sm" onClick={onGoBack} className="hover:bg-muted">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Button onClick={onEditCustomer} size="sm" className="gap-2" variant="outline">
        <Edit className="h-4 w-4" />
        Editar Cliente
      </Button>
    </div>
  );
} 