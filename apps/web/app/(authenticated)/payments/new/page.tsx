"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PaymentForm } from "../../../../components/forms/PaymentForm";
import { usePayments } from "../../../../hooks/usePayments";
import type { CreatePaymentDTO } from "@/app/types/payment";

export default function NewPaymentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { handleCreatePayment } = usePayments();

  const handleSubmit = async (data: CreatePaymentDTO) => {
    setIsSubmitting(true);
    try {
      const result = await handleCreatePayment(data);
      if (result) {
        // Redirecionar para a página de detalhes do pagamento
        router.push(`/payments/${result._id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/payments")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Novo Pagamento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Pagamento</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para registrar um novo pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
}
