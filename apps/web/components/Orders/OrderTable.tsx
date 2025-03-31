import React from "react";
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
}

export const OrderTable: React.FC<OrderTableProps> = ({
  data,
  columns,
  onDetailsClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
}) => {
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
          {data.map((item) => (
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
        pageSize={data.length}
      />
    </div>
  );
};