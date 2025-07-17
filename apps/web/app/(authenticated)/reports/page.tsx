"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useReports } from "@/hooks/reports/useReports";
import { ReportList } from "@/components/reports/ReportList";
import { CreateReportModal } from "@/components/reports/CreateReportModal";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReportsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const {
    reports,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalPages,
    totalReports,
    setCurrentPage,
    setPageSize,
    refetch,
  } = useReports();

  const handleCreateSuccess = async () => {
    setIsCreateModalOpen(false);
    toast({
      title: "Relatório solicitado com sucesso",
      description:
        "O relatório está sendo gerado e ficará disponível em breve.",
    });
    refetch();
  };
  
  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <Card>
        <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Meus Relatórios</CardTitle>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Relatório
          </Button>
        </CardHeader>
        <CardContent>
          <ReportFilters />

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando relatórios...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : reports.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                Nenhum relatório encontrado
              </h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Você ainda não criou nenhum relatório. Crie um relatório para
                começar.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Relatório
              </Button>
            </div>
          ) : (
            <ReportList
              reports={reports}
              pagination={{
                page: currentPage,
                pageSize,
                totalPages,
                total: totalReports,
                onPageChange: setCurrentPage,
                onPageSizeChange: setPageSize,
              }}
              onRefresh={refetch}
            />
          )}
        </CardContent>
      </Card>

      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
