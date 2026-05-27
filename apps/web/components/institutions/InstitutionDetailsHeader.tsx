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
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {!isLoading && (
          <Badge
            variant={institution.status === "active" ? "default" : "secondary"}
            className={`${
              institution.status === "active" ? "badge-success status-badge" : "badge-neutral status-badge"
            }`}
          >
            {institution.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onEditInstitution}
        disabled={!institution}
      >
        <Edit className="h-4 w-4 mr-2" />
        Editar
      </Button>
    </div>
  );
}