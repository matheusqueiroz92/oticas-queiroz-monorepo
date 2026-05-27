import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageContainer>
      <EmptyState
        icon={<SettingsIcon className="h-8 w-8" />}
        title="Configurações em breve"
        description="Em breve você poderá personalizar preferências do sistema por aqui."
      />
    </PageContainer>
  );
}