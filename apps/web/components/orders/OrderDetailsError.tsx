interface OrderDetailsErrorProps {
  error?: unknown;
}

export function OrderDetailsError({ error }: OrderDetailsErrorProps) {
  return (
    <div className="max-w-4xl mx-auto p-3">
      <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
        {error instanceof Error ? error.message : String(error) || "Pedido não encontrado ou ocorreu um erro ao carregar os dados."}
      </div>
    </div>
  );
} 