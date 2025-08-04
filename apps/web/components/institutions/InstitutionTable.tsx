"use client";

import { useMemo } from "react";
import { Institution } from "@/app/_types/institution";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Building, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/useUsers";

interface InstitutionTableProps {
  data: Institution[];
  onDetailsClick: (id: string) => void;
  onEditClick: (institution: Institution) => void;
  sortField?: keyof Institution;
  sortDirection?: "asc" | "desc";
}

export function InstitutionTable({
  data,
  onDetailsClick,
  onEditClick,
  sortField = "name",
  sortDirection = "asc",
}: InstitutionTableProps) {
  const { getUserImageUrl } = useUsers();
  
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

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return "-";
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  if (sortedData.length === 0) {
    return <div className="text-center py-4">Nenhuma instituição encontrada.</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instituição</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Ramo de Atividade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => (
            <TableRow key={item._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={getUserImageUrl(item.image)} 
                      alt={item.name} 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Building className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.email || "Sem email"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {formatCNPJ(item.cnpj)}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="text-sm">{item.phone || "Sem telefone"}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.contactPerson || "Sem contato"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {item.industryType || "Não informado"}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.status === "active" ? "default" : "secondary"}
                  className={
                    item.status === "active" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {item.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDetailsClick(item._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditClick(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}