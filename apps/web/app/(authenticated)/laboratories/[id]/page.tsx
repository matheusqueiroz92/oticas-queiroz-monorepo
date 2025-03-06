"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin, Mail, Phone, User, Building } from "lucide-react";
import { api } from "../../../services/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
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

// Interface para laboratório
interface Laboratory {
  _id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function LaboratoryDetailsPage() {
  const { id } = useParams();
  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { canManageLaboratories } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLaboratory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/laboratories/${id}`);
        setLaboratory(response.data);
      } catch (error) {
        console.error("Erro ao buscar detalhes do laboratório:", error);
        setError("Não foi possível carregar os detalhes do laboratório.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLaboratory();
    }
  }, [id]);

  // Função para alternar o status do laboratório (ativar/desativar)
  const toggleStatus = async () => {
    if (!laboratory) return;

    try {
      setStatusLoading(true);
      await api.patch(`/api/laboratories/${laboratory._id}/toggle-status`);

      // Atualizar o laboratório com o novo status
      setLaboratory({
        ...laboratory,
        isActive: !laboratory.isActive,
      });

      toast({
        title: "Status atualizado",
        description: `Laboratório ${laboratory.isActive ? "desativado" : "ativado"} com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao alterar status do laboratório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do laboratório.",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !laboratory) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error || "Laboratório não encontrado."}
        <Button className="mt-4" onClick={() => router.push("/laboratories")}>
          Voltar para Laboratórios
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalhes do Laboratório</h1>
        <Badge
          variant={laboratory.isActive ? "default" : "destructive"}
          className="text-sm px-3 py-1"
        >
          {laboratory.isActive ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{laboratory.name}</CardTitle>
          <CardDescription>
            {laboratory.isActive
              ? "Este laboratório está ativo e pode receber pedidos"
              : "Este laboratório está inativo e não pode receber pedidos"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações de Contato */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Informações de Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">Nome do Contato</p>
                <p>{laboratory.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${laboratory.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {laboratory.email}
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${laboratory.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {laboratory.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Building className="h-5 w-5" /> Endereço
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                <div className="space-y-1">
                  <p>
                    {laboratory.address.street}, {laboratory.address.number}
                    {laboratory.address.complement &&
                      `, ${laboratory.address.complement}`}
                  </p>
                  <p>
                    {laboratory.address.neighborhood}, {laboratory.address.city}
                    /{laboratory.address.state}
                  </p>
                  <p>CEP: {laboratory.address.zipCode}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={() => router.push("/laboratories")}
          >
            Voltar
          </Button>

          {canManageLaboratories && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/laboratories/${laboratory._id}/edit`)
                }
              >
                Editar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={laboratory.isActive ? "destructive" : "default"}
                    disabled={statusLoading}
                  >
                    {statusLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {laboratory.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {laboratory.isActive
                        ? "Desativar laboratório?"
                        : "Ativar laboratório?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {laboratory.isActive
                        ? "Laboratórios inativos não podem ser selecionados para novos pedidos. Você pode ativar o laboratório novamente a qualquer momento."
                        : "Ao ativar o laboratório, ele poderá ser selecionado para novos pedidos."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={toggleStatus}
                      className={
                        laboratory.isActive
                          ? "bg-destructive hover:bg-destructive/90"
                          : ""
                      }
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
