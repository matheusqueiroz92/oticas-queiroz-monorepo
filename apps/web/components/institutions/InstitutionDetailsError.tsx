import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ErrorAlert } from "@/components/ErrorAlert";

interface InstitutionDetailsErrorProps {
  error?: any;
  onGoBack: () => void;
}

export function InstitutionDetailsError({ error, onGoBack }: InstitutionDetailsErrorProps) {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <ErrorAlert 
          message={error?.message || "Erro ao carregar os dados da instituição"} 
        />
      </div>
    </div>
  );
}