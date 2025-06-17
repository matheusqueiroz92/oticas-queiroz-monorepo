"use client";

import { Edit, Mail, Phone, MapPin, Calendar, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { User } from "@/app/_types/user";

interface ProfileCardProps {
  user: User;
  getUserImageUrl: (imagePath?: string) => string;
  onEditClick: () => void;
}

export function ProfileCard({ user, getUserImageUrl, onEditClick }: ProfileCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "employee":
        return "Funcionário";
      case "customer":
        return "Cliente";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "employee":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "customer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // const formatDate = (dateString?: string) => {
  //   if (!dateString) return "Não informado";
  //   return new Date(dateString).toLocaleDateString("pt-BR");
  // };

  const getFullAddress = () => {
    if (!user.address) return "Não informado";
    return user.address;
  };

  return (
    <Card className="w-full max-w-md mx-auto mr-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-xl">
      <CardContent className="p-0">
        {/* Header com gradiente */}
        <div className="relative h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage
                src={getUserImageUrl(user.image)}
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xl font-bold bg-white text-slate-700">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <Button
            onClick={onEditClick}
            size="sm"
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
            variant="outline"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        </div>

        {/* Conteúdo do perfil */}
        <div className="pt-16 pb-6 px-6 text-center">
          {/* Nome e cargo */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              {user.name}
            </h2>
            <Badge className={`${getRoleColor(user.role)} font-medium`}>
              {getRoleLabel(user.role)}
            </Badge>
          </div>

          {/* Informações de contato */}
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Telefone</p>
                <p className="text-sm">{user.phone || "Não informado"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Endereço</p>
                <p className="text-sm">{getFullAddress()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Membro desde</p>
                <p className="text-sm">Janeiro 2024</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 