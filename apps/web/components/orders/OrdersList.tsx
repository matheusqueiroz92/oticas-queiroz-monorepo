import { useMemo } from "react";
import type { Order } from "@/app/_types/order";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationItems } from "../PaginationItems";
import { Eye, Pencil } from "lucide-react";

interface OrderTableProps {
  data: Order[];
  columns: {
    key: string;
    header: string;
    render?: (item: Order) => React.ReactNode;
  }[];
  onDetailsClick: (id: string) => void;
  onEditClick: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export const OrdersList: React.FC<OrderTableProps> = ({
  data,
  columns,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  sortField = "createdAt",
  sortDirection = "desc",
}) => {
  const sortedData = useMemo(() => {
    const dataToSort = [...data];
    
    return dataToSort.sort((a, b) => {
      // Obter valores considerando nested objects (com dot notation)
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => {
          return prev ? prev[curr] : null;
        }, obj);
      };

      const valueA = getNestedValue(a, sortField) || "";
      const valueB = getNestedValue(b, sortField) || "";
      
      // Comparar datas
      if (sortField === "createdAt" || sortField === "updatedAt") {
        const dateA = new Date(valueA).getTime();
        const dateB = new Date(valueB).getTime();
        
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      
      // Comparar strings
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Comparar números
      return sortDirection === "asc"
        ? Number(valueA) - Number(valueB)
        : Number(valueB) - Number(valueA);
    });
  }, [data, sortField, sortDirection]);

  if (sortedData.length === 0) {
    return <div className="text-center py-4">Nenhum pedido encontrado.</div>;
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
                  {column.render ? column.render(item) : String(item[column.key as keyof Order] ?? "")}
                </TableCell>
              ))}
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => onDetailsClick(item._id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => onEditClick(item._id)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
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
          pageSize={10}
        />
      )}
    </div>
  );
};
