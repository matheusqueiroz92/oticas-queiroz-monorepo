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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna da esquerda - Card do perfil */}
          <div className="lg:col-span-1">
            <ProfileCard
              user={user}
              getUserImageUrl={getUserImageUrl}
              onEditClick={handleEditClick}
            />
          </div>

          {/* Coluna da direita - Pedidos recentes */}
          <div className="lg:col-span-2">
            {(user.role === "employee" || user.role === "admin") && (
              <RecentOrdersCard
                orders={profileData.userOrders}
                onViewDetails={handleViewOrderDetails}
                isLoading={isLoadingOrders}
              />
            )}
            
            {user.role === "customer" && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Bem-vindo ao Sistema!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Acesse as funcionalidades do sistema através do menu lateral.
                  Você pode visualizar seus pedidos, débitos e muito mais.
                </p>
              </div>
            )}
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