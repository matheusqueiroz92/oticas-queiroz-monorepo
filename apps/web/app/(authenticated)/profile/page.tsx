"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { PageTitle } from "@/components/PageTitle";
import { ProfileView } from "@/components/Users/ProfileView";
import { ProfileEditForm } from "@/components/Users/ProfileEditForm";
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
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
    <div className="max-w-4xl mx-auto p-4">
      <PageTitle
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e configurações de segurança"
      />

      {editMode ? (
        <ProfileEditForm
          user={user}
          onCancel={handleCancelEdit}
          onSubmit={handleSubmit}
          isSubmitting={isUpdatingProfile}
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
        />
      ) : (
        <ProfileView
          user={user}
          getUserImageUrl={getUserImageUrl}
          onStartEdit={handleStartEdit}
        />
      )}
    </div>
  );
}