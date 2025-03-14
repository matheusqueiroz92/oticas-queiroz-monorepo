"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { getLaboratoryById } from "@/app/services/laboratoryService";
import { QUERY_KEYS } from "@/app/constants/query-keys";

export default function LaboratoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canManageLaboratories } = usePermissions();

  const { handleToggleLaboratoryStatus, navigateToEditLaboratory } =
    useLaboratories();

  // Utilize React Query para buscar os dados do laboratório
  const {
    data: currentLaboratory,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.LABORATORIES.DETAIL(id as string),
    queryFn: () => getLaboratoryById(id as string),
    enabled: !!id,
  });

  // Mutation para alternar o status do laboratório
  const toggleStatusMutation = useMutation({
    mutationFn: handleToggleLaboratoryStatus,
    onSuccess: () => {
      refetch(); // Recarregar os dados após alteração do status
    },
  });

  // Status toggle handler
  const toggleStatus = async () => {
    if (!currentLaboratory) return;
    await toggleStatusMutation.mutateAsync(currentLaboratory._id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !currentLaboratory) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error instanceof Error ? error.message : "Laboratório não encontrado."}
        <Button className="mt-4" onClick={() => router.push("/laboratories")}>
          Voltar para Laboratórios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{currentLaboratory.name}</h1>
        <Badge
          variant={currentLaboratory.isActive ? "default" : "destructive"}
          className="text-sm px-3 py-1"
        >
          {currentLaboratory.isActive ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Informações do Laboratório
          </CardTitle>
          <CardDescription>
            Detalhes de contato e endereço do laboratório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Informações de Contato
                </h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{currentLaboratory.contactName}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{currentLaboratory.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{currentLaboratory.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                    <div>
                      <p>
                        {currentLaboratory.address.street},{" "}
                        {currentLaboratory.address.number}
                        {currentLaboratory.address.complement &&
                          `, ${currentLaboratory.address.complement}`}
                      </p>
                      <p>
                        {currentLaboratory.address.neighborhood} -{" "}
                        {currentLaboratory.address.city}/
                        {currentLaboratory.address.state}
                      </p>
                      <p>CEP: {currentLaboratory.address.zipCode}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/laboratories")}
          >
            Voltar
          </Button>
          {canManageLaboratories && (
            <div className="flex space-x-2">
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
                    disabled={toggleStatusMutation.isPending}
                  >
                    {toggleStatusMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {currentLaboratory.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {currentLaboratory.isActive
                        ? "Desativar Laboratório"
                        : "Ativar Laboratório"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {currentLaboratory.isActive
                        ? "Esta ação desativará o laboratório. Isso afetará os pedidos vinculados a ele."
                        : "Esta ação ativará o laboratório."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={toggleStatus}>
                      {currentLaboratory.isActive ? "Desativar" : "Ativar"}
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
