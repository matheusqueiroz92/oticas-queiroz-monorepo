"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Mail, Phone, User, MapPin, CheckCircle2, XCircle, Edit } from "lucide-react";
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

import type { Laboratory } from "@/app/_types/laboratory";

interface LaboratoryDetailsCardProps {
  laboratory: Laboratory;
  isTogglingStatus: boolean;
  onToggleStatus: (id: string) => void;
  onGoBack: () => void;
  onEdit: () => void;
}

export function LaboratoryDetailsCard({
  laboratory,
  isTogglingStatus,
  onToggleStatus,
  onGoBack,
  onEdit,
}: LaboratoryDetailsCardProps) {

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mt-6">
        <Card className="shadow-sm border">
          <CardHeader className="p-4 sm:p-6 bg-gray-50 border-b dark:bg-slate-800/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  {laboratory.name}
                </CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {laboratory.email} 
                  <span className="mx-2">•</span>
                  <Badge variant={laboratory.isActive ? "default" : "destructive"} className="text-sm">
                    {laboratory.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </CardDescription>
              </div>
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-8">
              {/* Informações de Contato */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold">Informações de Contato</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4 bg-gray-50 p-4 rounded-md border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Nome de Contato
                    </div>
                    <p className="text-sm">{laboratory.contactName}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="text-sm">{laboratory.email}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </div>
                    <p className="text-sm">{laboratory.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {laboratory.isActive ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      Status
                    </div>
                    <p className="text-sm">{laboratory.isActive ? "Ativo" : "Inativo"}</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold">Endereço</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border">
                  <p className="font-medium">
                    {laboratory.address.street}, {laboratory.address.number}
                    {laboratory.address.complement && `, ${laboratory.address.complement}`}
                  </p>
                  <p className="mt-1">
                    {laboratory.address.neighborhood} - {laboratory.address.city}/{laboratory.address.state}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    CEP: {laboratory.address.zipCode}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 pt-4 border-t flex flex-wrap justify-between gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={onGoBack}
              >
                Voltar
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={laboratory.isActive ? "destructive" : "default"}
                      size="sm"
                      disabled={isTogglingStatus}
                    >
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}