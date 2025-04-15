"use client";

import { useMemo } from "react";
import { Institution } from "@/app/types/institution";
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
import { Eye, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/useUsers";

interface InstitutionTableProps {
  data: Institution[];
  onDetailsClick: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  sortField?: keyof Institution;
  sortDirection?: "asc" | "desc";
}

export function InstitutionTable({
  data,
  onDetailsClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  pageSize,
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
              <TableCell>{formatCNPJ(item.cnpj)}</TableCell>
              <TableCell>
                {item.contactPerson ? (
                  <div>
                    <p>{item.contactPerson}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.phone || "Sem telefone"}
                    </p>
                  </div>
                ) : (
                  "Não informado"
                )}
              </TableCell>
              <TableCell>
                {item.industryType ? (
                  <Badge variant="outline" className="bg-primary/5 text-primary">
                    {item.industryType}
                  </Badge>
                ) : (
                  "Não informado"
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDetailsClick(item._id)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
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
}