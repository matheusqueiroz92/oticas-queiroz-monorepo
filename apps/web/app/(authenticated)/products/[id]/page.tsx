"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../services/auth";
import type { Product } from "../../../types/product";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detalhes do Produto</h1>
      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Categoria: {product.category}</p>
          <p>Marca: {product.brand}</p>
          <p>Descrição: {product.description}</p>
          <p>Preço: R$ {product.price}</p>
          <p>Estoque: {product.stock}</p>
        </CardContent>
      </Card>
    </div>
  );
}
