"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { RecentOrdersCard } from "@/components/profile/RecentOrdersCard";
import { useOrders } from "@/hooks/useOrders";
import Cookies from "js-cookie";
import { PageContainer } from "@/components/ui/page-container";
import type { User } from "@/app/_types/user";
import type { Order } from "@/app/_types/order";

export default function ProfilePage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  const {
    profile: user,
    isLoadingProfile: loading,
    isUpdatingProfile,
    handleUpdateProfile,
    refetchProfile,
    getUserImageUrl,
  } = useProfile();

  const { orders, isLoading: isLoadingOrders, getClientName } = useOrders();

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      // Adicionar dados do formulário
      Object.entries(data).forEach(([key, value]) => {
        if (key === "address" && typeof value === "object" && value !== null) {
          // Serializar endereço como JSON
          formData.append(key, JSON.stringify(value));
        } else if (key !== "image" && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Adicionar imagem se fornecida
      if (data.image) {
        formData.append("userImage", data.image);
      }

      const updatedUser = await handleUpdateProfile(formData);

      if (updatedUser && updatedUser.name !== Cookies.get("name")) {
        Cookies.set("name", updatedUser.name, { expires: 1 });
      }

      refetchProfile();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  const handleViewOrderDetails = (id: string) => {
    router.push(`/orders/${id}`);
  };

  // Filtrar pedidos do funcionário logado
  const employeeOrders = orders.filter(order => {
    const userId = Cookies.get("userId");
    return userId && (order.employeeId === userId || order.employeeId.toString() === userId);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 max-w-auto mx-auto p-1 md:p-2">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seu perfil. Por favor, tente novamente mais tarde.
          </AlertDescription>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            Voltar para o Dashboard
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header da página
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {user.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {user.role === "admin" ? "Administrador" : 
             user.role === "employee" ? "Funcionário" : "Cliente"}
          </p>
        </div> */}

        {/* Estatísticas do usuário */}
        <ProfileStats userRole={user.role} />

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
                orders={employeeOrders}
                getClientName={getClientName}
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
          onOpenChange={setEditDialogOpen}
          user={user}
          onSubmit={handleSubmit}
          isSubmitting={isUpdatingProfile}
          getUserImageUrl={getUserImageUrl}
        />
      </div>
    </PageContainer>
  );
}