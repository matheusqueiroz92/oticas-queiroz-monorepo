import { LegacyClientForm } from "./LegacyClientForm";
import type { LegacyClient } from "@/app/_types/legacy-client";

interface LegacyClientDialogsProps {
  newClientDialogOpen: boolean;
  clientToEdit: LegacyClient | null;
  onNewClientDialogChange: (open: boolean) => void;
  onEditClientDialogChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LegacyClientDialogs({
  newClientDialogOpen,
  clientToEdit,
  onNewClientDialogChange,
  onEditClientDialogChange,
  onSuccess,
}: LegacyClientDialogsProps) {
  return (
    <>
      <LegacyClientForm
        isOpen={newClientDialogOpen}
        onClose={() => onNewClientDialogChange(false)}
        onSuccess={onSuccess}
      />
      
      {/* Futuro: Modal de edição de cliente */}
      {/* {clientToEdit && (
        <EditLegacyClientModal
          isOpen={!!clientToEdit}
          client={clientToEdit}
          onClose={() => onEditClientDialogChange(false)}
          onSuccess={onSuccess}
        />
      )} */}
    </>
  );
} 