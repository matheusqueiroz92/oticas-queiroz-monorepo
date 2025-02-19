"use client"; // Marca o componente como Client Component

import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../services/auth";
import type { Product } from "../types/product"; // Importe o tipo Product

export default function Products() {
  // Usando useQuery com a nova API
  const { data, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["products"], // Chave da query
    queryFn: fetchProducts, // Função para buscar os dados
  });

  if (isLoading) return <div>Carregando...</div>;
  if (isError) return <div>Erro ao carregar produtos</div>;

  return (
    <div>
      <h1>Produtos</h1>
      <ul>
        {data?.map((product) => (
          <li key={product._id}>
            {product.name} - R$ {product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
