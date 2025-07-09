import { CustomerDialog } from "@/components/customers/CustomerDialog";
import type { User } from "@/app/_types/user";

interface CustomerDialogsProps {
  newCustomerDialogOpen: boolean;
  editCustomerDialogOpen: boolean;
  customerToEdit?: User;
  onNewCustomerDialogChange: (open: boolean) => void;
  onEditCustomerDialogChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CustomerDialogs({
  newCustomerDialogOpen,
  editCustomerDialogOpen,
  customerToEdit,
  onNewCustomerDialogChange,
  onEditCustomerDialogChange,
  onSuccess,
}: CustomerDialogsProps) {
  return (
    <>
      {/* Dialog de Novo Cliente */}
      <CustomerDialog
        open={newCustomerDialogOpen}
        onOpenChange={onNewCustomerDialogChange}
        onSuccess={onSuccess}
      />

      {/* Dialog de Edição de Cliente */}
      <CustomerDialog
        open={editCustomerDialogOpen}
        onOpenChange={onEditCustomerDialogChange}
        onSuccess={onSuccess}
        customer={customerToEdit}
      />
    </>
  );
} 