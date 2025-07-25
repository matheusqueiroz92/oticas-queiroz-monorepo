import { CreateReportModal } from "./CreateReportModal";
import type { Report as IReport } from "@/app/_types/report";

interface ReportDialogsProps {
  newReportDialogOpen: boolean;
  reportToEdit: IReport | null;
  onNewReportDialogChange: (open: boolean) => void;
  onEditReportDialogChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReportDialogs({
  newReportDialogOpen,
  // reportToEdit,
  onNewReportDialogChange,
  // onEditReportDialogChange,
  onSuccess,
}: ReportDialogsProps) {
  return (
    <>
      <CreateReportModal
        isOpen={newReportDialogOpen}
        onClose={() => onNewReportDialogChange(false)}
        onSuccess={onSuccess}
      />
      
      {/* Futuro: Modal de edição de relatório */}
      {/* {reportToEdit && (
        <EditReportModal
          isOpen={!!reportToEdit}
          report={reportToEdit}
          onClose={() => onEditReportDialogChange(false)}
          onSuccess={onSuccess}
        />
      )} */}
    </>
  );
} 