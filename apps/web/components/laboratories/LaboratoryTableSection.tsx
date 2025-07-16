import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationItems } from "@/components/PaginationItems";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Loader2, Beaker, Eye, Edit, Plus } from "lucide-react";
import type { Laboratory } from "@/app/_types/laboratory";

interface LaboratoryColumn {
  key: string;
  header: string;
  render?: (laboratory: Laboratory) => React.ReactNode;
}

interface LaboratoryTableSectionProps {
  laboratories: Laboratory[];
  isLoading: boolean;
  error: string | null;
  search: string;
  activeFiltersCount: number;
  onDetailsClick: (laboratoryId: string) => void;
  onEditClick: (laboratory: Laboratory) => void;
  onNewLaboratory: () => void;
  onClearFilters: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function LaboratoryTableSection({
  laboratories,
  isLoading,
  error,
  search,
  activeFiltersCount,
  onDetailsClick,
  onEditClick,
  onNewLaboratory,
  onClearFilters,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: LaboratoryTableSectionProps) {
  const laboratoryColumns: LaboratoryColumn[] = [
    { key: "name", header: "Nome" },
    { key: "contactName", header: "Responsável" },
    { key: "email", header: "E-mail" },
    { key: "phone", header: "Telefone" },
    {
      key: "address",
      header: "Endereço",
      render: (laboratory: Laboratory) => (
        <div className="flex items-center gap-1">
          <span className="text-sm">
            {laboratory.address.street}, nº {laboratory.address.number}, {laboratory.address.neighborhood}, {" "} 
            {laboratory.address.city}-{laboratory.address.state} - {laboratory.address.zipCode}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (laboratory: Laboratory) => (
        <Badge variant={laboratory.isActive ? "default" : "secondary"}>
          {laboratory.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (laboratory: Laboratory) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetailsClick(laboratory._id)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditClick(laboratory)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const showEmptyState = !isLoading && !error && laboratories.length === 0;

  return (
    <CardContent className="p-0">
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Beaker className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum laboratório encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {search || activeFiltersCount > 0 
              ? "Tente ajustar os filtros de busca." 
              : "Clique em 'Novo Laboratório' para adicionar um laboratório ao sistema."
            }
          </p>
          {!search && activeFiltersCount === 0 && (
            <Button onClick={onNewLaboratory}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Laboratório
            </Button>
          )}
          {(search || activeFiltersCount > 0) && (
            <Button variant="outline" onClick={onClearFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && laboratories.length > 0 && (
        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-slate-800/50">
              <TableRow>
                {laboratoryColumns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {laboratories.map((laboratory) => (
                <TableRow key={laboratory._id}>
                  {laboratoryColumns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(laboratory)
                        : String(laboratory[column.key as keyof typeof laboratory] || "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="bg-gray-100 dark:bg-slate-800/50 w-full p-1">
            {(totalItems ?? 0) > 10 && (
              <PaginationItems
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                totalItems={totalItems}
                pageSize={limit}
              />
            )}
          </div>
        </div>
      )}
    </CardContent>
  );
} 