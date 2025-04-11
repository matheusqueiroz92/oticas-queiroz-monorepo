"use client";

import { useParams } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useLaboratories } from "@/hooks/useLaboratories";
import { LaboratoryDetails } from "@/components/Laboratories/LaboratoryDetails";

export default function LaboratoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { canManageLaboratories } = usePermissions();
  
  const {
    laboratory,
    isLoading,
    error,
    isTogglingStatus,
    toggleStatus,
    navigateBack,
    navigateToEdit
  } = useLaboratories().useLaboratoryDetails(id as string);

  return (
    <LaboratoryDetails
      laboratory={laboratory!}
      isLoading={isLoading}
      error={error}
      isTogglingStatus={isTogglingStatus}
      canManageLaboratories={canManageLaboratories}
      onToggleStatus={toggleStatus}
      onGoBack={navigateBack}
      onEdit={navigateToEdit}
    />
  );
}