"use client";

import { useLaboratories } from "@/hooks/useLaboratories";
import { LaboratoryTable } from "@/components/Laboratories/LaboratoryTable";
import { PageTitle } from "@/components/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Beaker } from "lucide-react";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function LaboratoriesPage() {
  const {
    laboratories,
    isLoading,
    error,
    search,
    showEmptyState,
    setSearch,
    handleSearch,
    navigateToLaboratoryDetails,
    navigateToCreateLaboratory,
  } = useLaboratories().useLaboratoriesList();

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Laboratórios"
        description="Lista de laboratórios parceiros da loja"
      />
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar laboratório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={handleSearch}>
            Buscar
          </Button>
        </div>

        <Button onClick={navigateToCreateLaboratory}>Novo Laboratório</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <Beaker className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            Não há laboratórios cadastrados
          </h3>
          <p className="text-muted-foreground mt-2">
            Clique em "Novo Laboratório" para adicionar um laboratório ao
            sistema.
          </p>
        </div>
      )}

      {!isLoading && !error && laboratories.length > 0 && (
        <LaboratoryTable
          laboratories={laboratories}
          isLoading={isLoading}
          error={error}
          onViewDetails={navigateToLaboratoryDetails}
        />
      )}
    </div>
  );
}