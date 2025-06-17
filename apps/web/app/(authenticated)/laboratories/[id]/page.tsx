"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useLaboratories } from "@/hooks/useLaboratories";
import { LaboratoryDetailsCard } from "@/components/laboratories/LaboratoryDetailsCard";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function LaboratoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
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
    router.push(`/laboratories/${id}/edit`);
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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !laboratory) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Laboratório não encontrado."}
          </AlertDescription>
          <Button className="mt-4" onClick={handleGoBack}>
            Voltar para Laboratórios
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <LaboratoryDetailsCard
        laboratory={laboratory}
        isTogglingStatus={isTogglingStatus}
        onToggleStatus={handleToggleStatus}
        onGoBack={handleGoBack}
        onEdit={handleEdit}
      />
    </div>
  );
}