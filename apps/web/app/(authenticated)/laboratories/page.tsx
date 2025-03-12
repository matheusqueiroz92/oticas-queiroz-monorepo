"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { api } from "../../services/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

// Definir tipos para os parâmetros de busca
interface LaboratorySearchParams {
  search?: string;
}

// Definir tipo para o objeto de erro
interface ApiError {
  status: number;
  message: string;
}

// Definir tipo para o resultado da função fetchWithErrorHandling
interface FetchResult<T> {
  data: T | null;
  error: ApiError | null;
}

// Definir interface para laboratórios
interface Laboratory {
  _id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchLaboratories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usar função auxiliar para lidar com erros da API
        const { data, error: apiError } = await fetchWithErrorHandling<
          | {
              laboratories: Laboratory[];
              pagination?: { totalPages: number; total: number };
            }
          | Laboratory[]
        >("/api/laboratories", {
          search,
        });

        if (apiError) {
          // Se for um erro 404 específico, apenas definimos uma lista vazia
          if (
            apiError.status === 404 &&
            apiError.message === "Nenhum laboratório encontrado"
          ) {
            setLaboratories([]);
          } else {
            // Outros erros são tratados normalmente
            setError(
              "Erro ao carregar laboratórios. Tente novamente mais tarde."
            );
          }
        } else if (data) {
          // Verifica o formato da resposta
          if (Array.isArray(data)) {
            // Se for um array, usa diretamente
            setLaboratories(data);
          } else if (data.laboratories && Array.isArray(data.laboratories)) {
            // Se for um objeto com a propriedade 'laboratories', usa essa propriedade
            setLaboratories(data.laboratories);
          } else {
            // Formato desconhecido
            console.error("Formato de resposta inesperado:", data);
            setLaboratories([]);
          }
        }
      } catch (error) {
        console.error("Erro não tratado:", error);
        setError("Erro ao carregar laboratórios. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchLaboratories();
  }, [search]);

  // Função auxiliar para lidar com erros 404 sem disparar alertas globais
  const fetchWithErrorHandling = async <T,>(
    url: string,
    params: LaboratorySearchParams
  ): Promise<FetchResult<T>> => {
    try {
      const response = await api.get<T>(url, { params });
      return { data: response.data, error: null };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Retornar um objeto de erro estruturado em vez de lançar exceção
        return {
          data: null,
          error: {
            status: error.response.status,
            message: error.response.data?.message || error.message,
          },
        };
      }
      // Para erros não-Axios, passamos adiante
      throw error;
    }
  };

  // Renderizar endereço completo
  const formatAddress = (address: Laboratory["address"]) => {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} - ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  const showEmptyState = !loading && !error && laboratories.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Laboratórios</h1>
      <div className="flex justify-between">
        <Input
          placeholder="Buscar laboratório..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/laboratories/new")}>
          Novo Laboratório
        </Button>
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
            {laboratories.map((lab) => (
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
                    onClick={() => router.push(`/laboratories/${lab._id}`)}
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
