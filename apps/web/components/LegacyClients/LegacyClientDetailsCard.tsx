import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  User,
  Phone,
  Mail,
  Map,
  Edit,
  ArrowLeft,
  CheckCircle2,
  Ban,
  CalendarClock,
  FileText,
  Eye,
  Building,
  MapPin,
} from "lucide-react";
import { LegacyClient } from "@/app/types/legacy-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate } from "@/app/utils/formatters";

interface LegacyClientDetailsCardProps {
  client: LegacyClient;
  onToggleStatus?: (id: string) => Promise<void>;
  isTogglingStatus?: boolean;
}

export function LegacyClientDetailsCard({
  client,
  onToggleStatus,
  isTogglingStatus = false,
}: LegacyClientDetailsCardProps) {
  const router = useRouter();

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const handleToggleStatus = async () => {
    if (onToggleStatus) {
      await onToggleStatus(client._id);
    }
  };

  const handleEditClient = () => {
    router.push(`/legacy-clients/${client._id}/edit`);
  };

  const handleGoBack = () => {
    router.push("/legacy-clients");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="pl-0 hover:bg-transparent hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Cliente Legado</h1>
        </div>
        <div>
          <Badge
            variant="outline"
            className={
              client.status === "active"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {client.status === "active" ? (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            ) : (
              <Ban className="h-3.5 w-3.5 mr-1" />
            )}
            {client.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm text-gray-500">Nome Completo</h3>
              <p className="font-medium">{client.name}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">CPF</h3>
              <p className="font-medium">{formatCpf(client.cpf)}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Cadastrado em</h3>
              <p className="font-medium">
                {client.createdAt ? formatDate(client.createdAt) : "Data não disponível"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Financeiras */}
      <Card className={client.totalDebt > 0 ? "border-red-200" : ""}>
        <CardHeader className={`pb-2 ${client.totalDebt > 0 ? "bg-red-50" : ""}`}>
          <CardTitle className="text-xl flex items-center">
            <DollarSign className={`h-5 w-5 mr-2 ${client.totalDebt > 0 ? "text-red-500" : "text-primary"}`} />
            Informações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">Valor da Dívida</h3>
                <p className={`text-xl font-bold ${client.totalDebt > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(client.totalDebt)}
                </p>
              </div>

              {client.lastPayment && (
                <div>
                  <h3 className="text-sm text-gray-500">Último Pagamento</h3>
                  <div className="flex items-center gap-6 mt-1">
                    <div>
                      <span className="text-xs text-gray-500">Data</span>
                      <p className="font-medium">
                        {formatDate(client.lastPayment.date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Valor</span>
                      <p className="font-medium text-green-600">
                        {formatCurrency(client.lastPayment.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm text-gray-500 mb-2">Histórico de Pagamentos</h3>
              {client.paymentHistory && client.paymentHistory.length > 0 ? (
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-md p-2">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500">
                      <tr>
                        <th className="text-left p-1">Data</th>
                        <th className="text-right p-1">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.paymentHistory
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((payment, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="p-1">{formatDate(payment.date)}</td>
                            <td className="text-right p-1 text-green-600">
                              {formatCurrency(payment.amount)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-md p-3 text-gray-500 text-sm">
                  Nenhum pagamento registrado.
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                {client.paymentHistory.length} pagamentos registrados
              </div>
            </div>
          </div>

          {client.totalDebt > 0 && (
            <div className="mt-6 bg-red-50 p-3 rounded-md border border-red-200">
              <div className="flex items-start gap-2 text-red-700">
                <DollarSign className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Atenção: Cliente com dívida pendente</p>
                  <p className="text-sm mt-1">
                    Este cliente possui uma dívida de {formatCurrency(client.totalDebt)} que ainda não foi quitada.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contato e Endereço */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center">
            <Phone className="h-5 w-5 mr-2 text-primary" />
            Contato e Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium flex items-center">
                <Phone className="h-4 w-4 mr-2 text-primary" />
                Informações de Contato
              </h3>
              
              <div className="bg-gray-50 p-3 rounded-md">
                {client.phone || client.email ? (
                  <div className="space-y-2">
                    {client.phone && (
                      <div>
                        <h4 className="text-xs text-gray-500">Telefone</h4>
                        <p className="font-medium">{client.phone}</p>
                      </div>
                    )}
                    {client.email && (
                      <div>
                        <h4 className="text-xs text-gray-500">Email</h4>
                        <p className="font-medium">{client.email}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Nenhuma informação de contato disponível.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                Endereço
              </h3>
              
              <div className="bg-gray-50 p-3 rounded-md">
                {client.address ? (
                  <div className="space-y-2">
                    <p className="font-medium">
                      {client.address.street}, {client.address.number}
                      {client.address.complement && `, ${client.address.complement}`}
                    </p>
                    <p className="text-sm">
                      {client.address.neighborhood}, {client.address.city} - {client.address.state}
                    </p>
                    <p className="text-sm text-gray-500">
                      CEP: {client.address.zipCode.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Nenhum endereço cadastrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {client.observations && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="whitespace-pre-line">{client.observations}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex space-x-3">
          <Button onClick={handleEditClient} className="gap-2">
            <Edit className="h-4 w-4" />
            Editar Cliente
          </Button>
          
          {onToggleStatus && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={client.status === "active" ? "destructive" : "outline"}
                  disabled={isTogglingStatus || (client.status === "active" && client.totalDebt > 0)}
                  className="gap-2"
                >
                  {client.status === "active" ? (
                    <Ban className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {client.status === "active" ? "Desativar" : "Ativar"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {client.status === "active" 
                      ? "Desativar cliente" 
                      : "Ativar cliente"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {client.status === "active"
                      ? `Tem certeza que deseja desativar o cliente "${client.name}"? 
                         Isso impedirá o registro de novas operações para este cliente.`
                      : `Tem certeza que deseja ativar o cliente "${client.name}"?`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleToggleStatus}
                    className={client.status === "active" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    {client.status === "active" ? "Desativar" : "Ativar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}