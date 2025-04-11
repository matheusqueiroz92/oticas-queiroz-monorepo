"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Mail, Phone, User, MapPin, CheckCircle2, XCircle, Edit, ArrowLeft } from "lucide-react";
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
import { InfoSection } from "@/components/Users/InfoSection";
import { InfoField } from "@/components/Users/InfoField";
import type { Laboratory } from "@/app/types/laboratory";
import { PageTitle } from "../PageTitle";

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
    <div className="max-w-4xl mx-auto">
      <PageTitle
        title={"Detalhes do Laboratório"}
        description={"Visualizando dados do laboratório"}
      />
      
      <div className="mt-6">
        <Card className="shadow-sm border">
          <CardHeader className="p-6 bg-gray-50 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  {laboratory.name}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {laboratory.email} 
                  <span className="mx-2">•</span>
                  <Badge variant={laboratory.isActive ? "default" : "destructive"} className="text-sm">
                    {laboratory.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </CardDescription>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-8">
              <InfoSection title="Informações de Contato" icon={<User />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-4 rounded-md border">
                  <InfoField 
                    label="Nome de Contato" 
                    value={laboratory.contactName} 
                    icon={<User />} 
                  />
                  <InfoField 
                    label="Email" 
                    value={laboratory.email} 
                    icon={<Mail />} 
                  />
                  <InfoField 
                    label="Telefone" 
                    value={laboratory.phone} 
                    icon={<Phone />} 
                  />
                  <InfoField 
                    label="Status" 
                    value={laboratory.isActive ? "Ativo" : "Inativo"} 
                    icon={laboratory.isActive ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />} 
                  />
                </div>
              </InfoSection>

              <InfoSection title="Endereço" icon={<MapPin />}>
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
              </InfoSection>
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-between">
              <Button 
                variant="outline" 
                onClick={onGoBack}
              >
                Voltar
              </Button>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={laboratory.isActive ? "destructive" : "default"}
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