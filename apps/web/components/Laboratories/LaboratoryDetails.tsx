"use client";

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
import { Loader2, MapPin, Mail, Phone, User, Building } from "lucide-react";
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
import type { Laboratory } from "@/app/types/laboratory";

interface LaboratoryDetailsProps {
  laboratory: Laboratory;
  isLoading: boolean;
  error: unknown;
  isTogglingStatus: boolean;
  canManageLaboratories: boolean;
  onToggleStatus: (id: string) => void;
  onGoBack: () => void;
  onEdit: () => void;
}

export function LaboratoryDetails({
  laboratory,
  isLoading,
  error,
  isTogglingStatus,
  canManageLaboratories,
  onToggleStatus,
  onGoBack,
  onEdit,
}: LaboratoryDetailsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !laboratory) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error instanceof Error ? error.message : "Laboratório não encontrado."}
        <Button className="mt-4" onClick={onGoBack}>
          Voltar para Laboratórios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{laboratory.name}</h1>
        <Badge
          variant={laboratory.isActive ? "default" : "destructive"}
          className="text-sm px-3 py-1"
        >
          {laboratory.isActive ? "Ativo" : "Inativo"}
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
                    <span>{laboratory.contactName}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{laboratory.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{laboratory.email}</span>
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
                        {laboratory.address.street},{" "}
                        {laboratory.address.number}
                        {laboratory.address.complement &&
                          `, ${laboratory.address.complement}`}
                      </p>
                      <p>
                        {laboratory.address.neighborhood} -{" "}
                        {laboratory.address.city}/
                        {laboratory.address.state}
                      </p>
                      <p>CEP: {laboratory.address.zipCode}</p>
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
            onClick={onGoBack}
          >
            Voltar
          </Button>
          {canManageLaboratories && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onEdit}
              >
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={
                      laboratory.isActive ? "destructive" : "default"
                    }
                    disabled={isTogglingStatus}
                  >
                    {isTogglingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {laboratory.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {laboratory.isActive
                        ? "Desativar Laboratório"
                        : "Ativar Laboratório"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {laboratory.isActive
                        ? "Esta ação desativará o laboratório. Isso afetará os pedidos vinculados a ele."
                        : "Esta ação ativará o laboratório."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onToggleStatus(laboratory._id)}>
                      {laboratory.isActive ? "Desativar" : "Ativar"}
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