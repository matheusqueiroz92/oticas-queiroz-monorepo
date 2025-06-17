"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/_services/authService";
import { useToast } from "@/hooks/useToast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { PageTitle } from "@/components/ui/page-title";
import { ErrorAlert } from "@/components/ErrorAlert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: payment, isLoading, error, refetch } = useQuery({
    queryKey: ["payment", id],
    queryFn: async () => {
      const response = await api.get(`/api/payments/${id}`);
      return response.data;
    }
  });

  const updateCheckStatus = async (newStatus: "compensated" | "rejected") => {
    try {
      setIsUpdating(true);
      
      await api.put(`/api/payments/${id}/check-status`, {
        status: newStatus,
        rejectionReason: newStatus === "rejected" ? rejectionReason : undefined
      });

      toast({
        title: "Status atualizado",
        description: `O cheque foi marcado como ${newStatus === "compensated" ? "compensado" : "rejeitado"}.`
      });

      // Fechar o diálogo se estiver aberto
      setIsRejectDialogOpen(false);
      
      // Resetar o motivo de rejeição
      setRejectionReason("");
      
      // Atualizar os dados
      await refetch();
    } catch (error) {
      console.error("Erro ao atualizar status do cheque:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do cheque."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsCompensated = async () => {
    const confirm = window.confirm("Confirma que este cheque foi compensado?");
    if (confirm) {
      await updateCheckStatus("compensated");
    }
  };

  const handleMarkAsRejected = async () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "É necessário informar o motivo da rejeição."
      });
      return;
    }
    
    await updateCheckStatus("rejected");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            Pendente
          </Badge>
        );
      case "compensated":
        return (
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Compensado
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 px-3 py-1">
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Carregando detalhes do cheque...</p>
      </div>
    );
  }

  if (error || !payment || !payment.check) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <ErrorAlert message="Erro ao carregar os detalhes do cheque. Verifique se este pagamento foi feito com cheque." />
      </div>
    );
  }

  const check = payment.check;
  const isPending = check.compensationStatus === "pending";

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <PageTitle
          title="Detalhes do Cheque"
          description={`Informações completas do cheque #${check.checkNumber}`}
        />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detalhes do Cheque
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Informações de Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Dados do Cheque</CardTitle>
                  {getStatusBadge(check.compensationStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-primary" />
                      Número do Cheque
                    </h3>
                    <p className="font-medium">{check.checkNumber}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <Building className="h-4 w-4 mr-2 text-primary" />
                      Banco
                    </h3>
                    <p className="font-medium">{check.bank}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      Titular
                    </h3>
                    <p className="font-medium">{check.accountHolder}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-primary" />
                      Valor
                    </h3>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      Data do Cheque
                    </h3>
                    <p className="font-medium">{formatDate(check.checkDate)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      Data de Apresentação
                    </h3>
                    <p className="font-medium">
                      {check.presentationDate
                        ? formatDate(check.presentationDate)
                        : "Imediata"}
                    </p>
                  </div>

                  {check.compensationStatus === "rejected" && check.rejectionReason && (
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        Motivo da Rejeição
                      </h3>
                      <p className="font-medium text-red-600">{check.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {isPending && (
                <CardFooter className="border-t pt-6 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    onClick={handleMarkAsCompensated}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Compensado
                  </Button>
                  
                  <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        disabled={isUpdating}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Marcar como Rejeitado
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Marcar Cheque como Rejeitado</DialogTitle>
                        <DialogDescription>
                          Informe o motivo da rejeição do cheque. Essa informação será utilizada para controle interno.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <Label htmlFor="rejectionReason" className="text-left block mb-2">
                          Motivo da Rejeição
                        </Label>
                        <Input
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full"
                          placeholder="Ex: Fundos insuficientes, Assinatura divergente, etc."
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsRejectDialogOpen(false)}
                          disabled={isUpdating}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleMarkAsRejected}
                          disabled={isUpdating || !rejectionReason.trim()}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Confirmar Rejeição
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                {payment.customerId ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Nome</h3>
                      <p className="font-medium">{payment.customerId.name}</p>
                    </div>
                    
                    {payment.customerId.email && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                        <p className="font-medium">{payment.customerId.email}</p>
                      </div>
                    )}
                    
                    {payment.customerId.phone && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Telefone</h3>
                        <p className="font-medium">{payment.customerId.phone}</p>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => router.push(`/customers/${payment.customerId._id}`)}
                    >
                      Ver Detalhes do Cliente
                    </Button>
                  </div>
                ) : payment.legacyClientId ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Nome</h3>
                      <p className="font-medium">{payment.legacyClientId.name}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                      <Badge variant="outline">Cliente Legado</Badge>
                    </div>
                    
                    {payment.legacyClientId.phone && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Telefone</h3>
                        <p className="font-medium">{payment.legacyClientId.phone}</p>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => router.push(`/legacy-clients/${payment.legacyClientId._id}`)}
                    >
                      Ver Detalhes do Cliente
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Este cheque não está associado a nenhum cliente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Pagamento</CardTitle>
              <CardDescription>
                Detalhes da transação associada a este cheque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">ID do Pagamento</h3>
                  <p className="font-medium">{payment._id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Data do Pagamento</h3>
                  <p className="font-medium">{formatDate(payment.date)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Valor</h3>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Método de Pagamento</h3>
                  <p className="font-medium">Cheque</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                  <p className="font-medium">
                    {payment.type === "sale" && "Venda"}
                    {payment.type === "debt_payment" && "Pagamento de Dívida"}
                    {payment.type === "expense" && "Despesa"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                  <p className="font-medium">
                    {payment.status === "completed" && "Concluído"}
                    {payment.status === "pending" && "Pendente"}
                    {payment.status === "cancelled" && "Cancelado"}
                  </p>
                </div>
                
                {payment.description && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                    <p className="font-medium">{payment.description}</p>
                  </div>
                )}
                
                {payment.orderId && (
                  <div className="col-span-2 mt-2">
                    <Separator className="mb-4" />
                    <h3 className="text-sm font-medium mb-2">Pedido Associado</h3>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/orders/${payment.orderId}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Detalhes do Pedido
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/payments/${payment._id}`)}
              >
                Ver Detalhes Completos do Pagamento
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}