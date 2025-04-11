import { useMemo } from "react";
import type { Column, User } from "@/app/types/user";
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

interface UserTableProps {
  data: User[];
  columns: Column[];
  onDetailsClick: (id: string) => void;
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
        <TableHeader>
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
                    : item[column.key as keyof User]}
                </TableCell>
              ))}
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => onDetailsClick(item._id)}
                >
                  Detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
  );
};