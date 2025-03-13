"use client";

import { useEffect } from "react";
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
import { usePermissions } from "@/hooks/usePermissions";
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
import { useLaboratories } from "@/hooks/useLaboratories";

export default function LaboratoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canManageLaboratories } = usePermissions();

  const {
    currentLaboratory,
    loading,
    error,
    fetchLaboratoryById,
    handleToggleLaboratoryStatus,
    navigateToEditLaboratory,
  } = useLaboratories();

  useEffect(() => {
    if (id) {
      fetchLaboratoryById(id as string);
    }
  }, [id, fetchLaboratoryById]);

  // Status toggle handler
  const toggleStatus = async () => {
    if (!currentLaboratory) return;
    await handleToggleLaboratoryStatus(currentLaboratory._id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !currentLaboratory) {
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
          variant={currentLaboratory.isActive ? "default" : "destructive"}
          className="text-sm px-3 py-1"
        >
          {currentLaboratory.isActive ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentLaboratory.name}</CardTitle>
          <CardDescription>
            {currentLaboratory.isActive
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
                <p>{currentLaboratory.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${currentLaboratory.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {currentLaboratory.email}
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${currentLaboratory.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {currentLaboratory.phone}
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
                    {currentLaboratory.address.street},{" "}
                    {currentLaboratory.address.number}
                    {currentLaboratory.address.complement &&
                      `, ${currentLaboratory.address.complement}`}
                  </p>
                  <p>
                    {currentLaboratory.address.neighborhood},{" "}
                    {currentLaboratory.address.city}/
                    {currentLaboratory.address.state}
                  </p>
                  <p>CEP: {currentLaboratory.address.zipCode}</p>
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
                onClick={() => navigateToEditLaboratory(currentLaboratory._id)}
              >
                Editar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={
                      currentLaboratory.isActive ? "destructive" : "default"
                    }
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {currentLaboratory.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {currentLaboratory.isActive
                        ? "Desativar laboratório?"
                        : "Ativar laboratório?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {currentLaboratory.isActive
                        ? "Laboratórios inativos não podem ser selecionados para novos pedidos. Você pode ativar o laboratório novamente a qualquer momento."
                        : "Ao ativar o laboratório, ele poderá ser selecionado para novos pedidos."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={toggleStatus}
                      className={
                        currentLaboratory.isActive
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
