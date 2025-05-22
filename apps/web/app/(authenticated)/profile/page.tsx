"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { PageTitle } from "@/components/PageTitle";
import { ProfileView } from "@/components/Profile/ProfileView";
import { ProfileEditForm } from "@/components/Profile/ProfileEditForm";
import { RecentOrdersTable } from "@/components/Orders/RecentOrdersTable";
import { useOrders } from "@/hooks/useOrders";
import Cookies from "js-cookie";

export default function ProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profile: user,
    isLoadingProfile: loading,
    isUpdatingProfile,
    handleUpdateProfile,
    refetchProfile,
    getUserImageUrl,
  } = useProfile();

  const { orders, isLoading: isLoadingOrders, getEmployeeName } = useOrders();

  const handleStartEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setPreviewImage(null);
  };

  const handleSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      for (const [key, value] of Object.entries(data)) {
        if (key !== "image" && value !== undefined) {
          formData.append(key, String(value));
        }
      }

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("userImage", file);
      }

      const updatedUser = await handleUpdateProfile(formData);

      if (updatedUser && updatedUser.name !== Cookies.get("name")) {
        Cookies.set("name", updatedUser.name, { expires: 1 });
      }

      setEditMode(false);
      refetchProfile();
      setPreviewImage(null);
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
    <div className="space-y-6 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e configurações de segurança"
      />

      {editMode ? (
        <div className="max-w-4xl mx-auto">
          <ProfileEditForm
            user={user}
            onCancel={handleCancelEdit}
            onSubmit={handleSubmit}
            isSubmitting={isUpdatingProfile}
            previewImage={previewImage}
            setPreviewImage={setPreviewImage}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna da esquerda - Informações do perfil */}
          <div className="">
            <ProfileView
              user={user}
              getUserImageUrl={getUserImageUrl}
              onStartEdit={handleStartEdit}
            />
          </div>

          {/* Coluna da direita - Pedidos recentes (apenas para funcionários e admin) */}
          {(user.role === "employee" || user.role === "admin") && (
            <div>
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-[var(--secondary-red)]">
                    Meus Pedidos Recentes
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Últimos pedidos realizados por você
                  </p>
                </div>
                
                <div className="p-6">
                  {isLoadingOrders ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : employeeOrders.length > 0 ? (
                    <RecentOrdersTable
                      getEmployeeName={getEmployeeName}
                      orders={employeeOrders}
                      onViewDetails={handleViewOrderDetails}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Você ainda não realizou nenhum pedido.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}