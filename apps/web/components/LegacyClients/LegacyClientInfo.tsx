import { LegacyClient } from "@/app/_types/legacy-client";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { CheckCircle, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LegacyClientInfoProps {
  client: LegacyClient | null;
}

export function LegacyClientInfo({ client }: LegacyClientInfoProps) {
  if (!client) return null;

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "-";
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Informações Pessoais</h3>
          <div className="mt-3 space-y-3">
            <div>
              <span className="block text-sm text-gray-500">Nome</span>
              <span className="block font-medium">{client.name}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">CPF</span>
              <span className="block font-medium">{formatCPF(client.cpf)}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">Telefone</span>
              <span className="block font-medium">{formatPhone(client.phone)}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">E-mail</span>
              <span className="block font-medium">{client.email || "-"}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Informações Financeiras</h3>
          <div className="mt-3 space-y-3">
            <div>
              <span className="block text-sm text-gray-500">Dívida Total</span>
              <span className={`block font-medium ${client.totalDebt > 0 ? "text-red-600" : ""}`}>
                {formatCurrency(client.totalDebt)}
              </span>
            </div>
            {client.lastPayment && (
              <div>
                <span className="block text-sm text-gray-500">Último Pagamento</span>
                <span className="block font-medium">
                  {formatCurrency(client.lastPayment.amount)} em {formatDate(client.lastPayment.date)}
                </span>
              </div>
            )}
            <div>
              <span className="block text-sm text-gray-500">Status</span>
              <span className="flex items-center font-medium">
                {client.status === "active" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    Ativo
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1 text-gray-600" />
                    Inativo
                  </>
                )}
              </span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">Data de Cadastro</span>
              <span className="block font-medium">{formatDate(client.createdAt!)}</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {client.address && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm text-gray-500">Logradouro</span>
              <span className="block font-medium">
                {client.address.street}, {client.address.number}
                {client.address.complement && ` - ${client.address.complement}`}
              </span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">Bairro</span>
              <span className="block font-medium">{client.address.neighborhood}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">Cidade/UF</span>
              <span className="block font-medium">
                {client.address.city}/{client.address.state}
              </span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">CEP</span>
              <span className="block font-medium">
                {client.address.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")}
              </span>
            </div>
          </div>
        </div>
      )}

      {client.observations && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Observações</h3>
          <p className="text-sm text-gray-800 whitespace-pre-line">{client.observations}</p>
        </div>
      )}
    </div>
  );
}