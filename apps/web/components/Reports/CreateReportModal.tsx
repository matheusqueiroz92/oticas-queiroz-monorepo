"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreateReportForm } from "./CreateReportForm";
import { useReports } from "@/hooks/useReports";
import type { CreateReportDTO } from "@/app/_types/report";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateReportModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateReportModalProps) {
  const { handleCreateReport, isCreating } = useReports();

  const handleSubmit = async (data: CreateReportDTO) => {
    try {
      await handleCreateReport(data);

      // Fechar o modal e executar o callback de sucesso
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
      // O feedback de erro é tratado pelo hook useReports
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Relatório</DialogTitle>
          <DialogDescription>
            Configure os parâmetros do seu relatório. O relatório será
            processado em segundo plano e estará disponível para download quando
            concluído.
          </DialogDescription>
        </DialogHeader>

        <CreateReportForm
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
