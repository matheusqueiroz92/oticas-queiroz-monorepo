"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserTable } from "../../../components/tables/UserTable";
import { Loader2, UserX } from "lucide-react";
import { api } from "../../services/auth";
import type { Customer } from "../../types/customer";
import type { Column, User } from "@/app/types/user";
import { ErrorAlert } from "@/components/ErrorAlert";
import axios from "axios";

// Definir tipos para os parâmetros de busca
interface UserSearchParams {
  role: string;
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use uma função auxiliar para capturar o erro 404 específico
        const { data, error: apiError } = await fetchWithErrorHandling<User[]>(
          "/api/users",
          {
            role: "customer",
            search,
          }
        );

        if (apiError) {
          // Se for um erro 404 específico, apenas definimos uma lista vazia
          if (
            apiError.status === 404 &&
            apiError.message === "Nenhum usuário com role 'customer' encontrado"
          ) {
            setCustomers([]);
          } else {
            // Outros erros são tratados normalmente
            setError("Erro ao carregar clientes. Tente novamente mais tarde.");
          }
        } else if (data) {
          // Processo normal quando não há erros
          const filteredCustomers = data.filter(
            (user: User) => user.role === "customer"
          );
          setCustomers(filteredCustomers);
        }
      } catch (error) {
        // Este catch só deve ser acionado para erros não tratados pelo fetchWithErrorHandling
        console.error("Erro não tratado:", error);
        setError("Erro ao carregar clientes. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [search]);

  // Função auxiliar para lidar com erros 404 sem disparar alertas globais
  const fetchWithErrorHandling = async <T,>(
    url: string,
    params: UserSearchParams
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

  // Define as colunas para a lista de clientes
  const customerColumns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    {
      key: "purchases",
      header: "Total de Compras",
      render: (customer) => customer.purchases?.length || 0,
    },
    {
      key: "debts",
      header: "Débitos",
      render: (customer) => customer.debts?.toFixed(2) || "0.00",
    },
  ];

  const showEmptyState = !loading && !error && customers.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <div className="flex justify-between">
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/customers/new")}>
          Novo Cliente
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <UserX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Não há clientes cadastrados</h3>
          <p className="text-muted-foreground mt-2">
            Clique em "Novo Cliente" para adicionar um cliente ao sistema.
          </p>
        </div>
      )}

      {!loading && !error && customers.length > 0 && (
        <UserTable
          data={customers}
          columns={customerColumns}
          onDetailsClick={(id) => router.push(`/customers/${id}`)}
        />
      )}
    </div>
  );
}
