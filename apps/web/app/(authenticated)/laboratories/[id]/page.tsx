"use client";

import { useParams, useRouter } from "next/navigation";
import { LaboratoryDetailsCard } from "@/components/laboratories/LaboratoryDetailsCard";
import { LaboratoryDialog } from "@/components/laboratories/LaboratoryDialog";
import { useLaboratories } from "@/hooks/laboratories/useLaboratories";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";

export default function LaboratoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const {
    fetchLaboratoryById,
    handleToggleLaboratoryStatus,
  } = useLaboratories();

  const { data: laboratory, isLoading, error, refetch } = fetchLaboratoryById(id as string);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleGoBack = () => {
    router.push("/laboratories");
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    setIsTogglingStatus(true);
    try {
      await handleToggleLaboratoryStatus(id);
      await refetch();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (error || !laboratory) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Laboratório não encontrado."}
          </AlertDescription>
          <Button className="mt-4" onClick={handleGoBack}>
            Voltar para Laboratórios
          </Button>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LaboratoryDetailsCard
        laboratory={laboratory}
        isTogglingStatus={isTogglingStatus}
        onToggleStatus={handleToggleStatus}
        onGoBack={handleGoBack}
        onEdit={handleEdit}
      />

      {/* Dialog de Edição do Laboratório */}
      {editDialogOpen && (
        <LaboratoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          laboratory={laboratory}
          mode="edit"
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </PageContainer>
  );
}