"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Laboratory } from "@/app/types/laboratory";

interface LaboratoryTableProps {
  laboratories: Laboratory[];
  isLoading: boolean;
  error: unknown;
  onViewDetails: (id: string) => void;
}

export function LaboratoryTable({
  laboratories,
  onViewDetails,
}: LaboratoryTableProps) {
  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {laboratories.map((lab: Laboratory) => (
            <TableRow key={lab._id}>
              <TableCell className="font-medium">{lab.name}</TableCell>
              <TableCell>{lab.contactName}</TableCell>
              <TableCell>{lab.phone}</TableCell>
              <TableCell>
                <Badge
                  variant={lab.isActive ? "default" : "destructive"}
                  className="font-medium"
                >
                  {lab.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => onViewDetails(lab._id)}
                >
                  Detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}