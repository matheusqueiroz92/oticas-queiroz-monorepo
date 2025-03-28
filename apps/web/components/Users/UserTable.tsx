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

interface UserTableProps {
  data: User[];
  columns: Column[];
  onDetailsClick: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  data,
  columns,
  onDetailsClick,
}) => {
  return (
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
  );
};
