"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Building, Plus } from "lucide-react";
import { useInstitutions } from "@/hooks/useInstitutions";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageTitle } from "@/components/ui/page-title";
import { InstitutionTable } from "@/components/institutions/InstitutionTable";

export default function InstitutionsPage() {
  const {
    institutions,
    isLoading,
    error,
    search,
    setSearch,
    navigateToInstitutionDetails,
    navigateToNewInstitution,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    limit
  } = useInstitutions();

  const showEmptyState = !isLoading && !error && institutions.length === 0;

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Instituições"
        description="Lista de instituições parceiras"
      />
      <div className="flex justify-between">
        <div className="relative w-full max-w-md">
          <Input
            placeholder="Buscar instituição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button onClick={navigateToNewInstitution} className="ml-4">
          <Plus className="mr-2 h-4 w-4" />
          Nova Instituição
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <Building className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            Não há instituições cadastradas
          </h3>
          <p className="text-muted-foreground mt-2">
            Clique em "Nova Instituição" para adicionar uma instituição ao
            sistema.
          </p>
        </div>
      )}

      {!isLoading && !error && institutions.length > 0 && (
        <InstitutionTable
          data={institutions}
          onDetailsClick={navigateToInstitutionDetails}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          pageSize={limit}
        />
      )}
    </div>
  );
}