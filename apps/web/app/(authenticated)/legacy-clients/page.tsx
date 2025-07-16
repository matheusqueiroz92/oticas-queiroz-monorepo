"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationItems } from "@/components/PaginationItems";
import { useRouter } from "next/navigation";
import { useLegacyClients } from "@/hooks/laboratories/useLegacyClients";
import { LegacyClientsTable } from "@/components/legacy-clients/LegacyClientsTable";
import { Search, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LegacyClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const { useLegacyClientsList, navigateToCreateLegacyClient } = useLegacyClients();

  const { data, isLoading } = useLegacyClientsList({
    page: currentPage,
    search,
    status: filter,
  });

  const clients = data?.clients || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <Card>
        <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Lista de Clientes</CardTitle>
          <Button onClick={navigateToCreateLegacyClient}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  className="pl-8"
                  placeholder="Buscar por nome ou CPF..."
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  Todos
                </Button>
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter("active");
                    setCurrentPage(1);
                  }}
                >
                  Ativos
                </Button>
                <Button
                  variant={filter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter("inactive");
                    setCurrentPage(1);
                  }}
                >
                  Inativos
                </Button>
              </div>
            </div>

            <LegacyClientsTable
              clients={clients}
              isLoading={isLoading}
              onViewDetails={(id) => router.push(`/legacy-clients/${id}`)}
            />

            <div className="flex justify-center">
              <PaginationItems
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                totalItems={data?.pagination?.total}
                pageSize={10}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}