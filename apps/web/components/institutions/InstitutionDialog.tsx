import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InstitutionForm } from "./InstitutionForm";
import { Institution } from "@/app/_types/institution";

interface InstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  institution?: Institution;
  onSuccess: () => void;
}

export function InstitutionDialog({
  open,
  onOpenChange,
  mode,
  institution,
  onSuccess,
}: InstitutionDialogProps) {
  const title = mode === "create" ? "Nova Instituição" : "Editar Instituição";
  const description = mode === "create" 
    ? "Cadastre uma nova instituição no sistema" 
    : "Atualize os dados da instituição";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <InstitutionForm
          mode={mode}
          institution={institution}
          onSuccess={onSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}