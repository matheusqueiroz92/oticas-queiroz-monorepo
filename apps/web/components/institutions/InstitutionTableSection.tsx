import { InstitutionTable } from "./InstitutionTable";
import { PaginationItems } from "@/components/PaginationItems";
import { Institution } from "@/app/_types/institution";

interface InstitutionTableSectionProps {
  institutions: Institution[];
  onDetailsClick: (id: string) => void;
  onEditClick: (institution: Institution) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  pageSize: number;
  isLoading: boolean;
}

export function InstitutionTableSection({
  institutions,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  pageSize,
  isLoading,
}: InstitutionTableSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!institutions || institutions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          Nenhuma instituição encontrada.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InstitutionTable
        data={institutions}
        onDetailsClick={onDetailsClick}
        onEditClick={onEditClick}
      />
      
      {totalPages > 1 && (
        <PaginationItems
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}