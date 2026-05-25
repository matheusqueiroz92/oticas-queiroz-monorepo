"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { RecentOrdersCard } from "@/components/profile/RecentOrdersCard";
import { PageContainer } from "@/components/ui/page-container";
import { useProfileData } from "@/hooks/profile/useProfileData";
import { ProfileErrorAlert } from "@/components/profile/ProfileErrorAlert";

export default function ProfilePage() {
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);

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
        <ProfileErrorAlert handleBackToDashboard={handleBackToDashboard} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Coluna da esquerda - Card do perfil alinhado com as estatísticas */}
        <div className="lg:col-span-1 lg:row-span-2">
          <ProfileCard
            user={user}
            getUserImageUrl={getUserImageUrl}
            onEditClick={handleEditClick}
            onChangePasswordClick={() => setChangePasswordDialogOpen(true)}
          />
        </div>

        {/* Estatísticas do usuário (3 colunas à direita do perfil) */}
        <div className="lg:col-span-3">
          <ProfileStats
            userRole={user.role}
            profileData={profileData}
            isLoading={loading}
          />
        </div>

        {/* Pedidos recentes — mantido abaixo das estatísticas */}
        <div className="lg:col-span-3">
          <RecentOrdersCard
            orders={profileData.userOrdersForDisplay}
            onViewDetails={handleViewOrderDetails}
            isLoading={isLoadingOrders}
            getClientName={getClientName}
            userRole={user.role}
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

      {/* Dialog de alteração de senha */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onOpenChange={setChangePasswordDialogOpen}
      />
    </PageContainer>
  );
}