import { InstitutionDialog } from "./InstitutionDialog";
import { Institution } from "@/app/_types/institution";

interface InstitutionDialogsProps {
  newInstitutionDialogOpen: boolean;
  institutionToEdit: Institution | null;
  onNewInstitutionDialogChange: (open: boolean) => void;
  onEditInstitutionDialogChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InstitutionDialogs({
  newInstitutionDialogOpen,
  institutionToEdit,
  onNewInstitutionDialogChange,
  onEditInstitutionDialogChange,
  onSuccess,
}: InstitutionDialogsProps) {
  return (
    <>
      {/* Dialog para Nova Instituição */}
      {newInstitutionDialogOpen && (
        <InstitutionDialog
          open={newInstitutionDialogOpen}
          onOpenChange={onNewInstitutionDialogChange}
          mode="create"
          onSuccess={onSuccess}
        />
      )}

      {/* Dialog para Editar Instituição */}
      {institutionToEdit && (
        <InstitutionDialog
          open={!!institutionToEdit}
          onOpenChange={onEditInstitutionDialogChange}
          institution={institutionToEdit}
          mode="edit"
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}