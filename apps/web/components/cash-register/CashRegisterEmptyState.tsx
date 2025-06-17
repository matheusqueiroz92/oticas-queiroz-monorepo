import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";

interface CashRegisterEmptyStateProps {
  activeRegister: boolean;
  onOpenRegister: () => void;
}

export function CashRegisterEmptyState({
  activeRegister,
  onOpenRegister,
}: CashRegisterEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Não há registros de caixa</h3>
      <p className="text-muted-foreground mt-2">
        Nenhum registro de caixa foi encontrado.
      </p>
      {!activeRegister && (
        <Button className="mt-4" onClick={onOpenRegister}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Abrir Caixa
        </Button>
      )}
    </div>
  );
}