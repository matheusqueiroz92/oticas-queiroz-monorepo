import { LaboratoryDialog } from "@/components/laboratories/LaboratoryDialog";
import type { Laboratory } from "@/app/_types/laboratory";

interface LaboratoryDialogsProps {
  newLaboratoryDialogOpen: boolean;
  editLaboratoryDialogOpen: boolean;
  laboratoryToEdit?: Laboratory;
  onNewLaboratoryDialogChange: (open: boolean) => void;
  onEditLaboratoryDialogChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LaboratoryDialogs({
  newLaboratoryDialogOpen,
  editLaboratoryDialogOpen,
  laboratoryToEdit,
  onNewLaboratoryDialogChange,
  onEditLaboratoryDialogChange,
  onSuccess,
}: LaboratoryDialogsProps) {
  return (
    <>
      {/* Dialog de Novo Laboratório */}
      <LaboratoryDialog
        open={newLaboratoryDialogOpen}
        onOpenChange={onNewLaboratoryDialogChange}
        onSuccess={onSuccess}
      />

      {/* Dialog de Edição de Laboratório */}
      <LaboratoryDialog
        open={editLaboratoryDialogOpen}
        onOpenChange={onEditLaboratoryDialogChange}
        onSuccess={onSuccess}
        laboratory={laboratoryToEdit}
        mode="edit"
      />
    </>
  );
} 