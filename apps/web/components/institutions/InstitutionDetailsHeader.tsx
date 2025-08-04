import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Building } from "lucide-react";
import { Institution } from "@/app/_types/institution";

interface InstitutionDetailsHeaderProps {
  institution: Institution;
  isLoading: boolean;
  onGoBack: () => void;
  onEditInstitution: () => void;
}

export function InstitutionDetailsHeader({
  institution,
  isLoading,
  onGoBack,
  onEditInstitution,
}: InstitutionDetailsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {!isLoading && (
          <Badge
            variant={institution.status === "active" ? "default" : "secondary"}
            className={`ml-2 ${
              institution.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {institution.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={onEditInstitution}
          disabled={!institution}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>
    </div>
  );
}