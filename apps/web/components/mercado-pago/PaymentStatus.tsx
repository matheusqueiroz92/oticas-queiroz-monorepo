import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentStatusProps {
  status: 'pending' | 'approved' | 'in_process' | 'rejected' | 'refunded' | 'cancelled' | 'in_mediation' | 'charged_back' | null;
  preferenceId?: string;
  paymentId?: string;
  isLoading?: boolean;
  onRefreshStatus?: () => void;
  onClose?: () => void;
}

export function PaymentStatus({ 
  status, 
  preferenceId, 
  paymentId, 
  isLoading,
  onRefreshStatus,
  onClose
}: PaymentStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          title: 'Pagamento Aprovado!',
          description: 'Seu pagamento foi processado com sucesso.',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-8 w-8 text-green-600" />
        };
      case 'pending':
        return {
          title: 'Pagamento Pendente',
          description: 'Seu pagamento está sendo processado.',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="h-8 w-8 text-yellow-600" />
        };
      case 'in_process':
        return {
          title: 'Pagamento em Processamento',
          description: 'Seu pagamento está sendo analisado.',
          color: 'bg-blue-100 text-blue-800',
          icon: <Clock className="h-8 w-8 text-blue-600" />
        };
      case 'rejected':
        return {
          title: 'Pagamento Rejeitado',
          description: 'Houve um problema com seu pagamento. Por favor, tente novamente.',
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-8 w-8 text-red-600" />
        };
      case 'refunded':
      case 'cancelled':
      case 'charged_back':
        return {
          title: 'Pagamento Cancelado',
          description: 'Seu pagamento foi cancelado ou estornado.',
          color: 'bg-gray-100 text-gray-800',
          icon: <XCircle className="h-8 w-8 text-gray-600" />
        };
      default:
        return {
          title: 'Status de Pagamento',
          description: 'Consultando status do pagamento...',
          color: 'bg-gray-100 text-gray-800',
          icon: <Clock className="h-8 w-8 text-gray-600" />
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
        <CardDescription>{statusInfo.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-center py-3">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            statusInfo.icon
          )}
        </div>

        {status && (
          <div className="flex justify-center">
            <Badge className={statusInfo.color}>
              {status === 'approved' ? 'Aprovado' :
              status === 'pending' ? 'Pendente' :
              status === 'in_process' ? 'Em Processamento' :
              status === 'rejected' ? 'Rejeitado' :
              status === 'refunded' ? 'Reembolsado' :
              status === 'cancelled' ? 'Cancelado' :
              status === 'charged_back' ? 'Estornado' :
              status === 'in_mediation' ? 'Em Mediação' : 'Desconhecido'}
            </Badge>
          </div>
        )}

        {(preferenceId || paymentId) && (
          <div className="text-xs text-center text-gray-500 pt-2">
            {preferenceId && <div>Preferência: {preferenceId}</div>}
            {paymentId && <div>Pagamento: {paymentId}</div>}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-3 border-t">
        {onRefreshStatus && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshStatus}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Status'
            )}
          </Button>
        )}
        
        {onClose && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={onClose}
            className="text-xs"
          >
            Fechar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}