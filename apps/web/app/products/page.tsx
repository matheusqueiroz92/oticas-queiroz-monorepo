"use client"; // Marca o componente como Client Component

import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../services/auth";
import type { Product } from "../types/product";

type ApiResponse = {
  products: Product[]; // Array de produtos
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

export default function Products() {
  // Usando useQuery com a nova API
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["products"], // Chave da query
    queryFn: fetchProducts, // Função para buscar os dados
  });

  if (isLoading) return <div>Carregando...</div>;
  if (isError) return <div>Erro ao carregar produtos</div>;

  // Verifique se data.products é um array antes de usar .map()
  if (!Array.isArray(data?.products)) {
    return <div>Dados inválidos recebidos da API</div>;
  }

  return (
    <div>
      <h1>Produtos</h1>
      <ul>
        {data.products.map((product) => (
          <li key={product._id}>
            {product.name} - R$ {product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
