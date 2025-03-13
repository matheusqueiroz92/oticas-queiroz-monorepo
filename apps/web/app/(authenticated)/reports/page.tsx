"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useReports } from "../../../hooks/useReports";
import { ReportList } from "../../../components/Reports/ReportList";
import { CreateReportModal } from "../../../components/Reports/CreateReportModal";
import { ReportFilters } from "@/components/Reports/ReportFilters";
import { PageTitle } from "@/components/PageTitle";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTableSkeleton } from "../../../components/ui/data-table-skeleton";

export default function ReportsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  // Usar o hook de relatórios
  const {
    reports,
    loading,
    error,
    currentPage,
    pageSize,
    totalPages,
    totalReports,
    setCurrentPage,
    setPageSize,
    fetchReports,
    handleCreateReport,
  } = useReports();

  // Função para atualizar após a criação de relatório
  const handleCreateSuccess = async () => {
    setIsCreateModalOpen(false);
    toast({
      title: "Relatório solicitado com sucesso",
      description:
        "O relatório está sendo gerado e ficará disponível em breve.",
    });
    fetchReports();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle
          title="Relatórios"
          description="Gerencie e visualize relatórios da sua ótica"
        />
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Relatórios</CardTitle>
          <CardDescription>
            Gerencie e faça download dos seus relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters />

          {loading ? (
            <DataTableSkeleton columns={5} rows={5} />
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-destructive">
                Erro ao carregar relatórios. Tente novamente.
              </p>
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-10 w-10 text-muted-foreground" />}
              title="Nenhum relatório encontrado"
              description="Você ainda não criou nenhum relatório. Crie um relatório para começar."
              action={
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Relatório
                </Button>
              }
            />
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
              onRefresh={fetchReports}
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
