import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

interface BackButtonProps {
  onClick: () => void;
  label: string;
}

export function BackButton({
  onClick,
  label,
}: BackButtonProps) {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      variant="outline"
      size="sm"
    >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
    </Button>
  );
}