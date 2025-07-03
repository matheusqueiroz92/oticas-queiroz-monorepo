"use client";

import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { RecentOrdersCard } from "@/components/profile/RecentOrdersCard";
import { PageContainer } from "@/components/ui/page-container";
import { useProfileData } from "@/hooks/useProfileData";

export default function ProfilePage() {
  const {
    user,
    loading,
    isUpdatingProfile,
    isLoadingOrders,
    getUserImageUrl,
    profileData,
    editDialogOpen,
    handleEditClick,
    handleCloseEdit,
    handleSubmit,
    handleViewOrderDetails,
    handleBackToDashboard,
    getClientName,
  } = useProfileData();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seu perfil. Por favor, tente novamente mais tarde.
          </AlertDescription>
          <Button className="mt-4" onClick={handleBackToDashboard}>
            Voltar para o Dashboard
          </Button>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Estatísticas do usuário */}
        <ProfileStats 
          userRole={user.role} 
          profileData={profileData}
          isLoading={loading}
        />

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Coluna da esquerda - Card do perfil (equivalente a 1 StatCard) */}
          <div className="lg:col-span-1">
            <ProfileCard
              user={user}
              getUserImageUrl={getUserImageUrl}
              onEditClick={handleEditClick}
            />
          </div>

          {/* Coluna da direita - Pedidos recentes (equivalente a 3 StatCards) */}
          <div className="lg:col-span-3">
            <RecentOrdersCard
              orders={profileData.userOrdersForDisplay}
              onViewDetails={handleViewOrderDetails}
              isLoading={isLoadingOrders}
              getClientName={getClientName}
            />
          </div>
        </div>

        {/* Dialog de edição */}
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={handleCloseEdit}
          user={user}
          onSubmit={handleSubmit}
          isSubmitting={isUpdatingProfile}
          getUserImageUrl={getUserImageUrl}
        />
      </div>
    </PageContainer>
  );
}