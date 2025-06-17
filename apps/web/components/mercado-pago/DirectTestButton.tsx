import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/useToast';
import { createTestPreference } from "@/app/_services/mercadoPagoService";

interface DirectTestButtonProps {
  amount?: number;
  description?: string;
  className?: string;
}

export function DirectTestButton({ 
  amount = 100, 
  description = "Teste Óticas Queiroz", 
  className = "" 
}: DirectTestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log(`Iniciando teste direto com valor ${amount} e descrição "${description}"`);
      
      // Chamar API para criar preferência de teste
      const response = await createTestPreference(amount, description);
      
      console.log('Resposta da API:', response);
      
      // Obter URL de pagamento (sandbox em ambiente de desenvolvimento)
      const url = response.sandbox_init_point || response.init_point;
      
      if (!url) {
        throw new Error("URL de pagamento não encontrada na resposta");
      }
      
      setPaymentUrl(url);
      toast({
        title: "Link de pagamento gerado",
        description: "Redirecionando para a página de pagamento...",
      });
      
      // Abrir em nova janela
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erro ao gerar link de pagamento:", error);
      
      toast({
        variant: "destructive",
        title: "Erro ao gerar link de pagamento",
        description: error instanceof Error 
          ? error.message 
          : "Erro desconhecido ao processar o pagamento",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      className={`flex items-center gap-2 ${className}`}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Teste Direto (R$ {amount})
        </>
      )}
    </Button>
  );
}