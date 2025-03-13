"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLaboratories } from "@/hooks/useLaboratories";
import type { Laboratory } from "@/app/types/laboratory";

export default function LaboratoriesPage() {
  const [search, setSearch] = useState("");

  const {
    laboratories,
    loading,
    error,
    navigateToLaboratoryDetails,
    navigateToCreateLaboratory,
    updateFilters,
  } = useLaboratories();

  const handleSearch = () => {
    updateFilters({ search });
  };

  const showEmptyState = !loading && !error && laboratories.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Laboratórios</h1>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar laboratório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={handleSearch}>
            Buscar
          </Button>
        </div>
        <Button onClick={navigateToCreateLaboratory}>Novo Laboratório</Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <Beaker className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            Não há laboratórios cadastrados
          </h3>
        </div>
      )}

      {!loading && !error && laboratories.length > 0 && (
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
                    onClick={() => navigateToLaboratoryDetails(lab._id)}
                  >
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
