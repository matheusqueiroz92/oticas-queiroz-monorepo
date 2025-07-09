import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface ProductDetailsErrorProps {
  error?: any;
  onGoBack: () => void;
}

export function ProductDetailsError({ error, onGoBack }: ProductDetailsErrorProps) {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Produto não encontrado</AlertTitle>
        <AlertDescription>
          {error?.message || "O produto que você está procurando não existe ou foi removido."} 
        </AlertDescription>
        <Button className="mt-4" variant="outline" onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Produtos
        </Button>
      </Alert>
    </div>
  );
} 