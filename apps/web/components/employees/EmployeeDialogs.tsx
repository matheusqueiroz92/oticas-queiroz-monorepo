import { EmployeeDialog } from "@/components/employees/EmployeeDialog";
import type { User } from "@/app/_types/user";

interface EmployeeDialogsProps {
  newEmployeeDialogOpen: boolean;
  editEmployeeDialogOpen: boolean;
  employeeToEdit?: User;
  onNewEmployeeDialogChange: (open: boolean) => void;
  onEditEmployeeDialogChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployeeDialogs({
  newEmployeeDialogOpen,
  editEmployeeDialogOpen,
  employeeToEdit,
  onNewEmployeeDialogChange,
  onEditEmployeeDialogChange,
  onSuccess,
}: EmployeeDialogsProps) {
  return (
    <>
      {/* Dialog de Novo Funcionário */}
      <EmployeeDialog
        open={newEmployeeDialogOpen}
        onOpenChange={onNewEmployeeDialogChange}
        onSuccess={onSuccess}
      />

      {/* Dialog de Edição de Funcionário */}
      <EmployeeDialog
        open={editEmployeeDialogOpen}
        onOpenChange={onEditEmployeeDialogChange}
        onSuccess={onSuccess}
        employee={employeeToEdit}
        mode="edit"
      />
    </>
  );
} 