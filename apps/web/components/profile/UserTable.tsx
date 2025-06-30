import { useMemo } from "react";
import type { Column, User } from "@/app/_types/user";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationItems } from "@/components/PaginationItems";
import { Eye, Pencil } from "lucide-react";

interface UserTableProps {
  data: User[];
  columns: Column[];
  onDetailsClick: (id: string) => void;
  onEditClick?: (user: User) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  sortField?: keyof User;
  sortDirection?: "asc" | "desc";
}

export function UserTable({
  data,
  columns,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  pageSize,
  sortField = "name",
  sortDirection = "asc",
}: UserTableProps) {
  const sortedData = useMemo(() => {
    const dataToSort = [...data];
    
    return dataToSort.sort((a, b) => {
      const valueA = String(a[sortField] || "").toLowerCase();
      const valueB = String(b[sortField] || "").toLowerCase();
      
      if (sortDirection === "asc") {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  }, [data, sortField, sortDirection]);

  if (sortedData.length === 0) {
    return <div className="text-center py-4">Nenhum usuário encontrado.</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader className="bg-gray-100 dark:bg-slate-800/50">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => (
            <TableRow key={item._id}>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render
                    ? column.render(item)
                    : (() => {
                        const value = item[column.key as keyof User];
                        // Se for Date, formata para string legível
                        if (value instanceof Date) {
                          return value.toLocaleDateString("pt-BR");
                        }
                        // Se for undefined ou null, retorna vazio
                        if (value === undefined || value === null) {
                          return "";
                        }
                        // Para outros tipos, converte para string
                        return String(value);
                      })()}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDetailsClick(item._id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                  </Button>
                  
                  {onEditClick && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditClick(item)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>
              </TableCell>
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
              pageSize={pageSize}
            />
          )}
      </div>

    </div>
  );
};