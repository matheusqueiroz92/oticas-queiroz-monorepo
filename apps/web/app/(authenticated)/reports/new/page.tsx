"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateReportForm } from "@/components/Reports/CreateReportForm";
import { PageTitle } from "@/components/PageTitle";
import { useReports } from "@/hooks/useReports";
import { useToast } from "@/hooks/useToast";
import type { CreateReportDTO } from "@/app/_types/report";

export default function NewReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { handleCreateReport, isCreating } = useReports();

  const handleSubmit = async (data: CreateReportDTO) => {
    try {
      const createdReport = await handleCreateReport(data);

      toast({
        title: "Relatório solicitado com sucesso",
        description:
          "O relatório está sendo gerado e ficará disponível em breve.",
      });

      if (createdReport && createdReport._id) {
        router.push(`/reports/${createdReport._id}`);
      } else {
        router.push("/reports");
      }
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar relatório",
        description:
          "Ocorreu um erro ao solicitar o relatório. Tente novamente.",
      });
    }
  };

  const handleCancel = () => {
    router.push("/reports");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageTitle
          title="Novo Relatório"
          description="Crie e personalize um novo relatório"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Relatório</CardTitle>
          <CardDescription>
            Defina o tipo, formato e filtros para o seu relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateReportForm
            onSubmit={handleSubmit}
            isSubmitting={isCreating}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
