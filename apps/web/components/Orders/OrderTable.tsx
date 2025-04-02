import React, { useMemo } from "react";
import type { Order } from "@/app/types/order";
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

interface OrderColumn {
  key: string;
  header: string;
  render?: (data: Order) => React.ReactNode;
}

interface OrderTableProps {
  data: Order[];
  columns: OrderColumn[];
  onDetailsClick: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems?: number;
  sortField?: keyof Order;
  sortDirection?: "asc" | "desc";
}

export const OrderTable: React.FC<OrderTableProps> = ({
  data,
  columns,
  onDetailsClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  sortField = "orderDate",
  sortDirection = "desc",
}) => {
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const dataToSort = [...data];
    
    return dataToSort.sort((a, b) => {
      if (sortField === "orderDate" || sortField === "deliveryDate" || sortField === "createdAt") {
        const dateA = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
        const dateB = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
        
        return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
      }
      
      const valueA = String(a[sortField as keyof Order] || "").toLowerCase();
      const valueB = String(b[sortField as keyof Order] || "").toLowerCase();
      
      if (sortDirection === "desc") {
        return valueB.localeCompare(valueA);
      } else {
        return valueA.localeCompare(valueB);
      }
    });
  }, [data, sortField, sortDirection]);

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
      </div>
    );
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
                  {column.render ? column.render(item) : String(item[column.key as keyof Order] ?? "")}
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

      <PaginationItems
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        pageSize={sortedData.length}
      />
    </div>
  );
};