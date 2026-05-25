import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <SettingsIcon className="h-5 w-5" />
            Configurações
          </CardTitle>
          <CardDescription>
            Em breve você poderá personalizar preferências do sistema por aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma configuração disponível no momento.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}