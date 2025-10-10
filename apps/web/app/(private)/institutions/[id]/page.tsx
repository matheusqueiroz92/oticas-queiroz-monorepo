"use client";

import { useParams, useRouter } from "next/navigation";
import { useUsers } from "@/hooks/useUsers";
import { useInstitutionDetailsState } from "@/hooks/institutions/useInstitutionDetailsState";
import { InstitutionDetailsHeader } from "@/components/institutions/InstitutionDetailsHeader";
import { InstitutionDetailsInfo } from "@/components/institutions/InstitutionDetailsInfo";
import { InstitutionDetailsLoading } from "@/components/institutions/InstitutionDetailsLoading";
import { InstitutionDetailsError } from "@/components/institutions/InstitutionDetailsError";
import { InstitutionDialogs } from "@/components/institutions/InstitutionDialogs";
import { Institution } from "@/app/_types/institution";

export default function InstitutionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { useUserQuery, getUserImageUrl } = useUsers();
  
  const { state, actions } = useInstitutionDetailsState();
  
  const { 
    data: institution, 
    isLoading, 
    error,
    refetch
  } = useUserQuery(id as string);

  const handleGoBack = () => {
    router.push("/institutions");
  };

  const handleEditInstitution = () => {
    if (institution) {
      actions.handleOpenEditDialog();
    }
  };

  const handleSuccess = () => {
    refetch();
    actions.handleCloseEditDialog();
  };

  // Loading state
  if (isLoading) {
    return <InstitutionDetailsLoading />;
  }

  // Error state
  if (error || !institution) {
    return <InstitutionDetailsError error={error} onGoBack={handleGoBack} />;
  }

  // Verificar se é uma instituição
  if (institution.role !== "institution") {
    return (
      <InstitutionDetailsError 
        error={{ message: "O usuário carregado não é uma instituição." }} 
        onGoBack={handleGoBack} 
      />
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <InstitutionDetailsHeader
        institution={institution as Institution}
        isLoading={isLoading}
        onGoBack={handleGoBack}
        onEditInstitution={handleEditInstitution}
      />

      {/* Informações da Instituição */}
      <div className="mt-6">
        <InstitutionDetailsInfo 
          institution={institution as Institution}
          getUserImageUrl={getUserImageUrl}
        />
      </div>

      {/* Dialog de Edição */}
      {state.editDialogOpen && (
        <InstitutionDialogs
          newInstitutionDialogOpen={false}
          institutionToEdit={institution as Institution}
          onNewInstitutionDialogChange={() => {}}
          onEditInstitutionDialogChange={actions.handleCloseEditDialog}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}