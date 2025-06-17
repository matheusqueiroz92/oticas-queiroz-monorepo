"use client";

import { useProfile } from "@/hooks/useProfile";
import { ChangePasswordForm } from "@/components/change-password/ChangePasswordForm";
import { ChangePasswordHeader } from "@/components/change-password/ChangePasswordHeader";
import type { ChangePasswordFormValues } from "@/schemas/change-password-schema";

export default function ChangePasswordPage() {
  const {
    handleChangePassword,
    handleBack,
    isChangingPassword
  } = useProfile();

  const handleSubmit = async (data: ChangePasswordFormValues) => {
    await handleChangePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="space-y-6 max-w-auto mx-auto p-1 md:p-2">
      <div className="max-w-md mx-auto space-y-6">
        <ChangePasswordHeader onBack={handleBack} />
        
        <ChangePasswordForm
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isLoading={isChangingPassword}
        />
      </div>
    </div>
  );
}