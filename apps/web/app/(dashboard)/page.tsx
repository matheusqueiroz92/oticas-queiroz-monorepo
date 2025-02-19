"use client"; // Marca o componente como Client Component

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Função para buscar os dados do dashboard
const fetchDashboardData = async () => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`
  );
  return response.data;
};

export default function Dashboard() {
  // Usando useQuery com a nova API
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"], // Chave da query
    queryFn: fetchDashboardData, // Função para buscar os dados
  });

  if (isLoading) return <div>Carregando...</div>;
  if (isError) return <div>Erro ao carregar dados</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
