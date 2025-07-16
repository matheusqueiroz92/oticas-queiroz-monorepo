import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
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
import { Loader2, UserX, Eye, Edit, Plus } from "lucide-react";
import type { User } from "@/app/_types/user";
import type { Column } from "@/app/_types/user";

interface EmployeeTableSectionProps {
  employees: User[];
  isLoading: boolean;
  error: string | null;
  search: string;
  activeFiltersCount: number;
  onDetailsClick: (employeeId: string) => void;
  onEditClick: (employee: User) => void;
  onNewEmployee: () => void;
  onClearFilters: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function EmployeeTableSection({
  employees,
  isLoading,
  error,
  search,
  activeFiltersCount,
  onDetailsClick,
  onEditClick,
  onNewEmployee,
  onClearFilters,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: EmployeeTableSectionProps) {
  const employeeColumns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Função",
      render: (employee) => employee.role === "admin" ? "Administrador" : "Funcionário",
    },
    {
      key: "sales",
      header: "Total de Vendas",
      render: (employee) => employee.sales?.length || 0,
    },
    {
      key: "totalSales",
      header: "Valor Total",
      render: (employee) => {
        const salesCount = employee.sales?.length || 0;
        const totalValue = salesCount * 450; // Valor médio simulado
        return `R$ ${totalValue.toFixed(2)}`;
      },
    },
    {
      key: "actions",
      header: "Ações",
      render: (employee) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetailsClick(employee._id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditClick(employee)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

  const showEmptyState = !isLoading && !error && employees.length === 0;

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
          <UserX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum funcionário encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {search || activeFiltersCount > 0 
              ? "Tente ajustar os filtros de busca." 
              : "Clique em 'Novo Funcionário' para adicionar um funcionário ao sistema."
            }
          </p>
          {!search && activeFiltersCount === 0 && (
            <Button onClick={onNewEmployee}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          )}
          {(search || activeFiltersCount > 0) && (
            <Button variant="outline" onClick={onClearFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && employees.length > 0 && (
        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-slate-800/50">
              <TableRow>
                {employeeColumns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  {employeeColumns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(employee)
                        : String(employee[column.key as keyof typeof employee] || "")}
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